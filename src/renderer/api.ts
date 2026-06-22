import type { ElectronAPI } from '../main/preload';
import type { IpcResult } from '../shared/types';

declare global {
  interface Window {
    api: ElectronAPI;
  }
}

/** Unwrap an IpcResult, throwing on the error case so callers can try/catch. */
export async function call<T>(p: Promise<IpcResult<T>>): Promise<T> {
  const r = await p;
  if (!r.ok) throw new Error(r.error);
  return r.data;
}

export const api = window.api;
