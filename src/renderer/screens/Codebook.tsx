import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, Scale } from 'lucide-react';
import { api, call } from '../api';
import type { ConsensusRow } from '../../shared/types';

// The curated codebook. v1 shows the effective leaf labels (the human's
// resolution where they disagreed, else the engine's) and exports REFI-QDA.
// TODO: drag-to-group leaves into a parent-theme hierarchy (writes `themes`);
// the export + DB already support the tree.

export default function Codebook() {
  const { id } = useParams();
  const projectId = Number(id);
  const [rows, setRows] = useState<ConsensusRow[]>([]);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    call(api.getConsensus(projectId, false)).then(setRows).catch((e) => setError(String(e)));
  }, [projectId]);

  const pending = rows.filter((r) => !r.agreed && !r.resolved_label).length;

  async function exportCodebook() {
    try {
      const file = await call(api.exportRefiqda(projectId));
      if (file) setSaved(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Codebook</h2>
        <div className="flex gap-2">
          <Link
            to={`/project/${projectId}/disagreements`}
            className="flex items-center gap-1 rounded border border-slate-300 px-3 py-1.5 text-sm"
          >
            <Scale size={15} /> Disagreements
          </Link>
          <button
            onClick={exportCodebook}
            className="flex items-center gap-1 rounded bg-slate-900 px-3 py-1.5 text-sm text-white"
          >
            <Download size={15} /> Export REFI-QDA
          </button>
        </div>
      </div>

      {pending > 0 && (
        <p className="mb-3 rounded bg-amber-50 p-2 text-sm text-amber-700">
          {pending} topic(s) still unresolved — resolve them first for a clean codebook.
        </p>
      )}
      {saved && <p className="mb-3 rounded bg-emerald-50 p-2 text-sm text-emerald-700">Saved to {saved}</p>}
      {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
        {rows.map((r) => {
          const label = r.resolved_label || r.label;
          return (
            <li key={r.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <span className="w-10 text-xs text-slate-400">#{r.topic_id}</span>
              <span className="font-medium">{label}</span>
              {r.resolved_label && <span className="text-xs text-emerald-600">(resolved)</span>}
              <span className="ml-auto truncate text-xs text-slate-400">
                {r.keywords.slice(0, 6).join(', ')}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
