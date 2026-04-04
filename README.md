# uml-pipeline

Standalone Vite + React app for browsing **BSCA pipeline table** metadata and demo seed data (provider directory refresh model).

## Commands

```bash
npm install
npm run dev    # http://127.0.0.1:5173/
npm run build
```

## Contents

- `src/BscaPipelineExplorer.jsx` — main UI
- `src/data/designTables.js` — column metadata from design ERs
- `src/data/pipelineTableOrder.js` — phase (Master load / Tenant setup / Pipeline run) + impact order
- `src/data/tables.js` — merges design + phase order for the UI
- `src/data/bscaPipelineData.js` — BSCA sample rows (`staging_record` capped at 100)

See `docs/design/bsca-pipeline-tables-ui.md` in the repo root for the full table inventory and design references.
