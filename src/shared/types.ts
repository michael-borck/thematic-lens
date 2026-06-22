// Shapes shared between the Electron main process and the renderer.
// The Engine* types mirror thematic-analyser's `ThematicAnalysis` JSON output.

export type ProviderName =
  | 'anthropic'
  | 'openai'
  | 'openrouter'
  | 'ollama'
  | 'grok'
  | 'gemini';

export interface CoderLabel {
  coder: string;
  topic_id: number;
  label: string;
  rationale: string | null;
}

export interface ConsensusLabel {
  topic_id: number;
  label: string;
  rationale: string | null;
  independent_labels: CoderLabel[];
  agreed: boolean;
  agreement: number | null;
}

export interface EngineTopic {
  id: number;
  keywords: string[];
  representative_docs: string[];
  prevalence: number | null;
}

export interface ReliabilityReport {
  metric: string;
  value: number | null;
  n_coders: number;
  n_items: number;
  note?: string | null;
}

export interface ThematicAnalysis {
  corpus_size: number;
  topics: EngineTopic[];
  consensus: ConsensusLabel[];
  reliability: ReliabilityReport | null;
  codebook: unknown[];
  coders: string[];
  method: string;
  version: string;
}

// --- app domain (persisted) ---------------------------------------------------

export interface Project {
  id: number;
  name: string;
  created_at: string;
  corpus_path: string;
  topics_path: string | null;
  panel: string;
  method: string;
  version: string;
  reliability_metric: string | null;
  reliability_value: number | null;
}

/** A consensus row plus the human's resolution (when the coders disagreed). */
export interface ConsensusRow {
  id: number;
  project_id: number;
  topic_id: number;
  keywords: string[];
  label: string; // the engine's negotiated label
  rationale: string | null;
  agreed: boolean;
  agreement: number | null;
  independent_labels: CoderLabel[];
  resolved_label: string | null; // the human's final call (null until resolved)
}

export interface Theme {
  id: number;
  project_id: number;
  name: string;
  description: string | null;
  parent_id: number | null;
  topic_ids: number[];
  sort: number;
}

export interface RunRequest {
  name: string;
  corpusPath: string;
  topicsPath: string | null;
  panel: string; // "anthropic:claude-opus-4-8, openai:gpt-4o"
  rounds: number;
}

export interface AppSettings {
  enginePath: string; // path to the thematic-analyser CLI (default: on PATH)
  panel: string;
  rounds: number;
  // API keys are stored but NEVER sent to the renderer (resolved in main).
}

export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: string };
