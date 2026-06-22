import { execFile } from 'child_process';
import log from 'electron-log';
import { engineEnv, getSettings } from './settings';
import type { RunRequest, ThematicAnalysis } from '../shared/types';

// Integration with the thematic-analyser engine. The app shells out to the
// installed CLI with `--json`, passing the resolved API keys + coder panel as
// env (engineEnv). One-shot per run; stdout is the ThematicAnalysis JSON.
//
// TODO (later milestone): bundle a Python sidecar venv like debrief does, so
// users don't need thematic-analyser on PATH. For now it must be installed
// (`pipx install thematic-analyser` or a venv) and findable via Settings.

export function runAnalysis(req: RunRequest): Promise<ThematicAnalysis> {
  const { enginePath } = getSettings();
  const args: string[] = [];
  if (req.corpusPath) args.push(req.corpusPath);
  if (req.topicsPath) args.push('--topics', req.topicsPath);
  if (req.panel) args.push('--coders', req.panel);
  args.push('--rounds', String(req.rounds ?? 2), '--json');

  log.info('engine run:', enginePath, args.join(' '));

  return new Promise((resolve, reject) => {
    execFile(
      enginePath,
      args,
      { env: engineEnv(req.panel), maxBuffer: 64 * 1024 * 1024, timeout: 10 * 60 * 1000 },
      (err, stdout, stderr) => {
        if (err) {
          const detail = (stderr || err.message || '').trim();
          if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
            return reject(
              new Error(
                `Engine not found at "${enginePath}". Install it (pipx install thematic-analyser) ` +
                  `and set the path in Settings.`,
              ),
            );
          }
          return reject(new Error(detail || 'engine failed'));
        }
        try {
          resolve(JSON.parse(stdout) as ThematicAnalysis);
        } catch {
          reject(new Error('engine returned unparseable output:\n' + stdout.slice(0, 500)));
        }
      },
    );
  });
}

/** Quick health check: `thematic-analyser manifest` → version string. */
export function engineVersion(): Promise<string> {
  const { enginePath } = getSettings();
  return new Promise((resolve, reject) => {
    execFile(enginePath, ['manifest'], { timeout: 15000 }, (err, stdout) => {
      if (err) return reject(new Error(`Engine not runnable at "${enginePath}"`));
      try {
        resolve(JSON.parse(stdout).version as string);
      } catch {
        reject(new Error('manifest not parseable'));
      }
    });
  });
}
