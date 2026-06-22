import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, FolderOpen, Loader2 } from 'lucide-react';
import { api, call } from '../api';

export default function NewAnalysis() {
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [corpus, setCorpus] = useState<string | null>(null);
  const [topics, setTopics] = useState<string | null>(null);
  const [panel, setPanel] = useState('');
  const [rounds, setRounds] = useState(2);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    call(api.getSettings()).then((s) => {
      setPanel(s.panel);
      setRounds(s.rounds);
    });
  }, []);

  async function run() {
    if (!corpus || !name.trim()) return;
    setRunning(true);
    setError(null);
    try {
      const { projectId } = await call(
        api.runAnalysis({ name: name.trim(), corpusPath: corpus, topicsPath: topics, panel, rounds }),
      );
      nav(`/project/${projectId}/disagreements`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <h2 className="mb-4 text-xl font-semibold">New analysis</h2>

      <label className="mb-1 block text-sm font-medium">Name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Interview round 1"
        className="mb-4 w-full rounded border border-slate-300 px-3 py-2 text-sm"
      />

      <label className="mb-1 block text-sm font-medium">Corpus</label>
      <button
        onClick={async () => setCorpus(await call(api.openCorpus()))}
        className="mb-1 flex w-full items-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
      >
        <FolderOpen size={15} /> {corpus ?? 'Choose a folder or .txt / .jsonl / .csv'}
      </button>
      <p className="mb-4 text-xs text-slate-400">A folder of docs, one-doc-per-line .txt, .jsonl, or .csv.</p>

      <label className="mb-1 block text-sm font-medium">
        Precomputed topics <span className="font-normal text-slate-400">(optional)</span>
      </label>
      <button
        onClick={async () => setTopics(await call(api.openTopics()))}
        className="mb-1 flex w-full items-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
      >
        <FileText size={15} /> {topics ?? 'Skip (fit topics) — needs the engine [topics] extra'}
      </button>
      <p className="mb-4 text-xs text-slate-400">
        Without this, the engine fits a topic model (requires <code>thematic-analyser[topics]</code>).
      </p>

      <label className="mb-1 block text-sm font-medium">Consensus panel</label>
      <input
        value={panel}
        onChange={(e) => setPanel(e.target.value)}
        className="mb-1 w-full rounded border border-slate-300 px-3 py-2 font-mono text-sm"
      />
      <p className="mb-4 text-xs text-slate-400">
        ≥2 <code>provider:model</code> pairs. Keys come from Settings. Default from Settings.
      </p>

      <label className="mb-1 block text-sm font-medium">Critique rounds</label>
      <input
        type="number"
        min={1}
        max={5}
        value={rounds}
        onChange={(e) => setRounds(Number(e.target.value))}
        className="mb-5 w-24 rounded border border-slate-300 px-3 py-2 text-sm"
      />

      {error && <pre className="mb-3 whitespace-pre-wrap rounded bg-red-50 p-2 text-xs text-red-700">{error}</pre>}

      <button
        disabled={!corpus || !name.trim() || running}
        onClick={run}
        className="flex items-center gap-2 rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-40"
      >
        {running && <Loader2 size={15} className="animate-spin" />}
        {running ? 'Running the engine…' : 'Run analysis'}
      </button>
    </div>
  );
}
