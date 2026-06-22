import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, ListTree } from 'lucide-react';
import { api, call } from '../api';
import type { ConsensusRow } from '../../shared/types';

// The centrepiece. The engine flags topics where the coders did NOT converge
// (agreed = false). This screen is where the human settles each one — the
// irreducibly-human step in the method. Resolving writes `resolved_label`,
// which the codebook/export then prefer over the engine's negotiated label.

export default function Disagreements() {
  const { id } = useParams();
  const projectId = Number(id);
  const [rows, setRows] = useState<ConsensusRow[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setRows(await call(api.getConsensus(projectId, !showAll)));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, showAll]);

  async function resolve(row: ConsensusRow, label: string) {
    await call(api.resolveConsensus(row.id, label));
    load();
  }

  const unresolved = rows.filter((r) => !r.agreed && !r.resolved_label).length;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Resolve disagreements</h2>
          <p className="text-sm text-slate-500">
            {showAll ? 'All topics' : `${unresolved} unresolved`} · the coders couldn't
            agree on these — you decide.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 text-sm text-slate-600">
            <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
            show all
          </label>
          <Link
            to={`/project/${projectId}/codebook`}
            className="flex items-center gap-1 rounded bg-slate-900 px-3 py-1.5 text-sm text-white"
          >
            <ListTree size={15} /> Codebook
          </Link>
        </div>
      </div>

      {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      {rows.length === 0 && (
        <p className="rounded border border-dashed border-slate-300 p-8 text-center text-slate-400">
          {showAll ? 'No topics yet.' : 'Nothing to resolve — every topic converged. 🎉'}
        </p>
      )}

      <ul className="space-y-4">
        {rows.map((row) => (
          <DisagreementCard key={row.id} row={row} onResolve={resolve} />
        ))}
      </ul>
    </div>
  );
}

function DisagreementCard({
  row,
  onResolve,
}: {
  row: ConsensusRow;
  onResolve: (row: ConsensusRow, label: string) => void;
}) {
  // Candidate labels = each coder's blind label + the negotiated one, deduped.
  const candidates = Array.from(
    new Set([row.label, ...row.independent_labels.map((l) => l.label)]),
  );
  const [custom, setCustom] = useState('');
  const resolved = row.resolved_label;

  return (
    <li className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
          topic {row.topic_id}
        </span>
        {row.agreed ? (
          <span className="text-xs text-emerald-600">converged ({row.agreement?.toFixed(2)})</span>
        ) : (
          <span className="text-xs text-amber-600">disagreement</span>
        )}
        {resolved && (
          <span className="ml-auto flex items-center gap-1 text-xs text-emerald-700">
            <Check size={13} /> resolved: <strong>{resolved}</strong>
          </span>
        )}
      </div>

      <div className="mb-3 text-xs text-slate-500">
        keywords: {row.keywords.slice(0, 8).join(', ')}
      </div>

      <div className="mb-3 space-y-1">
        {row.independent_labels.map((l) => (
          <div key={l.coder} className="flex items-baseline gap-2 text-sm">
            <span className="w-44 shrink-0 truncate font-mono text-xs text-slate-400">{l.coder}</span>
            <span className="font-medium">{l.label}</span>
            {l.rationale && <span className="text-slate-400">— {l.rationale}</span>}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {candidates.map((c) => (
          <button
            key={c}
            onClick={() => onResolve(row, c)}
            className={`rounded-full border px-3 py-1 text-sm ${
              resolved === c
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-slate-300 hover:bg-slate-50'
            }`}
          >
            {c}
            {c === row.label && <span className="ml-1 text-xs text-slate-400">(negotiated)</span>}
          </button>
        ))}
        <span className="text-slate-300">|</span>
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="custom label…"
          className="rounded border border-slate-300 px-2 py-1 text-sm"
        />
        <button
          disabled={!custom.trim()}
          onClick={() => onResolve(row, custom.trim())}
          className="rounded bg-slate-900 px-3 py-1 text-sm text-white disabled:opacity-40"
        >
          Use
        </button>
      </div>
    </li>
  );
}
