import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Save } from 'lucide-react';
import { api, call } from '../api';
import type { ProviderName } from '../../shared/types';

const PROVIDERS: { id: ProviderName; label: string; hint: string }[] = [
  { id: 'anthropic', label: 'Anthropic', hint: 'ANTHROPIC_API_KEY' },
  { id: 'openai', label: 'OpenAI', hint: 'OPENAI_API_KEY' },
  { id: 'openrouter', label: 'OpenRouter', hint: 'OPENROUTER_API_KEY' },
  { id: 'grok', label: 'xAI Grok', hint: 'XAI_API_KEY' },
  { id: 'gemini', label: 'Google Gemini', hint: 'GEMINI_API_KEY' },
  { id: 'ollama', label: 'Ollama', hint: 'local — no key' },
];

export default function Settings() {
  const [enginePath, setEnginePath] = useState('');
  const [panel, setPanel] = useState('');
  const [rounds, setRounds] = useState(2);
  const [status, setStatus] = useState<Record<ProviderName, boolean>>({} as any);
  const [keyInputs, setKeyInputs] = useState<Partial<Record<ProviderName, string>>>({});
  const [version, setVersion] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    call(api.getSettings()).then((s) => {
      setEnginePath(s.enginePath);
      setPanel(s.panel);
      setRounds(s.rounds);
    });
    call(api.keyStatus()).then(setStatus);
  }, []);

  async function saveSettings() {
    await call(api.updateSettings({ enginePath, panel, rounds }));
    setMsg('Settings saved.');
  }
  async function testEngine() {
    try {
      setVersion('checking…');
      setVersion('thematic-analyser ' + (await call(api.engineVersion())));
    } catch (e) {
      setVersion('✗ ' + (e instanceof Error ? e.message : String(e)));
    }
  }
  async function saveKey(p: ProviderName) {
    const v = keyInputs[p] ?? '';
    setStatus(await call(api.setKey(p, v)));
    setKeyInputs((k) => ({ ...k, [p]: '' }));
    setMsg(`${p} key ${v ? 'saved' : 'cleared'}.`);
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <h2 className="mb-4 text-xl font-semibold">Settings</h2>
      {msg && <p className="mb-3 rounded bg-emerald-50 p-2 text-sm text-emerald-700">{msg}</p>}

      <section className="mb-6">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Engine</h3>
        <label className="mb-1 block text-xs text-slate-500">thematic-analyser CLI path</label>
        <div className="mb-1 flex gap-2">
          <input
            value={enginePath}
            onChange={(e) => setEnginePath(e.target.value)}
            className="flex-1 rounded border border-slate-300 px-3 py-2 font-mono text-sm"
          />
          <button onClick={testEngine} className="rounded border border-slate-300 px-3 text-sm">
            Test
          </button>
        </div>
        {version && <p className="text-xs text-slate-500">{version}</p>}
        <p className="mt-1 text-xs text-slate-400">
          Install with <code>pipx install thematic-analyser</code> (add <code>[topics]</code> to fit
          topics from raw text). Bundled sidecar is a later milestone.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Default consensus panel</h3>
        <input
          value={panel}
          onChange={(e) => setPanel(e.target.value)}
          className="mb-2 w-full rounded border border-slate-300 px-3 py-2 font-mono text-sm"
        />
        <label className="mb-1 block text-xs text-slate-500">Critique rounds</label>
        <input
          type="number"
          min={1}
          max={5}
          value={rounds}
          onChange={(e) => setRounds(Number(e.target.value))}
          className="w-24 rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </section>

      <section className="mb-6">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Provider keys</h3>
        <p className="mb-2 text-xs text-slate-400">
          Stored locally; passed to the engine subprocess as env. Never displayed back.
        </p>
        <ul className="space-y-2">
          {PROVIDERS.map((p) => (
            <li key={p.id} className="flex items-center gap-2">
              {status[p.id] ? (
                <CheckCircle2 size={16} className="text-emerald-500" />
              ) : (
                <Circle size={16} className="text-slate-300" />
              )}
              <span className="w-28 text-sm">{p.label}</span>
              {p.id === 'ollama' ? (
                <span className="text-xs text-slate-400">{p.hint}</span>
              ) : (
                <>
                  <input
                    type="password"
                    placeholder={p.hint}
                    value={keyInputs[p.id] ?? ''}
                    onChange={(e) => setKeyInputs((k) => ({ ...k, [p.id]: e.target.value }))}
                    className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                  <button onClick={() => saveKey(p.id)} className="rounded border border-slate-300 px-2 py-1 text-xs">
                    Save
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      <button
        onClick={saveSettings}
        className="flex items-center gap-2 rounded bg-slate-900 px-4 py-2 text-sm text-white"
      >
        <Save size={15} /> Save settings
      </button>
    </div>
  );
}
