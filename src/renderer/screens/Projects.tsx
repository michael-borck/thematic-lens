import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Scale, ListTree } from 'lucide-react';
import { api, call } from '../api';
import type { Project } from '../../shared/types';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    call(api.listProjects()).then(setProjects).catch((e) => setError(String(e)));
  }, []);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h2 className="mb-4 text-xl font-semibold">Projects</h2>
      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
      {projects.length === 0 ? (
        <p className="rounded border border-dashed border-slate-300 p-8 text-center text-slate-400">
          No analyses yet. Start one under <Link to="/new" className="underline">New analysis</Link>.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-slate-400">
            <tr>
              <th className="py-2">Name</th>
              <th>Panel</th>
              <th>Reliability</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="py-2 font-medium">{p.name}</td>
                <td className="text-slate-500">{p.panel}</td>
                <td className="text-slate-500">
                  {p.reliability_metric
                    ? `${p.reliability_metric} ${p.reliability_value?.toFixed(3)}`
                    : '—'}
                </td>
                <td className="text-slate-400">{p.created_at}</td>
                <td className="flex gap-2 py-2">
                  <Link
                    to={`/project/${p.id}/disagreements`}
                    className="flex items-center gap-1 rounded bg-slate-900 px-2 py-1 text-xs text-white"
                  >
                    <Scale size={13} /> Resolve
                  </Link>
                  <Link
                    to={`/project/${p.id}/codebook`}
                    className="flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-xs"
                  >
                    <ListTree size={13} /> Codebook
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
