import { contextBridge, ipcRenderer } from 'electron';
import type {
  AppSettings,
  ConsensusRow,
  IpcResult,
  Project,
  ProviderName,
  RunRequest,
  Theme,
} from '../shared/types';

// The only bridge between renderer and main. contextIsolation is on; the
// renderer never touches ipcRenderer directly and never sees an API key.
const api = {
  openCorpus: () => ipcRenderer.invoke('dialog:openCorpus') as Promise<IpcResult<string | null>>,
  openTopics: () => ipcRenderer.invoke('dialog:openTopics') as Promise<IpcResult<string | null>>,

  getSettings: () => ipcRenderer.invoke('settings:get') as Promise<IpcResult<AppSettings>>,
  updateSettings: (patch: Partial<AppSettings>) =>
    ipcRenderer.invoke('settings:update', patch) as Promise<IpcResult<AppSettings>>,
  keyStatus: () =>
    ipcRenderer.invoke('settings:keyStatus') as Promise<IpcResult<Record<ProviderName, boolean>>>,
  setKey: (provider: ProviderName, key: string) =>
    ipcRenderer.invoke('settings:setKey', provider, key) as Promise<
      IpcResult<Record<ProviderName, boolean>>
    >,
  engineVersion: () => ipcRenderer.invoke('engine:version') as Promise<IpcResult<string>>,

  runAnalysis: (req: RunRequest) =>
    ipcRenderer.invoke('analysis:run', req) as Promise<
      IpcResult<{ projectId: number; summary: unknown }>
    >,
  listProjects: () => ipcRenderer.invoke('projects:list') as Promise<IpcResult<Project[]>>,
  getConsensus: (projectId: number, onlyUnresolved = false) =>
    ipcRenderer.invoke('consensus:get', projectId, onlyUnresolved) as Promise<
      IpcResult<ConsensusRow[]>
    >,
  resolveConsensus: (id: number, label: string) =>
    ipcRenderer.invoke('consensus:resolve', id, label) as Promise<IpcResult<boolean>>,
  getThemes: (projectId: number) =>
    ipcRenderer.invoke('themes:get', projectId) as Promise<IpcResult<Theme[]>>,
  exportRefiqda: (projectId: number) =>
    ipcRenderer.invoke('export:refiqda', projectId) as Promise<IpcResult<string | null>>,
};

export type ElectronAPI = typeof api;
contextBridge.exposeInMainWorld('api', api);
