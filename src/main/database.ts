import { DatabaseSync } from 'node:sqlite';
import { app } from 'electron';
import path from 'path';
import { createSchema } from './schema';
import type {
  ConsensusRow,
  Project,
  ThematicAnalysis,
  Theme,
} from '../shared/types';

// node:sqlite (DatabaseSync) is bundled in Electron's Node runtime — no native
// build step, same choice as insight-lens.
let db: DatabaseSync;

export function setupDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'thematic-lens.db');
  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');
  createSchema(db);
}

/** Persist a completed engine run as a new Project + its rows. Returns the id. */
export function saveAnalysis(
  meta: { name: string; corpusPath: string; topicsPath: string | null; panel: string },
  analysis: ThematicAnalysis,
): number {
  const insertProject = db.prepare(`
    INSERT INTO projects (name, corpus_path, topics_path, panel, method, version,
                          reliability_metric, reliability_value)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const r = insertProject.run(
    meta.name,
    meta.corpusPath,
    meta.topicsPath,
    meta.panel,
    analysis.method,
    analysis.version,
    analysis.reliability?.metric ?? null,
    analysis.reliability?.value ?? null,
  );
  const projectId = Number(r.lastInsertRowid);

  const insTopic = db.prepare(
    'INSERT INTO topics (project_id, topic_id, keywords_json, prevalence) VALUES (?, ?, ?, ?)',
  );
  for (const t of analysis.topics) {
    insTopic.run(projectId, t.id, JSON.stringify(t.keywords), t.prevalence);
  }

  const insCons = db.prepare(`
    INSERT INTO consensus (project_id, topic_id, label, rationale, agreed, agreement, independent_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const c of analysis.consensus) {
    insCons.run(
      projectId,
      c.topic_id,
      c.label,
      c.rationale,
      c.agreed ? 1 : 0,
      c.agreement,
      JSON.stringify(c.independent_labels),
    );
  }
  return projectId;
}

export function listProjects(): Project[] {
  return db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all() as unknown as Project[];
}

export function getConsensus(projectId: number, onlyUnresolved = false): ConsensusRow[] {
  const where = onlyUnresolved
    ? 'WHERE c.project_id = ? AND c.agreed = 0 AND c.resolved_label IS NULL'
    : 'WHERE c.project_id = ?';
  const rows = db
    .prepare(`
      SELECT c.*, t.keywords_json
      FROM consensus c
      LEFT JOIN topics t ON t.project_id = c.project_id AND t.topic_id = c.topic_id
      ${where}
      ORDER BY c.topic_id
    `)
    .all(projectId) as any[];
  return rows.map((r) => ({
    id: r.id,
    project_id: r.project_id,
    topic_id: r.topic_id,
    keywords: r.keywords_json ? JSON.parse(r.keywords_json) : [],
    label: r.label,
    rationale: r.rationale,
    agreed: !!r.agreed,
    agreement: r.agreement,
    independent_labels: JSON.parse(r.independent_json),
    resolved_label: r.resolved_label,
  }));
}

/** The human's decision on a disagreement (or an override of an agreed label). */
export function resolveConsensus(consensusId: number, label: string): void {
  db.prepare(
    "UPDATE consensus SET resolved_label = ?, resolved_at = datetime('now') WHERE id = ?",
  ).run(label, consensusId);
}

export function getThemes(projectId: number): Theme[] {
  const rows = db
    .prepare('SELECT * FROM themes WHERE project_id = ? ORDER BY sort, id')
    .all(projectId) as any[];
  return rows.map((r) => ({
    id: r.id,
    project_id: r.project_id,
    name: r.name,
    description: r.description,
    parent_id: r.parent_id,
    topic_ids: JSON.parse(r.topic_ids_json),
    sort: r.sort,
  }));
}

/** The final label for a topic: the human's resolution if set, else the engine's. */
export function effectiveLabels(projectId: number): { topic_id: number; label: string }[] {
  const rows = db
    .prepare('SELECT topic_id, label, resolved_label FROM consensus WHERE project_id = ?')
    .all(projectId) as any[];
  return rows.map((r) => ({ topic_id: r.topic_id, label: r.resolved_label || r.label }));
}
