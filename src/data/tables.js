/**
 * Pipeline tables for uml-pipeline UI — sourced from designTables.js, ordered by pipeline impact.
 * Enriched with downstream impact descriptions from downstreamImpacts.js.
 */
import { TABLE_LAYERS } from './tableLayers.js';
import { DESIGN_TABLES } from './designTables.js';
import { DOWNSTREAM_IMPACTS } from './downstreamImpacts.js';
import {
  PHASE_BY_TABLE_ID,
  PIPELINE_ORDER_INDEX,
  ORDERED_PIPELINE_TABLE_IDS,
} from './pipelineTableOrder.js';

export { TABLE_LAYERS };

function buildTables() {
  const designIds = new Set(DESIGN_TABLES.map((t) => t.id));
  const orderedSet = new Set(ORDERED_PIPELINE_TABLE_IDS);
  if (ORDERED_PIPELINE_TABLE_IDS.length !== DESIGN_TABLES.length) {
    throw new Error(
      `pipelineTableOrder (${ORDERED_PIPELINE_TABLE_IDS.length}) vs designTables (${DESIGN_TABLES.length}) count mismatch`
    );
  }
  for (const id of ORDERED_PIPELINE_TABLE_IDS) {
    if (!designIds.has(id)) {
      throw new Error(`pipelineTableOrder: id "${id}" not found in designTables.js`);
    }
  }
  for (const t of DESIGN_TABLES) {
    if (!orderedSet.has(t.id)) {
      throw new Error(`designTables.js: id "${t.id}" missing from pipelineTableOrder.js`);
    }
  }

  return DESIGN_TABLES.map((t) => {
    const layer = PHASE_BY_TABLE_ID.get(t.id);
    const pipelineOrder = PIPELINE_ORDER_INDEX.get(t.id) ?? 9999;
    const downstream = DOWNSTREAM_IMPACTS[t.id] || '';
    return { ...t, layer, pipelineOrder, downstream };
  }).sort((a, b) => a.pipelineOrder - b.pipelineOrder);
}

export const TABLES = buildTables();

export const getTableById = (id) => TABLES.find((t) => t.id === id);

export const getTablesByLayer = (layer) => TABLES.filter((t) => t.layer === layer);
