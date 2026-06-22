import type { DatabaseSync } from 'node:sqlite';

// One SQLite file per install. A Project is one corpus + one analysis run; the
// consensus rows carry the human's resolution; themes hold the hierarchy.
export function createSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      corpus_path TEXT NOT NULL,
      topics_path TEXT,
      panel TEXT NOT NULL,
      method TEXT,
      version TEXT,
      reliability_metric TEXT,
      reliability_value REAL
    );

    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      topic_id INTEGER NOT NULL,
      keywords_json TEXT NOT NULL,
      prevalence REAL
    );

    CREATE TABLE IF NOT EXISTS consensus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      topic_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      rationale TEXT,
      agreed INTEGER NOT NULL,
      agreement REAL,
      independent_json TEXT NOT NULL,
      resolved_label TEXT,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS themes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      parent_id INTEGER REFERENCES themes(id) ON DELETE SET NULL,
      topic_ids_json TEXT NOT NULL DEFAULT '[]',
      sort INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS memos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_consensus_project ON consensus(project_id);
    CREATE INDEX IF NOT EXISTS idx_topics_project ON topics(project_id);
    CREATE INDEX IF NOT EXISTS idx_themes_project ON themes(project_id);
  `);
}
