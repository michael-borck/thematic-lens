import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import { FolderOpen, PlayCircle, Settings as Cog } from 'lucide-react';
import Projects from './screens/Projects';
import NewAnalysis from './screens/NewAnalysis';
import Disagreements from './screens/Disagreements';
import Codebook from './screens/Codebook';
import Settings from './screens/Settings';

const nav = [
  { to: '/projects', label: 'Projects', icon: FolderOpen },
  { to: '/new', label: 'New analysis', icon: PlayCircle },
  { to: '/settings', label: 'Settings', icon: Cog },
];

export default function App() {
  return (
    <div className="flex h-screen">
      <aside className="w-56 shrink-0 border-r border-slate-200 bg-white p-3">
        <h1 className="mb-4 px-2 text-lg font-semibold text-slate-900">Thematic&nbsp;Lens</h1>
        <nav className="space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded px-2 py-1.5 text-sm ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <Icon size={16} /> {label}
            </NavLink>
          ))}
        </nav>
        <p className="absolute bottom-3 left-3 w-48 text-[11px] leading-tight text-slate-400">
          Local-first. Corpora and keys stay on this machine; the engine runs as a
          local subprocess.
        </p>
      </aside>

      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/new" element={<NewAnalysis />} />
          <Route path="/project/:id/disagreements" element={<Disagreements />} />
          <Route path="/project/:id/codebook" element={<Codebook />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
