import { useState } from 'react';
import BscaPipelineExplorer from './BscaPipelineExplorer';
import FlowExplorer from './FlowExplorer';

const PAGES = [
  { id: 'tables', label: '📊 Pipeline Tables', component: BscaPipelineExplorer },
  { id: 'flows', label: '🔀 Request & Pipeline Flows', component: FlowExplorer },
];

export default function App() {
  const [page, setPage] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return PAGES.find((p) => p.id === hash)?.id ?? 'tables';
  });

  const Current = PAGES.find((p) => p.id === page)?.component ?? BscaPipelineExplorer;

  return (
    <>
      <nav style={{
        display: 'flex',
        gap: '0',
        background: '#020617',
        borderBottom: '1px solid rgba(148,163,184,0.15)',
        padding: '0 1rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {PAGES.map((p) => (
          <button
            key={p.id}
            onClick={() => { setPage(p.id); window.location.hash = p.id; }}
            style={{
              padding: '0.6rem 1rem',
              border: 'none',
              borderBottom: page === p.id ? '2px solid #38bdf8' : '2px solid transparent',
              background: 'transparent',
              color: page === p.id ? '#e0f2fe' : '#64748b',
              fontSize: '0.8rem',
              fontWeight: page === p.id ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.12s',
            }}
          >
            {p.label}
          </button>
        ))}
      </nav>
      <Current />
    </>
  );
}
