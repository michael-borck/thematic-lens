import Store from 'electron-store';
import type { AppSettings, ProviderName } from '../shared/types';

// electron-store is the settings of record (main process only). API keys live
// here but are NEVER returned to the renderer — the renderer only ever sees a
// boolean "is a key set?" per provider. Keys are resolved into the engine
// subprocess env in main, the insight-lens "effective key" pattern.

const KEY_ENV: Record<ProviderName, string | null> = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  grok: 'XAI_API_KEY',
  gemini: 'GEMINI_API_KEY',
  ollama: null, // local, keyless
};

interface StoreShape {
  enginePath: string;
  panel: string;
  rounds: number;
  apiKeys: Partial<Record<ProviderName, string>>;
}

const store = new Store<StoreShape>({
  defaults: {
    enginePath: 'thematic-analyser', // assumed on PATH (pipx/uv); see README
    panel: 'anthropic:claude-opus-4-8, openai:gpt-4o',
    rounds: 2,
    apiKeys: {},
  },
});

/** Non-secret settings for the renderer. */
export function getSettings(): AppSettings {
  return {
    enginePath: store.get('enginePath'),
    panel: store.get('panel'),
    rounds: store.get('rounds'),
  };
}

export function updateSettings(patch: Partial<AppSettings>): AppSettings {
  if (patch.enginePath !== undefined) store.set('enginePath', patch.enginePath);
  if (patch.panel !== undefined) store.set('panel', patch.panel);
  if (patch.rounds !== undefined) store.set('rounds', patch.rounds);
  return getSettings();
}

export function setApiKey(provider: ProviderName, key: string): void {
  const keys = store.get('apiKeys');
  if (key) keys[provider] = key;
  else delete keys[provider];
  store.set('apiKeys', keys);
}

/** Which providers have a key set (stored or in the ambient env) — booleans only. */
export function keyStatus(): Record<ProviderName, boolean> {
  const keys = store.get('apiKeys');
  const out = {} as Record<ProviderName, boolean>;
  for (const p of Object.keys(KEY_ENV) as ProviderName[]) {
    const env = KEY_ENV[p];
    out[p] = p === 'ollama' || !!keys[p] || (env ? !!process.env[env] : false);
  }
  return out;
}

/**
 * Build the env for the engine subprocess: the effective key per provider
 * (stored key wins, else the ambient env var passes through), plus the coder
 * panel. Resolved here and nowhere else.
 */
export function engineEnv(panelOverride?: string): NodeJS.ProcessEnv {
  const keys = store.get('apiKeys');
  const env: NodeJS.ProcessEnv = { ...process.env };
  for (const p of Object.keys(KEY_ENV) as ProviderName[]) {
    const envVar = KEY_ENV[p];
    if (envVar && keys[p]) env[envVar] = keys[p];
  }
  env.THEMATIC_ANALYSER_CODERS = panelOverride ?? store.get('panel');
  return env;
}
