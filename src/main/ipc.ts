import { ipcMain, dialog, BrowserWindow } from 'electron';
import fs from 'fs';
import log from 'electron-log';
import {
  getConsensus,
  getThemes,
  listProjects,
  resolveConsensus,
  saveAnalysis,
} from './database';
import { engineVersion, runAnalysis } from './engine';
import { refiCodebook } from './export';
import {
  getSettings,
  keyStatus,
  setApiKey,
  updateSettings,
} from './settings';
import type { ProviderName, RunRequest } from '../shared/types';

// One typed dispatcher per channel; every handler returns IpcResult<T> so the
// renderer gets {ok,data} | {ok,error} and never an unhandled rejection.
function handle<T>(channel: string, fn: (...args: any[]) => T | Promise<T>): void {
  ipcMain.handle(channel, async (_e, ...args) => {
    try {
      return { ok: true, data: await fn(...args) };
    } catch (err) {
      log.error(`ipc ${channel} failed:`, err);
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  });
}

export function setupIpc(): void {
  // --- file pickers ---
  handle('dialog:openCorpus', async () => {
    const r = await dialog.showOpenDialog({
      title: 'Choose a corpus',
      properties: ['openFile', 'openDirectory'],
      filters: [{ name: 'Corpus', extensions: ['txt', 'jsonl', 'csv'] }],
    });
    return r.canceled ? null : r.filePaths[0];
  });
  handle('dialog:openTopics', async () => {
    const r = await dialog.showOpenDialog({
      title: 'Precomputed topics (optional)',
      properties: ['openFile'],
      filters: [{ name: 'Topics JSON', extensions: ['json'] }],
    });
    return r.canceled ? null : r.filePaths[0];
  });

  // --- settings (keys never returned to renderer) ---
  handle('settings:get', () => getSettings());
  handle('settings:update', (patch) => updateSettings(patch));
  handle('settings:keyStatus', () => keyStatus());
  handle('settings:setKey', (provider: ProviderName, key: string) => {
    setApiKey(provider, key);
    return keyStatus();
  });
  handle('engine:version', () => engineVersion());

  // --- analysis run + persistence ---
  handle('analysis:run', async (req: RunRequest) => {
    const analysis = await runAnalysis(req);
    const projectId = saveAnalysis(
      { name: req.name, corpusPath: req.corpusPath, topicsPath: req.topicsPath, panel: req.panel },
      analysis,
    );
    return { projectId, summary: { topics: analysis.topics.length, reliability: analysis.reliability } };
  });

  handle('projects:list', () => listProjects());
  handle('consensus:get', (projectId: number, onlyUnresolved: boolean) =>
    getConsensus(projectId, onlyUnresolved),
  );
  handle('consensus:resolve', (id: number, label: string) => {
    resolveConsensus(id, label);
    return true;
  });
  handle('themes:get', (projectId: number) => getThemes(projectId));

  // --- export ---
  handle('export:refiqda', async (projectId: number) => {
    const xml = refiCodebook(projectId);
    const win = BrowserWindow.getFocusedWindow() ?? undefined;
    const r = await dialog.showSaveDialog(win!, {
      title: 'Export REFI-QDA codebook',
      defaultPath: 'codebook.qdc',
      filters: [{ name: 'REFI-QDA codebook', extensions: ['qdc', 'xml'] }],
    });
    if (r.canceled || !r.filePath) return null;
    fs.writeFileSync(r.filePath, xml, 'utf-8');
    return r.filePath;
  });
}
