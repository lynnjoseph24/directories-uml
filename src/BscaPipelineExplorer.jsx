import { useMemo, useState } from 'react';
import { TABLES, TABLE_LAYERS, getTableById } from './data/tables';
import { getBscaRows, getBscaRowCount, BSCA_PIPELINE_NOTES } from './data/bscaPipelineData';
import './BscaPipelineExplorer.css';

function formatCellValue(val) {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

export default function BscaPipelineExplorer() {
  const [selectedId, setSelectedId] = useState(() => TABLES[0]?.id ?? 'tenant');
  const [layerFilter, setLayerFilter] = useState(null);
  const [search, setSearch] = useState('');

  const table = getTableById(selectedId);
  const rows = useMemo(() => getBscaRows(selectedId), [selectedId]);

  const filteredTables = useMemo(() => {
    let t = TABLES;
    if (layerFilter) t = t.filter((x) => x.layer === layerFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      t = t.filter(
        (x) =>
          x.name.toLowerCase().includes(q) ||
          (x.description ?? '').toLowerCase().includes(q) ||
          (x.sourceDoc ?? '').toLowerCase().includes(q)
      );
    }
    return t;
  }, [layerFilter, search]);

  const tablesByPhase = useMemo(() => {
    const order = ['master_load', 'tenant_setup', 'pipeline_run'];
    const map = { master_load: [], tenant_setup: [], pipeline_run: [] };
    for (const row of filteredTables) {
      if (map[row.layer]) map[row.layer].push(row);
    }
    return order.map((phaseKey) => ({ phaseKey, tables: map[phaseKey] })).filter((x) => x.tables.length > 0);
  }, [filteredTables]);

  const columns = table?.columns?.map((c) => c.name) ?? [];

  return (
    <main className="bsca-explorer">
      <header className="bsca-explorer-header">
        <div>
          <p className="bsca-app-badge">uml-pipeline</p>
          <h1 className="bsca-explorer-title">BSCA pipeline tables</h1>
          <p className="bsca-explorer-sub">
            Tables are grouped as <strong>Master table load</strong> → <strong>Tenant setup</strong> →{' '}
            <strong>Pipeline run</strong>, in the order data is affected. Metadata: <code>designTables.js</code>{' '}
            ({TABLES.length} tables). Sample: <strong>100</strong> <code>staging_record</code> /{' '}
            <code>cass_result</code> rows; <strong>25</strong> <code>provider_record</code> rows.
          </p>
        </div>
      </header>

      <div className="bsca-explorer-meta">
        <span>LOB: {BSCA_PIPELINE_NOTES.primaryLobSample}</span>
        <span>Source columns (design): {BSCA_PIPELINE_NOTES.sourceColumnsMapped}</span>
        <span>staging_record rows: {BSCA_PIPELINE_NOTES.stagingRecordRows}</span>
      </div>

      <div className="bsca-explorer-body">
        <aside className="bsca-explorer-sidebar">
          <input
            type="search"
            className="bsca-search"
            placeholder="Filter tables…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="bsca-layer-filters">
            <button
              type="button"
              className={!layerFilter ? 'active' : ''}
              onClick={() => setLayerFilter(null)}
            >
              All groups
            </button>
            {Object.entries(TABLE_LAYERS).map(([key, layer]) => (
              <button
                key={key}
                type="button"
                className={layerFilter === key ? 'active' : ''}
                onClick={() => setLayerFilter(layerFilter === key ? null : key)}
                style={{ borderLeftColor: layer.color }}
                title={layer.description}
              >
                {layer.shortName}
              </button>
            ))}
          </div>
          <nav className="bsca-table-nav">
            {tablesByPhase.map(({ phaseKey, tables: phaseTables }) => (
              <div key={phaseKey} className="bsca-phase-block">
                {!layerFilter && (
                  <div
                    className="bsca-phase-heading"
                    style={{ borderLeftColor: TABLE_LAYERS[phaseKey]?.color ?? '#64748b' }}
                  >
                    {TABLE_LAYERS[phaseKey]?.name ?? phaseKey}
                  </div>
                )}
                {phaseTables.map((t) => {
                  const layer = TABLE_LAYERS[t.layer];
                  const n = getBscaRowCount(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`bsca-table-btn ${selectedId === t.id ? 'selected' : ''}`}
                      onClick={() => setSelectedId(t.id)}
                    >
                      <span className="bsca-table-dot" style={{ background: layer?.color ?? '#64748b' }} />
                      <span className="bsca-table-name">{t.schema ? `${t.schema}.` : ''}{t.name}</span>
                      <span className="bsca-table-count">{n}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        <section className="bsca-explorer-main">
          {table && (
            <>
              <div className="bsca-table-header">
                <h2>
                  <code>{table.schema ? `${table.schema}.${table.name}` : table.name}</code>
                  <span className="bsca-badge" title={TABLE_LAYERS[table.layer]?.description}>
                    {TABLE_LAYERS[table.layer]?.name ?? table.layer}
                  </span>
                </h2>
                {table.description && <p className="bsca-table-desc">{table.description}</p>}
                {table.downstream && (
                  <div className="bsca-downstream">
                    <span className="bsca-downstream-label">Downstream Impact</span>
                    <p>{table.downstream}</p>
                  </div>
                )}
                {table.sourceDoc && (
                  <p className="bsca-source-doc">
                    <span className="bsca-source-label">Source</span> <code>{table.sourceDoc}</code>
                  </p>
                )}
                <p className="bsca-row-hint">
                  Showing {rows.length} row{rows.length === 1 ? '' : 's'} (demo data).
                  {selectedId === 'staging_record' &&
                    ' Full refresh files can be 300MB+; UI caps staging at 100 rows for readability.'}
                </p>
              </div>

              {rows.length === 0 ? (
                <div className="bsca-empty">No sample rows for this table.</div>
              ) : (
                <div className="bsca-grid-wrap">
                  <table className="bsca-data-grid">
                    <thead>
                      <tr>
                        {columns.map((col) => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, ri) => (
                        <tr key={ri}>
                          {columns.map((col) => (
                            <td key={col} title={formatCellValue(row[col])}>
                              {formatCellValue(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
