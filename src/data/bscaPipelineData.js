/**
 * BSCA dataset for the Pipeline Tables explorer.
 * Row keys match `designTables.js` column names (docs/design ER + schema-design).
 *
 * Policy: staging_record = 100 rows; cass_result = 100 (1:1 by staging_record.id).
 * Legacy holding_record was replaced by staging_record + provider_record in design docs.
 *
 * DATA SOURCE: Real BSCA IMAPDHMO provider data extracted from legacy database
 * (dbo.RdIMAPDHMORaw + PY2025.RdIMAPDHMO). NPIs, addresses, names are actual
 * production values from the BSCA dev environment (ODSDBBSCADEV).
 */
import { BSCA_RAW_PROVIDERS, BSCA_CLEANSED_PROVIDERS } from './bscaRealProviders.js';
import {
  BSCA_CHAPTERS, BSCA_RULES, BSCA_BOOKS, BSCA_CASS_ERRORS,
  BSCA_COUNTY_CODES, BSCA_ZIP_CODES, BSCA_FOOTERS, BSCA_ENCLOSURES,
  BSCA_BOOK_EXTENSIONS,
} from './bscaRealConfig.js';

/**
 * Deterministic UUID v4 generator — produces proper GUIDs that are stable across reloads.
 * Uses a simple hash of the seed to fill the 128-bit space, with version=4 and variant=10xx bits set.
 */
export function bscaUuid(seed) {
  let h = 0x811c9dc5;
  const s = `bsca-pipeline-seed-${seed}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const a = (h >>> 0).toString(16).padStart(8, '0');
  h = Math.imul(h ^ 0xa5a5a5a5, 0x01000193);
  const b = (h >>> 0).toString(16).padStart(8, '0');
  h = Math.imul(h ^ 0x5a5a5a5a, 0x01000193);
  const c = (h >>> 0).toString(16).padStart(8, '0');
  h = Math.imul(h ^ seed, 0x01000193);
  const d = (h >>> 0).toString(16).padStart(8, '0');
  // Format as UUID v4: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx (version=4, variant=10xx)
  return (
    a.slice(0, 8) + '-' +
    b.slice(0, 4) + '-4' +
    b.slice(5, 8) + '-' +
    (8 + (parseInt(c[0], 16) % 4)).toString(16) + c.slice(1, 4) + '-' +
    d.slice(0, 4) + c.slice(4, 8) + d.slice(4, 8)
  );
}

/** BSCA dev storage paths (product narrative). */
export const BSCA_PATHS = {
  uncDropRoot:
    '\\\\odsbscastoragedev\\s\\storage\\root\\TO_ODS\\2026\\Medicare\\RdIMAPDHMORaw\\',
  appStaging:
    '\\\\odsbscastoragedev\\app\\directories\\bsca\\staging\\2026\\IMAPDHMO\\',
};

export const BSCA_IDS = {
  tenant: bscaUuid(1),
  pipelineRun: bscaUuid(40),
  refreshFlow: bscaUuid(30),
  planYear2026: bscaUuid(2),
  planYear2025: bscaUuid(3),
  productImapd: bscaUuid(10),
  productImapdPpo: bscaUuid(11),
  productDimapd: bscaUuid(12),
  productGmapd: bscaUuid(13),
  productDualsLa: bscaUuid(14),
  productDualsSd: bscaUuid(15),
  productMdCalLa: bscaUuid(16),
  productMdCalSd: bscaUuid(17),
  productAccu: bscaUuid(18),
  productVision: bscaUuid(19),
  ppyImapd2026: bscaUuid(20),
  fileSource: bscaUuid(70),
  fileImport: bscaUuid(96),
  watchPath: bscaUuid(95),
  cassConfig: bscaUuid(50),
  cassRun: bscaUuid(51),
  cassBatch: bscaUuid(52),
  cleansingPipeline: bscaUuid(60),
  directoryMain: bscaUuid(80),
  udfTrim: bscaUuid(90),
  chapterMPCP: bscaUuid(97),
  bookEn: bscaUuid(98),
  ingestionConfig: bscaUuid(55),
  fileEvent: bscaUuid(100),
  intakeJob: bscaUuid(101),
  /** ISO 639 registry rows (iso_language_standard.id) — all 12 CA threshold languages. */
  isoEn: bscaUuid(600),
  isoEs: bscaUuid(601),
  isoAr: bscaUuid(602),
  isoHy: bscaUuid(603),
  isoFa: bscaUuid(604),
  isoKm: bscaUuid(605),
  isoKo: bscaUuid(606),
  isoRu: bscaUuid(607),
  isoTl: bscaUuid(608),
  isoZhHans: bscaUuid(609),
  isoZhHant: bscaUuid(613),
  isoVi: bscaUuid(614),
  langEn: bscaUuid(610),
  langEs: bscaUuid(611),
  langAr: bscaUuid(620),
  langHy: bscaUuid(621),
  langFa: bscaUuid(622),
  langKm: bscaUuid(623),
  langKo: bscaUuid(624),
  langRu: bscaUuid(625),
  langTl: bscaUuid(626),
  langZhHans: bscaUuid(627),
  langZhHant: bscaUuid(628),
  langVi: bscaUuid(629),
  specialtyPcp: bscaUuid(1610),
  specialtyCard: bscaUuid(1611),
  networkChoice: bscaUuid(1620),
  enrollmentAep: bscaUuid(1630),
  apiClient: bscaUuid(1200),
  stFileBridge: bscaUuid(900),
  stIngestion: bscaUuid(901),
  stCleansing: bscaUuid(902),
  stCass: bscaUuid(903),
  stRecon: bscaUuid(904),
  compDedup: bscaUuid(920),
  compCanonical: bscaUuid(921),
  // Admin / RBAC
  userJlynn: bscaUuid(8000),
  userAdmin: bscaUuid(8001),
  userAnalyst: bscaUuid(8002),
  roleSuperAdmin: bscaUuid(8010),
  roleTenantAdmin: bscaUuid(8011),
  rolePipelineOps: bscaUuid(8012),
  roleRuleEditor: bscaUuid(8013),
  roleAnalyst: bscaUuid(8014),
  roleViewer: bscaUuid(8015),
  roleApiConsumer: bscaUuid(8016),
  // Archival Service
  archivalJobHotToWarm: bscaUuid(9000),
  archivalJobWarmToCold: bscaUuid(9001),
  archivalJobSoftPurge: bscaUuid(9002),
  archivalJobPartCreate: bscaUuid(9003),
  archivalJobIntegrity: bscaUuid(9004),
  archivalJobCompliance: bscaUuid(9005),
  archivalScheduleHotToWarm: bscaUuid(9010),
  archivalScheduleWarmToCold: bscaUuid(9011),
  archivalScheduleSoftPurge: bscaUuid(9012),
  archivalScheduleHardPurge: bscaUuid(9013),
  archivalSchedulePartCreate: bscaUuid(9014),
  archivalSchedulePartStats: bscaUuid(9015),
  archivalScheduleCassCleanup: bscaUuid(9016),
  archivalScheduleLockCleanup: bscaUuid(9017),
  archivalScheduleRestoreCleanup: bscaUuid(9018),
  archivalScheduleIntegrity: bscaUuid(9019),
  archivalScheduleCompliance: bscaUuid(9020),
  archivalScheduleGlacier: bscaUuid(9021),
  snapshotStagingJan: bscaUuid(9100),
  snapshotStagingFeb: bscaUuid(9101),
  snapshotStagingMar: bscaUuid(9102),
  snapshotAuditJan: bscaUuid(9103),
  snapshotColdQ12024: bscaUuid(9110),
  legalHoldOig: bscaUuid(9200),
  restoreReq1: bscaUuid(9300),
  complianceReport202603: bscaUuid(9400),
  integrityCheck1: bscaUuid(9500),
  integrityCheck2: bscaUuid(9501),
  integrityCheck3: bscaUuid(9502),
};

function rawDataForRow(i) {
  const src = BSCA_RAW_PROVIDERS[i] || BSCA_RAW_PROVIDERS[0];
  return {
    PROV_NPI: src.PROV_NPI,
    PROV_LNAME: src.PROV_LNAME,
    PROV_FNAME: src.PROV_FNAME,
    PROV_GENDER: src.PROV_GENDER,
    PROV_ACAD_DEGREE: src.PROV_ACAD_DEGREE,
    PROV_TYPE: src.PROV_TYPE,
    PROV_TYPE_1: src.PROV_TYPE_1,
    GRP_NM: src.GRP_NM,
    SITE_NM: src.SITE_NM,
    SITE_ADDR1: src.SITE_ADDR1,
    SITE_CITY: src.SITE_CITY,
    SITE_STATE: src.SITE_STATE,
    SITE_ZIP: src.SITE_ZIP,
    SITE_PHONE: src.SITE_PHONE,
    NETWORK_CODE: src.NETWORK_CODE,
    SITE_FRGN_LANG_ID_CD_1: src.SITE_FRGN_LANG_1,
    _source_profile: 'RdIMAPDHMORaw',
    _approx_column_count: 386,
  };
}

function makeStagingRow(i) {
  const raw = BSCA_RAW_PROVIDERS[i] || BSCA_RAW_PROVIDERS[0];
  const clean = BSCA_CLEANSED_PROVIDERS[i] || {};
  const canonical_data = {
    provider_npi: raw.PROV_NPI,
    last_name: raw.PROV_LNAME,
    first_name: raw.PROV_FNAME,
    degree: raw.PROV_ACAD_DEGREE,
    gender: raw.PROV_GENDER,
    provider_type: raw.PROV_TYPE,
    specialty_code: raw.PROV_TYPE_1,
    group_name: raw.GRP_NM,
    site_name: raw.SITE_NM || raw.GRP_NM,
    site_address_1: raw.SITE_ADDR1,
    city: raw.SITE_CITY,
    state: raw.SITE_STATE,
    zip: raw.SITE_ZIP,
    phone: clean.SITE_PHONE || raw.SITE_PHONE,
    network_code: raw.NETWORK_CODE,
    languages: raw.SITE_FRGN_LANG_1 ? [raw.SITE_FRGN_LANG_1] : [],
    latitude: clean.Latitude ? Number(clean.Latitude) : null,
    longitude: clean.Longitude ? Number(clean.Longitude) : null,
    cass_error_code: clean.CASSErrorcode || null,
  };
  const extended_data = {
    SITE_FRGN_LANG_ID_CD_1: raw.SITE_FRGN_LANG_1,
    BOARD_CERT_1: raw.BOARD_CERT_1 || '',
    SITE_ACPT_NEW_PAT: raw.SITE_ACPT_NEW_PAT || '',
    SITE_TELE_IND: raw.SITE_TELE_IND || 'N',
  };
  return {
    id: bscaUuid(5000 + i),
    pipeline_run_id: BSCA_IDS.pipelineRun,
    raw_record_id: bscaUuid(4000 + i),
    file_import_id: BSCA_IDS.fileImport,
    stage: 'cass_verified',
    canonical_data,
    extended_data,
    cleansing_log: [
      { udf: 'TRIM', field: '*', at: '2026-04-04T10:04:00Z' },
      { udf: 'UPPER', field: 'last_name', before: raw.PROV_LNAME.toLowerCase(), after: raw.PROV_LNAME },
      { udf: 'PHONE_FORMAT', field: 'phone', before: raw.SITE_PHONE, after: clean.SITE_PHONE || '' },
    ],
    quality_flags: raw.PROV_NPI ? {} : { provider_npi: { flag: 'missing', severity: 'warning' } },
    error_count: 0,
    is_suppressed: false,
    suppression_reason: null,
  };
}

function makeRawRow(i) {
  return {
    id: bscaUuid(4000 + i),
    pipeline_run_id: BSCA_IDS.pipelineRun,
    file_import_id: BSCA_IDS.fileImport,
    row_number: i + 1,
    raw_data: rawDataForRow(i),
    raw_hash: `xxh:${(4000 + i).toString(16)}`,
    validation_status: 'valid',
    validation_errors: null,
  };
}

function makeCassResultRow(i) {
  const sid = bscaUuid(5000 + i);
  const raw = BSCA_RAW_PROVIDERS[i] || BSCA_RAW_PROVIDERS[0];
  const clean = BSCA_CLEANSED_PROVIDERS[i] || {};
  const lat = clean.Latitude ? Number(clean.Latitude) : 0;
  const lon = clean.Longitude ? Number(clean.Longitude) : 0;
  const matched = lat !== 0 && lon !== 0;
  return {
    id: bscaUuid(6000 + i),
    pipeline_run_id: BSCA_IDS.pipelineRun,
    cass_run_id: BSCA_IDS.cassRun,
    cass_batch_id: BSCA_IDS.cassBatch,
    staging_record_id: sid,
    provider_npi: raw.PROV_NPI,
    site_npi: null,
    input_address: { address1: raw.SITE_ADDR1, city: raw.SITE_CITY, state: raw.SITE_STATE, zip: raw.SITE_ZIP },
    cache_key: matched ? `sha256:addr-${i}` : null,
    was_cache_hit: i % 7 === 0,
    output_address: matched
      ? { address1: clean.SITE_ADDR1 || raw.SITE_ADDR1, city: clean.SITE_CITY || raw.SITE_CITY, state: clean.SITE_STATE || 'CA', zip: clean.SITE_ZIP || raw.SITE_ZIP }
      : null,
    latitude: matched ? lat : null,
    longitude: matched ? lon : null,
    geo_precision: matched ? 'rooftop' : 'none',
    geo_source: matched ? 'bcc' : null,
    cass_status: matched ? 'valid' : 'error',
    bcc_error_code: clean.CASSErrorcode || (matched ? '31' : 'E412'),
    fl_status_code: matched ? 'S80000' : 'E412',
    address_changed: false,
    is_included_in_dir: matched,
    created_at: '2026-04-04T10:08:00Z',
  };
}

function makeProviderRow(i) {
  const raw = BSCA_RAW_PROVIDERS[i] || BSCA_RAW_PROVIDERS[0];
  const clean = BSCA_CLEANSED_PROVIDERS[i] || {};
  const lat = clean.Latitude ? Number(clean.Latitude) : null;
  const lon = clean.Longitude ? Number(clean.Longitude) : null;
  return {
    id: bscaUuid(7000 + i),
    pipeline_run_id: BSCA_IDS.pipelineRun,
    file_import_id: BSCA_IDS.fileImport,
    record_key: `${raw.PROV_NPI}-SITE-${raw.id}`,
    source_row_num: i + 1,
    npi: raw.PROV_NPI,
    last_name: raw.PROV_LNAME,
    first_name: raw.PROV_FNAME,
    degree: raw.PROV_ACAD_DEGREE,
    gender: raw.PROV_GENDER,
    specialty: raw.PROV_TYPE_1,
    provider_type: raw.PROV_TYPE,
    group_name: raw.GRP_NM,
    site_name: raw.SITE_NM || raw.GRP_NM,
    address1: raw.SITE_ADDR1,
    city: raw.SITE_CITY,
    state: raw.SITE_STATE,
    zip: raw.SITE_ZIP,
    phone: clean.SITE_PHONE || raw.SITE_PHONE,
    latitude: lat,
    longitude: lon,
    network_code: raw.NETWORK_CODE,
    languages: raw.SITE_FRGN_LANG_1 ? [raw.SITE_FRGN_LANG_1] : [],
    cass_error_code: clean.CASSErrorcode || null,
    raw_data: {
      profile: 'RdIMAPDHMORaw',
      column_count: 386,
      sample_keys: ['PROV_NPI', 'SITE_ADDR1', 'SITE_ZIP', 'NETWORK_CODE'],
    },
    extended_data: { BOARD_CERT_1: raw.BOARD_CERT_1 || '' },
    status: 'active',
    error_message: null,
    created_at: '2026-04-04T10:06:00Z',
    updated_at: '2026-04-04T10:06:00Z',
  };
}

const GENERATORS = {
  tenant: () => [
    {
      id: BSCA_IDS.tenant,
      code: 'BSCA',
      name: 'Blue Shield of California',
      status: 'active',
      created_at: '2024-01-15T08:00:00Z',
    },
  ],
  product: () => [
    { id: BSCA_IDS.productImapd,    tenant_id: BSCA_IDS.tenant, lob_code: 'IMAPDHMO',   name: 'Individual Medicare Advantage PDP HMO',  product_type: 'Medicare',   status: 'active' },
    { id: BSCA_IDS.productImapdPpo, tenant_id: BSCA_IDS.tenant, lob_code: 'IMAPDPPO',   name: 'Individual Medicare Advantage PDP PPO',  product_type: 'Medicare',   status: 'active' },
    { id: BSCA_IDS.productDimapd,   tenant_id: BSCA_IDS.tenant, lob_code: 'DIMAPDHMO',  name: 'Dual Individual MAPD HMO (D-SNP)',       product_type: 'Medicare',   status: 'active' },
    { id: BSCA_IDS.productGmapd,    tenant_id: BSCA_IDS.tenant, lob_code: 'GMAPDPPO',   name: 'Group Medicare Advantage PDP PPO',       product_type: 'Medicare',   status: 'active' },
    { id: BSCA_IDS.productDualsLa,  tenant_id: BSCA_IDS.tenant, lob_code: 'Duals_LA',   name: 'Dual-Eligible Los Angeles County',       product_type: 'Medicare',   status: 'active' },
    { id: BSCA_IDS.productDualsSd,  tenant_id: BSCA_IDS.tenant, lob_code: 'Duals_SD',   name: 'Dual-Eligible San Diego County',         product_type: 'Medicare',   status: 'active' },
    { id: BSCA_IDS.productMdCalLa,  tenant_id: BSCA_IDS.tenant, lob_code: 'MdCal_LA',   name: 'Medi-Cal Los Angeles County',            product_type: 'Medi-Cal',   status: 'active' },
    { id: BSCA_IDS.productMdCalSd,  tenant_id: BSCA_IDS.tenant, lob_code: 'MdCal_SD',   name: 'Medi-Cal San Diego County',              product_type: 'Medi-Cal',   status: 'active' },
    { id: BSCA_IDS.productAccu,     tenant_id: BSCA_IDS.tenant, lob_code: 'ACCU',       name: 'Acupuncture & Chiropractic',             product_type: 'Ancillary',  status: 'active' },
    { id: BSCA_IDS.productVision,   tenant_id: BSCA_IDS.tenant, lob_code: 'VISION',     name: 'Vision Services',                        product_type: 'Ancillary',  status: 'active' },
  ],
  pipeline_run: () => [
    {
      id: BSCA_IDS.pipelineRun,
      tenant_id: BSCA_IDS.tenant,
      status: 'running',
      plan_year: 2026,
      started_at: '2026-04-04T10:00:00Z',
    },
  ],
  refresh_flow: () => [
    {
      id: BSCA_IDS.refreshFlow,
      tenant_id: BSCA_IDS.tenant,
      name: 'BSCA Radius Directory Refresh',
      version: 12,
      is_active: true,
      trigger_type: 'scheduled',
      trigger_config: { cron: '0 3 * * *', timezone: 'America/Los_Angeles' },
      max_retries: 2,
      notification_channels: ['email:directory-ops@bsca.example'],
    },
  ],
  refresh_flow_station: () =>
    [
      { type: 'FILE_BRIDGE', label: 'File bridge (Intake)', ord: 1, id: BSCA_IDS.stFileBridge, retries: 3 },
      { type: 'INGESTION', label: 'Ingestion (Raw → Canonical)', ord: 2, id: BSCA_IDS.stIngestion, retries: 2 },
      { type: 'CLEANSING', label: 'Cleansing (UDF Pipeline)', ord: 3, id: BSCA_IDS.stCleansing, retries: 3 },
      { type: 'CASS', label: 'CASS (Address Standardization)', ord: 4, id: BSCA_IDS.stCass, retries: 5 },
      { type: 'RULES', label: 'Rules & Matching (CKDTree)', ord: 5, id: bscaUuid(905), retries: 2 },
      { type: 'RECON', label: 'Reconciliation & Quality', ord: 6, id: BSCA_IDS.stRecon, retries: 2 },
      { type: 'OUTPUT', label: 'Output (Directory API & Precomp)', ord: 7, id: bscaUuid(906), retries: 1 },
    ].map((s) => ({
      id: s.id,
      flow_id: BSCA_IDS.refreshFlow,
      station_type: s.type,
      label: s.label,
      ordinal: s.ord,
      is_enabled: true,
      config: { product_code: 'IMAPDHMO', plan_year: 2026 },
      max_retries: s.retries,
      checkpointable: true,
    })),
  refresh_flow_component: () => [
    {
      id: BSCA_IDS.compDedup,
      station_id: BSCA_IDS.stFileBridge,
      component_type: 'deduplication',
      component_role: 'processor',
      label: 'Tiered dedup',
      ordinal: 1,
      is_enabled: true,
      config: { phase1: 'name_pattern', phase2: 'xxhash64' },
      template_id: null,
    },
    {
      id: BSCA_IDS.compCanonical,
      station_id: BSCA_IDS.stIngestion,
      component_type: 'canonical_schema',
      component_role: 'processor',
      label: '386-col map',
      ordinal: 1,
      is_enabled: true,
      config: { mapping_version: 2026.1 },
      template_id: null,
    },
  ],
  station_connection: () => [
    { id: bscaUuid(930), flow_id: BSCA_IDS.refreshFlow, from_station_id: BSCA_IDS.stFileBridge, to_station_id: BSCA_IDS.stIngestion, from_port: 'output', to_port: 'input' },
    { id: bscaUuid(931), flow_id: BSCA_IDS.refreshFlow, from_station_id: BSCA_IDS.stIngestion, to_station_id: BSCA_IDS.stCleansing, from_port: 'output', to_port: 'input' },
    { id: bscaUuid(932), flow_id: BSCA_IDS.refreshFlow, from_station_id: BSCA_IDS.stCleansing, to_station_id: BSCA_IDS.stCass, from_port: 'output', to_port: 'input' },
    { id: bscaUuid(933), flow_id: BSCA_IDS.refreshFlow, from_station_id: BSCA_IDS.stCass, to_station_id: bscaUuid(905), from_port: 'output', to_port: 'input' },
    { id: bscaUuid(934), flow_id: BSCA_IDS.refreshFlow, from_station_id: bscaUuid(905), to_station_id: BSCA_IDS.stRecon, from_port: 'output', to_port: 'input' },
  ],
  refresh_flow_run: () => [
    {
      id: BSCA_IDS.pipelineRun,
      flow_id: BSCA_IDS.refreshFlow,
      flow_version: 12,
      status: 'running',
      detailed_status: 'cass_geocoding',
      trigger_type: 'scheduled',
      failure_reason: null,
      failure_station: null,
      failure_component: null,
      started_at: '2026-04-04T10:00:00Z',
      completed_at: null,
    },
  ],
  run_status: () => {
    const s = (uuid, code, cat, station, label, desc, terminal, error, ord) => ({
      id: bscaUuid(uuid), code, category: cat, station, label, description: desc,
      is_terminal: terminal, is_error: error, ordinal: ord,
    });
    return [
      // ── Cross-station statuses ──
      s(6001, 'pending',                     'pending',      null,        'Pending',                          'Run created, waiting for execution slot',                                                false, false, 1),
      s(6002, 'queued',                      'pending',      null,        'Queued',                           'Run is in the execution queue behind other runs',                                        false, false, 2),
      s(6003, 'lock_acquired',               'running',      null,        'Lock Acquired',                    'Pipeline lock obtained, execution starting',                                             false, false, 3),
      s(6004, 'lock_failed',                 'failed',       null,        'Lock Failed',                      'Could not acquire pipeline lock — another run is active for this product',                true,  true,  4),

      // ── Intake station ──
      s(6010, 'intake_started',              'running',      'intake',    'Intake Started',                   'File watcher detected file, intake job created',                                         false, false, 10),
      s(6011, 'intake_file_moving',          'running',      'intake',    'File Moving',                      'Copying file from source to app directory',                                              false, false, 11),
      s(6012, 'intake_dedup_checking',       'running',      'intake',    'Dedup Checking',                   'Running name-based and hash-based deduplication',                                        false, false, 12),
      s(6013, 'intake_corruption_checking',  'running',      'intake',    'Corruption Checking',              'Sampling rows to verify file readability and format',                                    false, false, 13),
      s(6014, 'intake_parsing',              'running',      'intake',    'Parsing',                          'Streaming file rows into raw_record table',                                              false, false, 14),
      s(6015, 'intake_completed',            'running',      'intake',    'Intake Completed',                 'File successfully parsed and raw_record rows written',                                   false, false, 15),
      s(6016, 'intake_failed_corrupt',       'failed',       'intake',    'Failed — Corrupt File',            'File failed corruption check (truncated, encoding error, binary content)',                true,  true,  16),
      s(6017, 'intake_failed_duplicate',     'quarantined',  'intake',    'Quarantined — Duplicate File',     'File is an exact or content duplicate of a prior import',                                true,  true,  17),
      s(6018, 'intake_failed_size',          'quarantined',  'intake',    'Quarantined — Size Limit',         'File exceeds configured maximum size or is suspiciously small',                          true,  true,  18),

      // ── Ingestion station ──
      s(6020, 'ingestion_started',           'running',      'ingestion', 'Ingestion Started',                'Raw records being mapped to canonical schema',                                           false, false, 20),
      s(6021, 'ingestion_mapping',           'running',      'ingestion', 'Column Mapping',                   'Mapping source columns to canonical fields via source_field_mapping',                    false, false, 21),
      s(6022, 'ingestion_null_profiling',    'running',      'ingestion', 'NULL Profiling',                   'Computing NULL rates per field and comparing to thresholds',                             false, false, 22),
      s(6023, 'ingestion_completed',         'running',      'ingestion', 'Ingestion Completed',              'All raw records mapped to staging_record at stage=mapped',                               false, false, 23),
      s(6024, 'ingestion_failed_schema',     'failed',       'ingestion', 'Failed — Schema Mismatch',        'Column count or names do not match expected schema',                                    true,  true,  24),
      s(6025, 'ingestion_failed_stopper',    'quarantined',  'ingestion', 'Quarantined — NULL Threshold',     'Critical field NULL rate exceeded stopper threshold (e.g. PROV_NPI > 5%)',              true,  true,  25),

      // ── Cleansing station ──
      s(6030, 'cleansing_started',           'running',      'cleansing', 'Cleansing Started',                'UDF pipeline executing against staging_record at stage=mapped',                         false, false, 30),
      s(6031, 'cleansing_in_progress',       'running',      'cleansing', 'Cleansing In Progress',            'UDF transforms running sequentially per configured pipeline',                           false, false, 31),
      s(6032, 'cleansing_completed',         'running',      'cleansing', 'Cleansing Completed',              'All records advanced to stage=cleansed',                                                 false, false, 32),
      s(6033, 'cleansing_failed_dlq',        'failed',       'cleansing', 'Failed — Too Many DLQ Records',    'Dead letter queue exceeded configured threshold for problematic records',                true,  true,  33),

      // ── CASS station ──
      s(6040, 'cass_started',                'running',      'cass',      'CASS Started',                     'Address standardization and geocoding via BCC SDK',                                     false, false, 40),
      s(6041, 'cass_geocoding',              'running',      'cass',      'Geocoding',                        'BCC batches processing — standardizing addresses and computing lat/lon',                 false, false, 41),
      s(6042, 'cass_fallback',               'running',      'cass',      'Geocode Fallback',                 'Applying ZIP/City/County centroid fallback for unresolved addresses',                    false, false, 42),
      s(6043, 'cass_completed',              'running',      'cass',      'CASS Completed',                   'All records geocoded or suppressed, stage advanced to cass_verified',                    false, false, 43),
      s(6044, 'cass_failed_threshold',       'quarantined',  'cass',      'Quarantined — Geocode Failures',   'Too many addresses unresolvable — exceeds configured stopper threshold',                 true,  true,  44),
      s(6045, 'cass_failed_bcc',             'failed',       'cass',      'Failed — BCC SDK Error',           'BCC Architect SDK returned unrecoverable error or circuit breaker opened',              true,  true,  45),

      // ── Rules station ──
      s(6050, 'rules_started',               'running',      'rules',     'Rules Started',                    'Building CKDTree spatial index from geocoded providers',                                false, false, 50),
      s(6051, 'rules_index_building',        'running',      'rules',     'Building Spatial Index',           'CKDTree construction in progress from provider lat/lon',                                false, false, 51),
      s(6052, 'rules_completed',             'running',      'rules',     'Rules Completed',                  'Spatial index built and ready for API queries',                                         false, false, 52),
      s(6053, 'rules_failed_validation',     'failed',       'rules',     'Failed — Rule Validation',        'One or more rules failed validation (invalid field refs, bad filter syntax)',            true,  true,  53),

      // ── Recon station ──
      s(6060, 'recon_started',               'running',      'recon',     'Recon Started',                    'Reconciliation and quality scoring in progress',                                        false, false, 60),
      s(6061, 'recon_quality_scoring',       'running',      'recon',     'Quality Scoring',                  'Computing dimensional quality scores (completeness, accuracy, etc.)',                    false, false, 61),
      s(6062, 'recon_completed',             'running',      'recon',     'Recon Completed',                  'All quality and recon checks passed — ready for approval',                              false, false, 62),
      s(6063, 'recon_failed_variance',       'failed',       'recon',     'Failed — Record Count Variance',  'Record count between stations exceeded acceptable variance threshold',                   true,  true,  63),

      // ── Output station ──
      s(6070, 'output_started',              'running',      'output',    'Output Started',                   'Generating precomp files and activating API endpoints',                                 false, false, 70),
      s(6071, 'output_precomp_generating',   'running',      'output',    'Precomp Generating',               'Building precomp CSV output files for TNO composition',                                 false, false, 71),
      s(6072, 'output_api_activating',       'running',      'output',    'API Activating',                   'Swapping active spatial index for API to serve new data',                               false, false, 72),
      s(6073, 'output_serving',              'completed',    'output',    'Serving',                          'Pipeline complete — Output API is serving data from this refresh',                      true,  false, 73),
      s(6074, 'output_failed_delivery',      'failed',       'output',    'Failed — Delivery Error',         'Precomp file SFTP delivery or API activation failed',                                   true,  true,  74),

      // ── Approval / terminal statuses ──
      s(6080, 'awaiting_approval',           'running',      null,        'Awaiting Approval',                'Pipeline execution complete, awaiting operator approval to serve data',                  false, false, 80),
      s(6081, 'approved',                    'completed',    null,        'Approved',                         'Operator approved — data is live and being served to API consumers',                    true,  false, 81),
      s(6082, 'rejected',                    'failed',       null,        'Rejected',                         'Operator rejected refresh results — previous approved refresh remains active',          true,  true,  82),
      s(6083, 'cancelled',                   'cancelled',    null,        'Cancelled',                        'Run was manually cancelled before completion',                                          true,  false, 83),
      s(6084, 'superseded',                  'cancelled',    null,        'Superseded',                       'A newer run for the same product replaced this one before approval',                    true,  false, 84),
    ];
  },
  station_run: () =>
    [1, 2, 3, 4].map((ord) => ({
      id: bscaUuid(940 + ord),
      run_id: BSCA_IDS.pipelineRun,
      flow_station_id: bscaUuid(899 + ord),
      station_type: ['FILE_BRIDGE', 'INGESTION', 'CLEANSING', 'CASS'][ord - 1],
      station_ordinal: ord,
      status: ord <= 3 ? 'completed' : 'running',
      started_at: `2026-04-04T10:0${ord}:00Z`,
      completed_at: ord <= 3 ? `2026-04-04T10:0${ord + 2}:00Z` : null,
      checkpoint_json: null,
      records_in: ord === 2 ? 100 : ord === 1 ? 1 : 100,
      records_out: ord === 2 ? 100 : ord === 1 ? 1 : 100,
    })),
  component_run: () => [
    {
      id: bscaUuid(960),
      station_run_id: bscaUuid(942),
      flow_component_id: BSCA_IDS.compCanonical,
      status: 'completed',
      started_at: '2026-04-04T10:03:00Z',
      completed_at: '2026-04-04T10:04:30Z',
      output_json: { rows_mapped: 100 },
      error_message: null,
      metrics: { rows_mapped: 100, extended_fields: 306 },
    },
  ],
  recon_checkpoint: () => [
    {
      id: bscaUuid(990),
      run_id: BSCA_IDS.pipelineRun,
      station_type: 'INGESTION',
      row_count_in: 100,
      row_count_out: 100,
      checkpoint_type: 'exit',
      record_count: 100,
      byte_count: 12500000,
      checksum: 'sha256:chk-ingest-exit',
      null_profile: { PROV_NPI: 0.008, SITE_NPI: 1.0 },
    },
  ],
  intake_watch_path: () => {
    const wp = (uuid, prodId, fsId, pattern, desc) => ({
      id: bscaUuid(uuid), tenant_id: BSCA_IDS.tenant, product_id: prodId,
      file_source_id: fsId, watch_path: BSCA_PATHS.uncDropRoot,
      file_pattern: pattern, recursive: false, poll_interval_seconds: 30,
      stability_delay_seconds: 120, is_enabled: true,
      exclude_patterns: ['*.yaml', '*.log', '*.tmp'],
      description: desc, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-04-04T09:00:00Z',
    });
    return [
      wp(95,   BSCA_IDS.productImapd,    BSCA_IDS.fileSource, 'IMAPDHMO*.txt',  'RdIMAPDHMORaw — Individual MAPD HMO'),
      wp(5001, BSCA_IDS.productImapdPpo, bscaUuid(71),        'IMAPDPPO*.txt',  'RdIMAPDPPORaw — Individual MAPD PPO'),
      wp(5002, BSCA_IDS.productDimapd,   bscaUuid(72),        'DIMAPDHMO*.txt', 'RdDIMAPDHMORaw — Dual MAPD HMO (D-SNP)'),
      wp(5003, BSCA_IDS.productGmapd,    bscaUuid(73),        'GMAPDPPO*.txt',  'RdGMAPDPPORaw — Group MAPD PPO'),
      wp(5004, BSCA_IDS.productDualsLa,  bscaUuid(74),        'DualsLA*.txt',   'RdDualsLARaw — Dual-Eligible Los Angeles'),
      wp(5005, BSCA_IDS.productDualsSd,  bscaUuid(75),        'DualsSD*.txt',   'RdDualsSDRaw — Dual-Eligible San Diego'),
      wp(5006, BSCA_IDS.productMdCalLa,  bscaUuid(76),        'MdCalLA*.txt',   'RdMdCalLARaw — Medi-Cal Los Angeles'),
      wp(5007, BSCA_IDS.productMdCalSd,  bscaUuid(77),        'MdCalSD*.txt',   'RdMdCalSDRaw — Medi-Cal San Diego'),
      wp(5008, BSCA_IDS.productAccu,     bscaUuid(78),        'ACCU*.txt',      'RdACCURaw — Acupuncture & Chiropractic'),
      wp(5009, BSCA_IDS.productVision,   bscaUuid(79),        'Vision*.txt',    'RdVisionRaw — Vision Services'),
    ];
  },
  intake_retry_config: () => [
    {
      id: bscaUuid(105),
      tenant_id: BSCA_IDS.tenant,
      product_id: BSCA_IDS.productImapd,
      max_retries: 3,
      retry_backoff_base_ms: 2000,
      retry_backoff_max_ms: 120000,
      retry_backoff_multiplier: 2.0,
      job_timeout_seconds: 7200,
      component_timeout_seconds: 600,
      failure_threshold: 5,
      recovery_timeout_seconds: 3600,
      description: 'BSCA IMAPD default — override per LOB if needed',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
  intake_file_event: () => [
    {
      id: BSCA_IDS.fileEvent,
      watch_path_id: BSCA_IDS.watchPath,
      tenant_id: BSCA_IDS.tenant,
      source_file_path: `${BSCA_PATHS.uncDropRoot}IMAPDHMOFullDirectory_20260404.txt`,
      file_name: 'IMAPDHMOFullDirectory_20260404.txt',
      file_size_bytes: 285000000,
      file_modified_at: '2026-04-04T09:55:00Z',
      event_type: 'stable_closed',
      is_config_file: false,
      intake_job_id: BSCA_IDS.intakeJob,
      status: 'job_created',
      skip_reason: null,
      detected_at: '2026-04-04T10:01:50Z',
    },
  ],
  intake_job: () => [
    {
      id: BSCA_IDS.intakeJob,
      tenant_id: BSCA_IDS.tenant,
      product_id: BSCA_IDS.productImapd,
      plan_year_id: BSCA_IDS.planYear2026,
      file_event_id: BSCA_IDS.fileEvent,
      refresh_flow_id: BSCA_IDS.refreshFlow,
      source_file_path: `${BSCA_PATHS.uncDropRoot}IMAPDHMOFullDirectory_20260404.txt`,
      original_filename: 'IMAPDHMOFullDirectory_20260404.txt',
      file_size_bytes: 285000000,
      app_file_path: `${BSCA_PATHS.appStaging}inbox`,
      renamed_filename: 'IMAPDHMOFullDirectory_20260404_bsca101.txt',
      status: 'PARSED',
      name_dedup_verdict: 'UNIQUE',
      hash_dedup_verdict: 'UNIQUE',
      triggered_by: 'watcher',
      retry_count: 0,
      max_retries: 3,
      last_error: null,
      quarantine_reason: null,
      created_at: '2026-04-04T10:01:52Z',
      started_at: '2026-04-04T10:01:53Z',
      completed_at: '2026-04-04T10:02:30Z',
      duration_ms: 37000,
      worker_id: 'intake-worker-bsca-3',
      locked_at: '2026-04-04T10:01:53Z',
      lock_expires_at: '2026-04-04T10:31:53Z',
    },
  ],
  intake_job_component_run: () => [
    {
      id: bscaUuid(102),
      intake_job_id: BSCA_IDS.intakeJob,
      component_type: 'file',
      component_role: 'processor',
      ordinal: 1,
      status: 'completed',
      started_at: '2026-04-04T10:01:54Z',
      completed_at: '2026-04-04T10:02:00Z',
      duration_ms: 6000,
      input_summary: { path: BSCA_PATHS.uncDropRoot },
      output_summary: { bytes: 285000000 },
      error_message: null,
      error_detail: null,
      retry_count: 0,
      created_at: '2026-04-04T10:01:54Z',
    },
  ],
  intake_file_move_log: () => [
    {
      id: bscaUuid(103),
      intake_job_id: BSCA_IDS.intakeJob,
      source_path: BSCA_PATHS.uncDropRoot,
      source_filename: 'IMAPDHMOFullDirectory_20260404.txt',
      dest_path: BSCA_PATHS.appStaging,
      dest_filename: 'IMAPDHMOFullDirectory_20260404_bsca101.txt',
      dest_full_path: `${BSCA_PATHS.appStaging}IMAPDHMOFullDirectory_20260404_bsca101.txt`,
      tenant_segment: 'BSCA',
      lob_segment: 'IMAPDHMO',
      plan_year_segment: '2026',
      status: 'completed',
      directories_created: ['2026', 'IMAPDHMO'],
      file_size_bytes: 285000000,
      copy_duration_ms: 12000,
      source_checksum: 'sha256:src…',
      dest_checksum: 'sha256:dst…',
      checksums_match: true,
      error_message: null,
      started_at: '2026-04-04T10:02:05Z',
      completed_at: '2026-04-04T10:02:18Z',
      created_at: '2026-04-04T10:02:05Z',
    },
  ],
  intake_dedup_result: () => [
    {
      id: bscaUuid(104),
      intake_job_id: BSCA_IDS.intakeJob,
      name_dedup_performed: true,
      name_pattern_checked: 'IMAPDHMOFullDirectory_*.txt',
      name_match_found: false,
      name_matched_job_id: null,
      name_matched_filename: null,
      hash_dedup_performed: true,
      xxhash64_full: 'a1b2c3d4e5f67012',
      sha256_full: 'a'.repeat(64),
      xxhash64_content: '9f3e2a1b4c5d6e7f',
      sha256_content: 'b'.repeat(64),
      hash_verdict: 'UNIQUE',
      hash_matched_job_id: null,
      hash_matched_fingerprint_id: null,
      final_verdict: 'ACCEPT',
      verdict_detail: null,
      name_dedup_duration_ms: 12,
      hash_dedup_duration_ms: 850,
      total_duration_ms: 900,
      created_at: '2026-04-04T10:02:20Z',
    },
  ],
  intake_corruption_check: () => [
    {
      id: bscaUuid(1055),
      intake_job_id: BSCA_IDS.intakeJob,
      rows_sampled: 500,
      rows_readable: 500,
      rows_corrupted: 0,
      detected_encoding: 'UTF-8',
      detected_delimiter: '|',
      detected_format: 'pipe',
      header_present: true,
      column_count: 386,
      is_corrupt: false,
      corruption_type: null,
      corruption_detail: null,
      sample_errors: null,
      duration_ms: 420,
      checked_at: '2026-04-04T10:02:25Z',
    },
  ],
  ingestion_config: () => [
    {
      id: BSCA_IDS.ingestionConfig,
      tenant_id: BSCA_IDS.tenant,
      name: 'BSCA IMAPDHMO default',
      batch_size: 5000,
      dedup_enabled: true,
      dedup_strategy: 'hash',
      schema_validation_enabled: true,
      schema_drift_action: 'warn',
      stopper_enabled: true,
      stopper_max_invalid_pct: 2.0,
      stopper_max_duplicate_pct: 1.0,
      stopper_row_count_variance_pct: 15.0,
      retry_count: 2,
      is_active: true,
    },
  ],
  raw_record: () => Array.from({ length: 100 }, (_, i) => makeRawRow(i)),
  staging_record: () => Array.from({ length: 100 }, (_, i) => makeStagingRow(i)),
  ingestion_run: () => [
    {
      id: bscaUuid(560),
      station_run_id: bscaUuid(942),
      pipeline_run_id: BSCA_IDS.pipelineRun,
      tenant_id: BSCA_IDS.tenant,
      ingestion_config_id: BSCA_IDS.ingestionConfig,
      file_import_id: BSCA_IDS.fileImport,
      source_column_count: 386,
      schema_drift_detected: false,
      schema_drift_detail: null,
      total_source_rows: 100,
      raw_records_created: 100,
      valid_records: 100,
      invalid_records: 0,
      duplicate_records: 0,
      staging_records_created: 100,
      canonical_fields_mapped: 80,
      extended_fields_preserved: 306,
      consolidations_performed: 12,
      null_profile: { PROV_NPI: 0.8, SITE_NPI: 100 },
      null_threshold_breaches: 0,
      stopper_triggered: false,
      stopper_reason: null,
      config_snapshot: { version: 2026.1 },
    },
  ],
  ingestion_null_profile: () => [
    {
      id: bscaUuid(561),
      ingestion_run_id: bscaUuid(560),
      pipeline_run_id: BSCA_IDS.pipelineRun,
      field_name: 'PROV_NPI',
      field_scope: 'canonical',
      total_records: 100,
      null_count: 0,
      empty_count: 1,
      null_pct: 0.8,
      combined_null_pct: 1.0,
      threshold_configured: true,
      max_null_pct_threshold: 5.0,
      threshold_breached: false,
      is_stopper_field: true,
      prior_run_null_pct: 0.9,
      variance_from_prior: -0.1,
    },
    {
      id: bscaUuid(562),
      ingestion_run_id: bscaUuid(560),
      pipeline_run_id: BSCA_IDS.pipelineRun,
      field_name: 'SITE_NPI',
      field_scope: 'canonical',
      total_records: 100,
      null_count: 100,
      empty_count: 0,
      null_pct: 100.0,
      combined_null_pct: 100.0,
      threshold_configured: true,
      max_null_pct_threshold: 100.0,
      threshold_breached: false,
      is_stopper_field: false,
      prior_run_null_pct: 100.0,
      variance_from_prior: 0,
    },
  ],
  provider_record: () => Array.from({ length: 25 }, (_, i) => makeProviderRow(i)),
  cass_run: () => [
    {
      id: BSCA_IDS.cassRun,
      station_run_id: bscaUuid(944),
      pipeline_run_id: BSCA_IDS.pipelineRun,
      tenant_id: BSCA_IDS.tenant,
      cass_config_id: BSCA_IDS.cassConfig,
      total_input_records: 100,
      cache_hit_records: 14,
      success_records: 95,
      error_records: 5,
      stopper_triggered: false,
      stopper_reason: null,
      total_duration_ms: 48000,
      config_snapshot: { batch_size: 100 },
      created_at: '2026-04-04T10:08:00Z',
    },
  ],
  cass_batch: () => [
    {
      id: BSCA_IDS.cassBatch,
      cass_run_id: BSCA_IDS.cassRun,
      batch_number: 1,
      record_count: 100,
      start_offset: 0,
      end_offset: 99,
      status: 'completed',
      attempt_number: 1,
      success_count: 95,
      error_count: 5,
      bcc_response_time_ms: 1200,
      bcc_error_message: null,
      checkpoint_data: { last_staging_id: bscaUuid(5099) },
    },
  ],
  cass_result: () => Array.from({ length: 100 }, (_, i) => makeCassResultRow(i)),
  // Real CA ZIP code centroids from dbo.RdZipCodes (30 rows) + county centroids from dbo.RdCountyCodes (58 rows)
  geocode_fallback_ref: () => [
    ...BSCA_ZIP_CODES.map((z, i) => ({
      id: bscaUuid(2000 + i),
      fallback_type: 'zip',
      zip_code: z.zip,
      city: z.city,
      state_code: z.state,
      county_code: null,
      latitude: z.lat,
      longitude: z.lon,
      source: 'USPS',
      is_active: true,
    })),
    ...BSCA_COUNTY_CODES.map((c, i) => ({
      id: bscaUuid(2100 + i),
      fallback_type: 'county',
      zip_code: null,
      city: null,
      state_code: 'CA',
      county_code: String(c.siteCountyCd),
      latitude: c.lat,
      longitude: c.lon,
      source: 'USPS',
      is_active: true,
    })),
  ],
  provider_cass_error: () => [
    {
      id: bscaUuid(760),
      pipeline_run_id: BSCA_IDS.pipelineRun,
      cass_run_id: BSCA_IDS.cassRun,
      cass_result_id: bscaUuid(6000 + 1),
      tenant_id: BSCA_IDS.tenant,
      provider_npi: String(1992000001),
      bcc_error_code: 'NO_MATCH',
      fallback_applied: true,
      fallback_tier: 'zip_centroid',
      is_included_in_dir: true,
    },
  ],
  cass_change_log: () => [
    {
      id: bscaUuid(770),
      pipeline_run_id: BSCA_IDS.pipelineRun,
      cass_result_id: bscaUuid(6000),
      staging_record_id: bscaUuid(5000),
      change_type: 'UPDATE',
      field_name: 'SITE_ZIP',
      old_value: '90012',
      new_value: '90012-1234',
      change_source: 'BCC',
      created_at: '2026-04-04T10:08:15Z',
    },
  ],
  iso_language_standard: () => [
    { id: BSCA_IDS.isoEn, iso_639_1: 'en', iso_639_2: 'eng', iso_639_3: 'eng', name_english: 'English', direction: 'ltr' },
    { id: BSCA_IDS.isoEs, iso_639_1: 'es', iso_639_2: 'spa', iso_639_3: 'spa', name_english: 'Spanish', direction: 'ltr' },
    { id: BSCA_IDS.isoAr, iso_639_1: 'ar', iso_639_2: 'ara', iso_639_3: 'ara', name_english: 'Arabic', direction: 'rtl' },
    { id: BSCA_IDS.isoHy, iso_639_1: 'hy', iso_639_2: 'hye', iso_639_3: 'hye', name_english: 'Armenian', direction: 'ltr' },
    { id: BSCA_IDS.isoFa, iso_639_1: 'fa', iso_639_2: 'fas', iso_639_3: 'fas', name_english: 'Farsi', direction: 'rtl' },
    { id: BSCA_IDS.isoKm, iso_639_1: 'km', iso_639_2: 'khm', iso_639_3: 'khm', name_english: 'Khmer', direction: 'ltr' },
    { id: BSCA_IDS.isoKo, iso_639_1: 'ko', iso_639_2: 'kor', iso_639_3: 'kor', name_english: 'Korean', direction: 'ltr' },
    { id: BSCA_IDS.isoRu, iso_639_1: 'ru', iso_639_2: 'rus', iso_639_3: 'rus', name_english: 'Russian', direction: 'ltr' },
    { id: BSCA_IDS.isoTl, iso_639_1: 'tl', iso_639_2: 'tgl', iso_639_3: 'tgl', name_english: 'Tagalog', direction: 'ltr' },
    { id: BSCA_IDS.isoZhHans, iso_639_1: 'zh', iso_639_2: 'zho', iso_639_3: 'cmn', name_english: 'Simplified Chinese', direction: 'ltr' },
    { id: BSCA_IDS.isoZhHant, iso_639_1: 'zh', iso_639_2: 'zho', iso_639_3: 'cmn', name_english: 'Traditional Chinese', direction: 'ltr' },
    { id: BSCA_IDS.isoVi, iso_639_1: 'vi', iso_639_2: 'vie', iso_639_3: 'vie', name_english: 'Vietnamese', direction: 'ltr' },
  ],
  language: () => [
    { id: BSCA_IDS.langEn, code: 'EN01', name: 'English', iso_language_id: BSCA_IDS.isoEn, display_order: 1 },
    { id: BSCA_IDS.langEs, code: 'SP01', name: 'Spanish', iso_language_id: BSCA_IDS.isoEs, display_order: 2 },
    { id: BSCA_IDS.langAr, code: 'AR01', name: 'Arabic', iso_language_id: BSCA_IDS.isoAr, display_order: 3 },
    { id: BSCA_IDS.langHy, code: 'AM01', name: 'Armenian', iso_language_id: BSCA_IDS.isoHy, display_order: 4 },
    { id: BSCA_IDS.langFa, code: 'FA01', name: 'Farsi', iso_language_id: BSCA_IDS.isoFa, display_order: 5 },
    { id: BSCA_IDS.langKm, code: 'KH01', name: 'Khmer', iso_language_id: BSCA_IDS.isoKm, display_order: 6 },
    { id: BSCA_IDS.langKo, code: 'KO01', name: 'Korean', iso_language_id: BSCA_IDS.isoKo, display_order: 7 },
    { id: BSCA_IDS.langRu, code: 'RU01', name: 'Russian', iso_language_id: BSCA_IDS.isoRu, display_order: 8 },
    { id: BSCA_IDS.langTl, code: 'TG01', name: 'Tagalog', iso_language_id: BSCA_IDS.isoTl, display_order: 9 },
    { id: BSCA_IDS.langZhHans, code: 'CH04', name: 'Simplified Chinese', iso_language_id: BSCA_IDS.isoZhHans, display_order: 10 },
    { id: BSCA_IDS.langZhHant, code: 'CH05', name: 'Traditional Chinese', iso_language_id: BSCA_IDS.isoZhHant, display_order: 11 },
    { id: BSCA_IDS.langVi, code: 'VI01', name: 'Vietnamese', iso_language_id: BSCA_IDS.isoVi, display_order: 12 },
  ],
  language_alias: () => [
    { id: bscaUuid(630), language_id: BSCA_IDS.langEn, tenant_id: BSCA_IDS.tenant, alias_code: 'EN01' },
    { id: bscaUuid(631), language_id: BSCA_IDS.langEs, tenant_id: BSCA_IDS.tenant, alias_code: 'SP01' },
    { id: bscaUuid(632), language_id: BSCA_IDS.langAr, tenant_id: BSCA_IDS.tenant, alias_code: 'AR01' },
    { id: bscaUuid(633), language_id: BSCA_IDS.langHy, tenant_id: BSCA_IDS.tenant, alias_code: 'AM01' },
    { id: bscaUuid(634), language_id: BSCA_IDS.langFa, tenant_id: BSCA_IDS.tenant, alias_code: 'FA01' },
    { id: bscaUuid(635), language_id: BSCA_IDS.langKm, tenant_id: BSCA_IDS.tenant, alias_code: 'KH01' },
    { id: bscaUuid(636), language_id: BSCA_IDS.langKo, tenant_id: BSCA_IDS.tenant, alias_code: 'KO01' },
    { id: bscaUuid(637), language_id: BSCA_IDS.langRu, tenant_id: BSCA_IDS.tenant, alias_code: 'RU01' },
    { id: bscaUuid(638), language_id: BSCA_IDS.langTl, tenant_id: BSCA_IDS.tenant, alias_code: 'TG01' },
    { id: bscaUuid(639), language_id: BSCA_IDS.langZhHans, tenant_id: BSCA_IDS.tenant, alias_code: 'CH04' },
    { id: bscaUuid(640), language_id: BSCA_IDS.langZhHant, tenant_id: BSCA_IDS.tenant, alias_code: 'CH05' },
    { id: bscaUuid(641), language_id: BSCA_IDS.langVi, tenant_id: BSCA_IDS.tenant, alias_code: 'VI01' },
  ],
  provider_specialty_type: () => [
    {
      id: BSCA_IDS.specialtyPcp,
      code: 'PCP',
      name: 'Primary Care',
      category: 'physician',
      is_facility: false,
    },
    {
      id: BSCA_IDS.specialtyCard,
      code: 'CARD',
      name: 'Cardiology',
      category: 'physician',
      is_facility: false,
    },
  ],
  network_type: () => [
    { id: BSCA_IDS.networkChoice, code: 'CHOICE', name: 'Blue Shield Choice network' },
  ],
  directory: () => [
    {
      id: BSCA_IDS.directoryMain,
      tenant_id: BSCA_IDS.tenant,
      product_plan_year_id: BSCA_IDS.ppyImapd2026,
      name: 'BSCA IMAPDHMO Radius 2026',
      directory_type: 'both',
      query_set: 'IMAPDHMO',
      is_active: true,
      effective_date: '2026-03-01',
      expiry_date: '2026-12-31',
    },
  ],
  // Real BSCA chapters from PY2025.RdChapters (6 chapters for IMAPDHMO)
  chapter: () =>
    BSCA_CHAPTERS.map((c, i) => ({
      id: bscaUuid(1100 + i),
      directory_id: BSCA_IDS.directoryMain,
      code: c.code,
      ordinal: c.ordinal,
      description: c.english,
      is_active: true,
    })),
  // Real bilingual chapter translations (EN + ES for each of 6 chapters = 12 rows)
  chapter_translation: () =>
    BSCA_CHAPTERS.flatMap((c, i) => [
      { id: bscaUuid(1110 + i * 2), chapter_id: bscaUuid(1100 + i), language_id: BSCA_IDS.langEn, label: c.english },
      { id: bscaUuid(1111 + i * 2), chapter_id: bscaUuid(1100 + i), language_id: BSCA_IDS.langEs, label: c.spanish },
    ]),
  // Real BSCA IMAPDHMO rules from PY2025.RdRule (first 20 of 652, with real legacy WHERE clauses)
  rule: () =>
    BSCA_RULES.map((r, i) => {
      const chapterIdx = BSCA_CHAPTERS.findIndex((c) => c.code === r.chapter);
      return {
        id: bscaUuid(1120 + i),
        chapter_id: bscaUuid(1100 + (chapterIdx >= 0 ? chapterIdx : 0)),
        ordinal: i + 1,
        thread: 1,
        description: r.description,
        provider_count: r.providerCount,
        max_distance_miles: r.maxDistance,
        provider_filter: {
          op: 'and',
          conditions: [
            { field: 'provider_type', op: 'in', values: ['PCP'] },
            { field: 'network_code', op: 'in', values: ['MIMAPD000001', 'MIMAPD000003'] },
          ],
          _legacy_sql: r.providerWhereClause,
        },
        member_filter: r.memberWhereClause
          ? (() => {
              const m = r.memberWhereClause.match(/m\.Template\s*=\s*'([^']+)'/);
              return m
                ? { op: 'and', conditions: [{ field: 'template', op: 'eq', value: m[1] }] }
                : { op: 'and', conditions: [{ field: 'template', op: 'eq', value: '_UNKNOWN_' }], _legacy_sql: r.memberWhereClause };
            })()
          : null,
        specialty_codes: ['PCP'],
        network_codes: ['MIMAPD000001', 'MIMAPD000003'],
        plan_year: 2026,
        effective_date: '2026-01-01',
        is_active: true,
        legacy_rule_id: r.legacyId,
      };
    }),
  rule_translation: () => [],
  // Real BSCA full directory books from PY2025.RdFullDir (10 books with real lat/lon/radius)
  book: () =>
    BSCA_BOOKS.map((b, i) => ({
      id: bscaUuid(1130 + i),
      directory_id: BSCA_IDS.directoryMain,
      product_code: b.product,
      template: b.template,
      center_latitude: b.lat,
      center_longitude: b.lon,
      radius_miles: b.distance,
      region_label: b.region,
      plan_name: b.planName,
      language_code: 'EN01SP01',
      plan_year: 2026,
      is_active: true,
    })),
  book_translation: () =>
    BSCA_BOOK_EXTENSIONS.map((x, i) => ({
      id: bscaUuid(1160 + i),
      book_id: bscaUuid(1130 + (i % BSCA_BOOKS.length)),
      language_id: BSCA_IDS.langEn,
      region_label: x.region,
      service_area_label: x.serviceArea,
    })),
  book_geography: () =>
    BSCA_BOOKS.slice(0, 5).map((b, i) => ({
      id: bscaUuid(1140 + i),
      book_id: bscaUuid(1130 + i),
      state_code: 'CA',
      county_fips: '06037',
      zip_codes: [],
      center_lat: b.lat,
      center_lon: b.lon,
    })),
  book_chapter: () =>
    BSCA_BOOKS.slice(0, 3).flatMap((_, bi) =>
      BSCA_CHAPTERS.map((_, ci) => ({
        id: bscaUuid(1150 + bi * 10 + ci),
        book_id: bscaUuid(1130 + bi),
        chapter_id: bscaUuid(1100 + ci),
        ordinal: ci + 1,
      }))
    ),
  // Real enclosure data from PY2025.RdEnclosures — NDN / MLI PDFs per book language
  book_enclosure: () =>
    BSCA_ENCLOSURES.map((e, i) => ({
      id: bscaUuid(1200 + i),
      book_id: bscaUuid(1130 + (i % BSCA_BOOKS.length)),
      tenant_id: BSCA_IDS.tenant,
      enclosure_type: e.type,
      label: e.label,
      language_code: e.language,
      resource_name: e.name,
      resource_path: `\\\\odsbscastoragedev\\enclosures\\${e.language}\\${e.name}.pdf`,
      sequence: e.seq,
      plan_year: 2026,
      is_active: true,
    })),
  // BSCA language routing rules — bilingual (IMAPDHMO) vs dedicated (Duals_LA)
  // CQFluency/cover letters are NOT part of directories (separate Letters pipeline)
  language_routing_rule: () => [
    // ── IMAPDHMO: Bilingual product — all languages get EN01+SP01 chapter labels ──
    { id: bscaUuid(1250), product_plan_year_id: BSCA_IDS.ppyImapd2026, member_language_code: 'EN01', routing_type: 'bilingual', chapter_label_language: 'EN01SP01', enclosure_language_code: 'EN01SP01', is_active: true, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z' },
    { id: bscaUuid(1251), product_plan_year_id: BSCA_IDS.ppyImapd2026, member_language_code: 'SP01', routing_type: 'bilingual', chapter_label_language: 'EN01SP01', enclosure_language_code: 'EN01SP01', is_active: true, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z' },
    { id: bscaUuid(1252), product_plan_year_id: BSCA_IDS.ppyImapd2026, member_language_code: 'KO01', routing_type: 'bilingual', chapter_label_language: 'EN01SP01', enclosure_language_code: 'EN01SP01', is_active: true, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z' },
    { id: bscaUuid(1253), product_plan_year_id: BSCA_IDS.ppyImapd2026, member_language_code: 'VI01', routing_type: 'bilingual', chapter_label_language: 'EN01SP01', enclosure_language_code: 'EN01SP01', is_active: true, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z' },
    { id: bscaUuid(1254), product_plan_year_id: BSCA_IDS.ppyImapd2026, member_language_code: 'AR01', routing_type: 'bilingual', chapter_label_language: 'EN01SP01', enclosure_language_code: 'EN01SP01', is_active: true, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z' },
    { id: bscaUuid(1255), product_plan_year_id: BSCA_IDS.ppyImapd2026, member_language_code: 'AM01', routing_type: 'bilingual', chapter_label_language: 'EN01SP01', enclosure_language_code: 'EN01SP01', is_active: true, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z' },
    { id: bscaUuid(1256), product_plan_year_id: BSCA_IDS.ppyImapd2026, member_language_code: 'CH04', routing_type: 'bilingual', chapter_label_language: 'EN01SP01', enclosure_language_code: 'EN01SP01', is_active: true, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z' },
    { id: bscaUuid(1257), product_plan_year_id: BSCA_IDS.ppyImapd2026, member_language_code: 'FA01', routing_type: 'bilingual', chapter_label_language: 'EN01SP01', enclosure_language_code: 'EN01SP01', is_active: true, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z' },
    { id: bscaUuid(1258), product_plan_year_id: BSCA_IDS.ppyImapd2026, member_language_code: 'RU01', routing_type: 'bilingual', chapter_label_language: 'EN01SP01', enclosure_language_code: 'EN01SP01', is_active: true, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z' },
    { id: bscaUuid(1259), product_plan_year_id: BSCA_IDS.ppyImapd2026, member_language_code: 'TG01', routing_type: 'bilingual', chapter_label_language: 'EN01SP01', enclosure_language_code: 'EN01SP01', is_active: true, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z' },
    { id: bscaUuid(1260), product_plan_year_id: BSCA_IDS.ppyImapd2026, member_language_code: 'KH01', routing_type: 'bilingual', chapter_label_language: 'EN01SP01', enclosure_language_code: 'EN01SP01', is_active: true, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z' },
  ],
  provider_spatial_index: () => [
    {
      id: bscaUuid(1182),
      pipeline_run_id: BSCA_IDS.pipelineRun,
      tenant_id: BSCA_IDS.tenant,
      directory_id: BSCA_IDS.directoryMain,
      provider_count: 100,
      build_time_ms: 48,
      index_checksum: 'sha256:spatial-idx-20260404',
      status: 'active',
      activated_at: '2026-04-04T10:20:00Z',
      index_storage_path: '\\\\odsbscastoragedev\\indexes\\bsca\\imapd2026.kdt',
    },
  ],
  rule_execution_log: () => [
    {
      id: bscaUuid(1183),
      tenant_id: BSCA_IDS.tenant,
      directory_id: BSCA_IDS.directoryMain,
      rule_id: bscaUuid(1121),
      chapter_id: BSCA_IDS.chapterMPCP,
      request_id: bscaUuid(1184),
      request_type: 'radius',
      request_latitude: 34.05,
      request_longitude: -118.25,
      candidates_found: 120,
      filter_passed: 80,
      providers_returned: 50,
      spatial_query_ms: 12.5,
      filter_eval_ms: 4.2,
      total_ms: 18.1,
      spatial_index_id: bscaUuid(1182),
    },
  ],
  rule_change_history: () => [
    {
      id: bscaUuid(1185),
      rule_id: bscaUuid(1121),
      change_type: 'UPDATE',
      changed_by: bscaUuid(1),
      before_state: { max_distance_miles: 25 },
      after_state: { max_distance_miles: 30 },
      change_reason: 'PY2026 network expansion',
    },
  ],
  enrollment_period_ref: () => [
    {
      id: BSCA_IDS.enrollmentAep,
      code: 'AEP',
      name: 'Annual Election Period',
      typical_start_month: 10,
      typical_start_day: 15,
      regulatory_citation: 'CMS',
      is_active: true,
    },
  ],
  plan_year: () => [
    {
      id: BSCA_IDS.planYear2025,
      tenant_id: BSCA_IDS.tenant,
      year: 2025,
      status: 'archived',
      effective_date: '2025-01-01',
      expiry_date: '2025-12-31',
      directory_date: '2025-01-01',
      cloned_from_id: null,
      config: {},
      activated_at: '2024-11-01T00:00:00Z',
      frozen_at: '2025-12-31T23:59:59Z',
      archived_at: '2026-01-15T00:00:00Z',
    },
    {
      id: BSCA_IDS.planYear2026,
      tenant_id: BSCA_IDS.tenant,
      year: 2026,
      status: 'active',
      effective_date: '2026-01-01',
      expiry_date: '2026-12-31',
      directory_date: '2026-01-01',
      cloned_from_id: BSCA_IDS.planYear2025,
      config: { aep_lock: false },
      activated_at: '2026-01-01T00:00:00Z',
      frozen_at: null,
      archived_at: null,
    },
  ],
  aep_window: () => [
    {
      id: bscaUuid(841),
      tenant_id: BSCA_IDS.tenant,
      plan_year_id: BSCA_IDS.planYear2026,
      phase: 'aep',
      start_date: '2025-10-15',
      end_date: '2025-12-07',
      description: 'AEP 2026 — BSCA directory freeze coordination',
      config: { marketing_suppressed: false },
      is_active: true,
    },
  ],
  product_plan_year: () => {
    const ppy = (uuid, prodId, desc) => ({
      id: bscaUuid(uuid), product_id: prodId,
      plan_year_id: BSCA_IDS.planYear2026, effective_date: '2026-01-01',
    });
    return [
      { id: BSCA_IDS.ppyImapd2026,   product_id: BSCA_IDS.productImapd,    plan_year_id: BSCA_IDS.planYear2026, effective_date: '2026-01-01' },
      { id: bscaUuid(21),             product_id: BSCA_IDS.productImapdPpo, plan_year_id: BSCA_IDS.planYear2026, effective_date: '2026-01-01' },
      { id: bscaUuid(22),             product_id: BSCA_IDS.productDimapd,   plan_year_id: BSCA_IDS.planYear2026, effective_date: '2026-01-01' },
      { id: bscaUuid(23),             product_id: BSCA_IDS.productGmapd,    plan_year_id: BSCA_IDS.planYear2026, effective_date: '2026-01-01' },
      { id: bscaUuid(24),             product_id: BSCA_IDS.productDualsLa,  plan_year_id: BSCA_IDS.planYear2026, effective_date: '2026-01-01' },
      { id: bscaUuid(25),             product_id: BSCA_IDS.productDualsSd,  plan_year_id: BSCA_IDS.planYear2026, effective_date: '2026-01-01' },
      { id: bscaUuid(26),             product_id: BSCA_IDS.productMdCalLa,  plan_year_id: BSCA_IDS.planYear2026, effective_date: '2026-01-01' },
      { id: bscaUuid(27),             product_id: BSCA_IDS.productMdCalSd,  plan_year_id: BSCA_IDS.planYear2026, effective_date: '2026-01-01' },
      { id: bscaUuid(28),             product_id: BSCA_IDS.productAccu,     plan_year_id: BSCA_IDS.planYear2026, effective_date: '2026-01-01' },
      { id: bscaUuid(29),             product_id: BSCA_IDS.productVision,   plan_year_id: BSCA_IDS.planYear2026, effective_date: '2026-01-01' },
    ];
  },
  plan_year_change_history: () => [
    {
      id: bscaUuid(842),
      plan_year_id: BSCA_IDS.planYear2026,
      change_type: 'clone_forward',
      before_state: null,
      after_state: { from: 2025, to: 2026 },
      changed_by: bscaUuid(1),
      change_reason: 'Annual plan year rollover',
    },
  ],
  api_client: () => [
    {
      id: BSCA_IDS.apiClient,
      tenant_id: BSCA_IDS.tenant,
      client_id: 'bsca-directory-api-consumer-01',
      client_secret_hash: 'argon2:…',
      name: 'BSCA member portal (dev)',
      scopes: ['directory:read'],
      allowed_plan_years: [2025, 2026],
      rate_limit_per_minute: 600,
      is_active: true,
    },
  ],
  output_response_template: () => [
    {
      id: bscaUuid(1162),
      tenant_id: BSCA_IDS.tenant,
      directory_id: BSCA_IDS.directoryMain,
      name: 'TNO JSON v2',
      query_type: 'radius',
      template: { composition: 'TNO', fields: ['npi', 'name', 'address'] },
      format: 'json',
      is_active: true,
    },
  ],
  api_request_log: () => [
    {
      id: bscaUuid(1163),
      request_id: bscaUuid(1164),
      client_id: BSCA_IDS.apiClient,
      tenant_id: BSCA_IDS.tenant,
      http_method: 'POST',
      endpoint: '/api/v1/directory/query',
      query_type: 'radius',
      request_body: { lat: 34.05, lon: -118.25, miles: 30 },
      response_status: 200,
      response_body: { providers: 50 },
      providers_returned: 50,
      processing_time_ms: 42,
      is_pii_involved: true,
    },
  ],
  idempotency_cache: () => [
    {
      id: bscaUuid(1165),
      idempotency_key: bscaUuid(1166),
      client_id: BSCA_IDS.apiClient,
      request_fingerprint: 'sha256:req-fp-1',
      response_status: 200,
      response_body: { replay: true },
      expires_at: '2026-04-05T10:00:00Z',
    },
  ],
  rate_limit_counter: () => [
    {
      id: bscaUuid(1167),
      client_id: BSCA_IDS.apiClient,
      window_start: '2026-04-04T10:00:00Z',
      window_type: 'minute',
      request_count: 42,
    },
  ],
  file_source: () => [
    { id: BSCA_IDS.fileSource,  tenant_id: BSCA_IDS.tenant, product_id: BSCA_IDS.productImapd,    source_type: 'unc_share', name: 'BSCA IMAPDHMO drop',   file_format_id: bscaUuid(4001), config: { unc_root: BSCA_PATHS.uncDropRoot, notes: 'RdIMAPDHMORaw' },     file_pattern: 'IMAPD*HMO*.txt',  expected_column_count: 386 },
    { id: bscaUuid(71),         tenant_id: BSCA_IDS.tenant, product_id: BSCA_IDS.productImapdPpo, source_type: 'unc_share', name: 'BSCA IMAPDPPO drop',   file_format_id: bscaUuid(4001), config: { unc_root: BSCA_PATHS.uncDropRoot, notes: 'RdIMAPDPPORaw' },     file_pattern: 'IMAPD*PPO*.txt',  expected_column_count: 386 },
    { id: bscaUuid(72),         tenant_id: BSCA_IDS.tenant, product_id: BSCA_IDS.productDimapd,   source_type: 'unc_share', name: 'BSCA DIMAPDHMO drop',  file_format_id: bscaUuid(4001), config: { unc_root: BSCA_PATHS.uncDropRoot, notes: 'RdDIMAPDHMORaw' },    file_pattern: 'DIMAPD*.txt',     expected_column_count: 386 },
    { id: bscaUuid(73),         tenant_id: BSCA_IDS.tenant, product_id: BSCA_IDS.productGmapd,    source_type: 'unc_share', name: 'BSCA GMAPDPPO drop',   file_format_id: bscaUuid(4001), config: { unc_root: BSCA_PATHS.uncDropRoot, notes: 'RdGMAPDPPORaw' },     file_pattern: 'GMAPD*.txt',      expected_column_count: 386 },
    { id: bscaUuid(74),         tenant_id: BSCA_IDS.tenant, product_id: BSCA_IDS.productDualsLa,  source_type: 'unc_share', name: 'BSCA Duals LA drop',   file_format_id: bscaUuid(4001), config: { unc_root: BSCA_PATHS.uncDropRoot, notes: 'RdDualsLARaw' },      file_pattern: 'Duals*LA*.txt',   expected_column_count: 386 },
    { id: bscaUuid(75),         tenant_id: BSCA_IDS.tenant, product_id: BSCA_IDS.productDualsSd,  source_type: 'unc_share', name: 'BSCA Duals SD drop',   file_format_id: bscaUuid(4001), config: { unc_root: BSCA_PATHS.uncDropRoot, notes: 'RdDualsSDRaw' },      file_pattern: 'Duals*SD*.txt',   expected_column_count: 386 },
    { id: bscaUuid(76),         tenant_id: BSCA_IDS.tenant, product_id: BSCA_IDS.productMdCalLa,  source_type: 'unc_share', name: 'BSCA MdCal LA drop',   file_format_id: bscaUuid(4001), config: { unc_root: BSCA_PATHS.uncDropRoot, notes: 'RdMdCalLARaw' },      file_pattern: 'MdCal*LA*.txt',   expected_column_count: 386 },
    { id: bscaUuid(77),         tenant_id: BSCA_IDS.tenant, product_id: BSCA_IDS.productMdCalSd,  source_type: 'unc_share', name: 'BSCA MdCal SD drop',   file_format_id: bscaUuid(4001), config: { unc_root: BSCA_PATHS.uncDropRoot, notes: 'RdMdCalSDRaw' },      file_pattern: 'MdCal*SD*.txt',   expected_column_count: 386 },
    { id: bscaUuid(78),         tenant_id: BSCA_IDS.tenant, product_id: BSCA_IDS.productAccu,     source_type: 'unc_share', name: 'BSCA ACCU drop',       file_format_id: bscaUuid(4001), config: { unc_root: BSCA_PATHS.uncDropRoot, notes: 'RdACCURaw' },         file_pattern: 'ACCU*.txt',       expected_column_count: 386 },
    { id: bscaUuid(79),         tenant_id: BSCA_IDS.tenant, product_id: BSCA_IDS.productVision,   source_type: 'unc_share', name: 'BSCA Vision drop',     file_format_id: bscaUuid(4001), config: { unc_root: BSCA_PATHS.uncDropRoot, notes: 'RdVisionRaw' },       file_pattern: 'Vision*.txt',     expected_column_count: 386 },
  ],
  file_import: () => [
    {
      id: BSCA_IDS.fileImport,
      tenant_id: BSCA_IDS.tenant,
      file_source_id: BSCA_IDS.fileSource,
      original_filename: 'IMAPDHMOFullDirectory_20260404.txt',
      stored_path: `${BSCA_PATHS.appStaging}IMAPDHMOFullDirectory_20260404_bsca101.txt`,
      file_hash_sha256: 'a1b2c3d4e5f6789012345678901234567890abcd1234567890abcd1234567890',
      file_size_bytes: 285000000,
      row_count: 100,
      column_count: 386,
      status: 'imported',
      imported_at: '2026-04-04T10:02:15Z',
    },
  ],
  file_fingerprint: () => [
    {
      id: bscaUuid(1071),
      tenant_id: BSCA_IDS.tenant,
      original_filename: 'IMAPDHMOFullDirectory_20260404.txt',
      file_size_bytes: 285000000,
      xxhash64: 'a1b2c3d4e5f67012',
      sha256: 'a'.repeat(64),
      content_xxhash64: '9f3e2a1b4c5d6e7f',
      content_sha256: 'b'.repeat(64),
      row_count_estimate: 100,
      base_name_pattern: 'IMAPDHMOFullDirectory_*.txt',
    },
  ],
  file_mask: () => [
    { id: bscaUuid(1072), file_source_id: BSCA_IDS.fileSource,  pattern: 'IMAPDHMOFullDirectory_{YYYYMMDD}.txt',  dedup_scope: 'lob_plan_year' },
    { id: bscaUuid(1073), file_source_id: bscaUuid(71),         pattern: 'IMAPDPPOFullDirectory_{YYYYMMDD}.txt',  dedup_scope: 'lob_plan_year' },
    { id: bscaUuid(1074), file_source_id: bscaUuid(72),         pattern: 'DIMAPDHMOFullDirectory_{YYYYMMDD}.txt', dedup_scope: 'lob_plan_year' },
    { id: bscaUuid(1075), file_source_id: bscaUuid(73),         pattern: 'GMAPDPPOFullDirectory_{YYYYMMDD}.txt',  dedup_scope: 'lob_plan_year' },
    { id: bscaUuid(1076), file_source_id: bscaUuid(74),         pattern: 'DualsLAFullDirectory_{YYYYMMDD}.txt',   dedup_scope: 'lob_plan_year' },
    { id: bscaUuid(1077), file_source_id: bscaUuid(75),         pattern: 'DualsSDFullDirectory_{YYYYMMDD}.txt',   dedup_scope: 'lob_plan_year' },
    { id: bscaUuid(1078), file_source_id: bscaUuid(76),         pattern: 'MdCalLAFullDirectory_{YYYYMMDD}.txt',   dedup_scope: 'lob_plan_year' },
    { id: bscaUuid(1079), file_source_id: bscaUuid(77),         pattern: 'MdCalSDFullDirectory_{YYYYMMDD}.txt',   dedup_scope: 'lob_plan_year' },
    { id: bscaUuid(1080), file_source_id: bscaUuid(78),         pattern: 'ACCUFullDirectory_{YYYYMMDD}.txt',      dedup_scope: 'lob_plan_year' },
    { id: bscaUuid(1081), file_source_id: bscaUuid(79),         pattern: 'VisionFullDirectory_{YYYYMMDD}.txt',    dedup_scope: 'lob_plan_year' },
  ],
  canonical_field: () => {
    const f = (uuid, name, display, type, group, ord, req = false, pii = false) => ({
      id: bscaUuid(uuid), field_name: name, display_name: display,
      data_type: type, field_group: group, ordinal: ord, is_required: req, is_pii: pii,
    });
    return [
      // ── Identity ──
      f(2001, 'provider_npi',        'Provider NPI',           'string',  'identity',  1,  true,  false),
      f(2002, 'site_npi',            'Site NPI',               'string',  'identity',  2,  false, false),
      f(2003, 'ncpdp',               'NCPDP Number',           'string',  'identity',  3,  false, false),
      f(2004, 'tax_id',              'Tax ID',                 'string',  'identity',  4,  false, true),
      f(2005, 'dea_number',          'DEA Number',             'string',  'identity',  5,  false, false),
      f(2006, 'license_number',      'License Number',         'string',  'identity',  6,  false, false),
      f(2007, 'license_state',       'License State',          'string',  'identity',  7,  false, false),
      f(2008, 'medicaid_id',         'Medicaid ID',            'string',  'identity',  8,  false, false),

      // ── Name ──
      f(2010, 'first_name',          'First Name',             'string',  'name',      10, true,  true),
      f(2011, 'middle_name',         'Middle Name',            'string',  'name',      11, false, true),
      f(2012, 'last_name',           'Last Name',              'string',  'name',      12, true,  true),
      f(2013, 'suffix',              'Name Suffix',            'string',  'name',      13, false, true),
      f(2014, 'credential',          'Credential',             'string',  'name',      14, false, false),
      f(2015, 'group_name',          'Group/Organization Name','string',  'name',      15, false, true),
      f(2016, 'doing_business_as',   'Doing Business As',      'string',  'name',      16, false, true),

      // ── Primary Address ──
      f(2020, 'site_address_1',      'Site Address Line 1',    'string',  'address',   20, true,  true),
      f(2021, 'site_address_2',      'Site Address Line 2',    'string',  'address',   21, false, true),
      f(2022, 'city',                'City',                   'string',  'address',   22, true,  false),
      f(2023, 'state',               'State',                  'string',  'address',   23, true,  false),
      f(2024, 'zip',                 'ZIP Code',               'string',  'address',   24, true,  false),
      f(2025, 'zip_plus_4',          'ZIP+4',                  'string',  'address',   25, false, false),
      f(2026, 'county',              'County',                 'string',  'address',   26, false, false),
      f(2027, 'county_fips_code',    'County FIPS Code',       'string',  'address',   27, false, false),
      f(2028, 'country',             'Country',                'string',  'address',   28, false, false),

      // ── Mailing Address ──
      f(2030, 'mail_address_1',      'Mailing Address Line 1', 'string',  'mail_address', 30, false, true),
      f(2031, 'mail_address_2',      'Mailing Address Line 2', 'string',  'mail_address', 31, false, true),
      f(2032, 'mail_city',           'Mailing City',           'string',  'mail_address', 32, false, false),
      f(2033, 'mail_state',          'Mailing State',          'string',  'mail_address', 33, false, false),
      f(2034, 'mail_zip',            'Mailing ZIP Code',       'string',  'mail_address', 34, false, false),

      // ── Contact ──
      f(2040, 'phone',               'Primary Phone',          'string',  'contact',   40, false, true),
      f(2041, 'phone_extension',     'Phone Extension',        'string',  'contact',   41, false, false),
      f(2042, 'fax',                 'Fax Number',             'string',  'contact',   42, false, true),
      f(2043, 'email',               'Email Address',          'string',  'contact',   43, false, true),
      f(2044, 'website',             'Website URL',            'string',  'contact',   44, false, false),
      f(2045, 'tty',                 'TTY Number',             'string',  'contact',   45, false, false),

      // ── Clinical / Practice ──
      f(2050, 'specialty_code',      'Specialty Code',         'string',  'clinical',  50, true,  false),
      f(2051, 'specialty_description','Specialty Description', 'string',  'clinical',  51, false, false),
      f(2052, 'taxonomy_code',       'Taxonomy Code',          'string',  'clinical',  52, false, false),
      f(2053, 'board_certified',     'Board Certified',        'boolean', 'clinical',  53, false, false),
      f(2054, 'accepting_new_patients','Accepting New Patients','boolean','clinical',  54, false, false),
      f(2055, 'provider_type',       'Provider Type',          'string',  'clinical',  55, false, false),
      f(2056, 'hospital_affiliation','Hospital Affiliation',   'string',  'clinical',  56, false, false),
      f(2057, 'group_affiliation_npi','Group Affiliation NPI', 'string',  'clinical',  57, false, false),

      // ── Demographics ──
      f(2060, 'gender',              'Gender',                 'string',  'demographics', 60, false, false),
      f(2061, 'languages',           'Languages Spoken',       'json',    'demographics', 61, false, false),
      f(2062, 'hours_of_operation',  'Office Hours',           'json',    'demographics', 62, false, false),
      f(2063, 'handicap_accessible', 'Handicap Accessible',   'boolean', 'demographics', 63, false, false),
      f(2064, 'telehealth',          'Telehealth Available',   'boolean', 'demographics', 64, false, false),

      // ── Network ──
      f(2070, 'network_id',          'Network ID',             'string',  'network',   70, false, false),
      f(2071, 'network_code',        'Network Code',           'string',  'network',   71, false, false),
      f(2072, 'network_name',        'Network Name',           'string',  'network',   72, false, false),
      f(2073, 'product_type',        'Product Type',           'string',  'network',   73, false, false),
      f(2074, 'plan_name',           'Plan Name',              'string',  'network',   74, false, false),
      f(2075, 'effective_date',      'Network Effective Date', 'date',    'network',   75, false, false),
      f(2076, 'termination_date',    'Network Termination Date','date',   'network',   76, false, false),
      f(2077, 'tier',                'Network Tier',           'string',  'network',   77, false, false),

      // ── Accessibility / ECM ──
      f(2080, 'accessibility_codes', 'Accessibility Codes',    'string',  'accessibility', 80, false, false),
      f(2081, 'ecm_indicators',      'ECM Indicators',         'json',    'accessibility', 81, false, false),
      f(2082, 'cultural_competency', 'Cultural Competency',    'string',  'accessibility', 82, false, false),

      // ── Geographic / Geocode ──
      f(2090, 'latitude',            'Latitude',               'decimal', 'geocode',   90, false, false),
      f(2091, 'longitude',           'Longitude',              'decimal', 'geocode',   91, false, false),
      f(2092, 'geocode_accuracy',    'Geocode Accuracy',       'string',  'geocode',   92, false, false),

      // ── CASS ──
      f(2095, 'cass_status',         'CASS Status',            'string',  'cass',      95, false, false),
      f(2096, 'dpv_code',            'DPV Code',               'string',  'cass',      96, false, false),
      f(2097, 'dpv_footnotes',       'DPV Footnotes',          'string',  'cass',      97, false, false),
      f(2098, 'cass_timestamp',      'CASS Processed At',      'datetime','cass',      98, false, false),

      // ── Metadata ──
      f(2100, 'record_id',           'Record ID',              'string',  'metadata',  100, true,  false),
      f(2101, 'tenant_code',         'Tenant Code',            'string',  'metadata',  101, true,  false),
      f(2102, 'refresh_id',          'Refresh ID',             'string',  'metadata',  102, true,  false),
      f(2103, 'source_row_number',   'Source Row Number',      'integer', 'metadata',  103, true,  false),
      f(2104, 'source_file_id',      'Source File ID',         'string',  'metadata',  104, false, false),
      f(2105, 'created_at',          'Created At',             'datetime','metadata',  105, false, false),
      f(2106, 'updated_at',          'Updated At',             'datetime','metadata',  106, false, false),
    ];
  },
  source_field_mapping: () => [
    {
      id: bscaUuid(701),
      tenant_id: BSCA_IDS.tenant,
      file_source_id: BSCA_IDS.fileSource,
      canonical_field_name: 'provider_npi',
      source_column_name: 'PROV_NPI',
      source_column_index: 1,
      mapping_type: 'direct',
      consolidation_config: null,
      derivation_expression: null,
      default_value: null,
      data_type_hint: 'string',
    },
    {
      id: bscaUuid(702),
      tenant_id: BSCA_IDS.tenant,
      file_source_id: BSCA_IDS.fileSource,
      canonical_field_name: 'site_addr1',
      source_column_name: 'SITE_ADDR1',
      source_column_index: 42,
      mapping_type: 'direct',
      consolidation_config: null,
      derivation_expression: null,
      default_value: null,
      data_type_hint: 'string',
    },
  ],
  cass_config: () => [
    {
      id: BSCA_IDS.cassConfig,
      tenant_id: BSCA_IDS.tenant,
      name: 'BSCA production CASS',
      record_type: 'practice_site',
      bcc_sdk_mode: 'async_batch',
      batch_size: 100,
      cache_enabled: true,
      cache_ttl_days: 90,
      circuit_breaker_config: { failure_threshold: 5, window_sec: 60 },
      is_active: true,
    },
  ],
  // All 107 real BCC CASS error codes from dbo.CASS_Error_Codes
  cass_error_code: () =>
    BSCA_CASS_ERRORS.map((e, i) => ({
      id: bscaUuid(3000 + i),
      code: e.code,
      source_system: 'BCC',
      category: e.status === 'Bad Address' ? 'bad_address' : e.status === 'Questionable Address' ? 'questionable_address' : 'success',
      severity: e.status === 'Bad Address' ? 'error' : 'warning',
      description: e.description,
      is_geocodable: e.status !== 'Bad Address',
      is_active: true,
    })),
  circuit_breaker_state: () => [
    {
      id: bscaUuid(1031),
      tenant_id: BSCA_IDS.tenant,
      service_name: 'bcc_geocode',
      state: 'closed',
      failure_count: 0,
      last_failure_at: null,
      opened_at: null,
      next_probe_at: null,
    },
  ],
  service_call_log: () => [
    {
      id: bscaUuid(1041),
      pipeline_run_id: BSCA_IDS.pipelineRun,
      service_name: 'bcc_geocode',
      request_method: 'POST',
      batch_id: BSCA_IDS.cassBatch,
      record_count: 100,
      response_time_ms: 1200,
      error_message: null,
    },
  ],
  audit_event: () => [
    {
      id: bscaUuid(1001),
      event_type: 'intake.file_accepted',
      entity_type: 'intake_job',
      entity_id: BSCA_IDS.intakeJob,
      tenant_id: BSCA_IDS.tenant,
      pipeline_run_id: BSCA_IDS.pipelineRun,
      station_type: 'FILE_BRIDGE',
      before_state: null,
      after_state: { status: 'PARSED' },
      is_pii_involved: false,
      compliance_tags: ['HIPAA_MINIMAL'],
      created_at: '2026-04-04T10:02:10Z',
    },
  ],
  pipeline_lock: () => [
    {
      id: bscaUuid(1201),
      tenant_id: BSCA_IDS.tenant,
      product_plan_year_id: BSCA_IDS.ppyImapd2026,
      lock_scope: 'pipeline',
      pipeline_run_id: BSCA_IDS.pipelineRun,
      acquired_by: 'refresh-worker-bsca-1',
      acquired_at: '2026-04-04T10:00:00Z',
      expires_at: '2026-04-04T14:00:00Z',
      last_heartbeat: '2026-04-04T10:09:00Z',
      heartbeat_interval_sec: 60,
      is_released: false,
      released_at: null,
      release_reason: null,
    },
  ],
  cleansing_pipeline: () => [
    {
      id: BSCA_IDS.cleansingPipeline,
      tenant_id: BSCA_IDS.tenant,
      name: 'BSCA Provider Directory Cleansing Pipeline',
      version: 3,
      pipeline_config: {
        description: 'Canonical provider cleansing: names → addresses → phones → codes → validation',
        execution_mode: 'sequential',
        stop_on_error: false,
        dlq_enabled: true,
      },
      is_active: true,
    },
  ],
  cleansing_rule: () => {
    const cr = (uuid, field, udfSeed, ord, params = {}) => ({
      id: bscaUuid(uuid), pipeline_id: BSCA_IDS.cleansingPipeline,
      udf_function_id: bscaUuid(udfSeed), target_field: field,
      ordinal: ord, parameters: params, is_active: true,
    });
    return [
      // ── Phase 1: Name cleansing ──
      cr(801, 'first_name',           90, 1),                    // TRIM
      cr(802, 'last_name',            90, 2),                    // TRIM
      cr(803, 'middle_name',          90, 3),                    // TRIM
      cr(804, 'group_name',           90, 4),                    // TRIM
      cr(805, 'first_name',           93, 5),                    // PROPER_CASE
      cr(806, 'last_name',            93, 6),                    // PROPER_CASE
      cr(807, 'group_name',           93, 7),                    // PROPER_CASE
      cr(808, 'credential',           91, 8),                    // UPPER
      cr(809, 'group_name',           94, 9, { acronyms: ['CVS','LLC','FQHC','MD','DO','DDS','NP','PA','INC','DBA'] }), // CAPITALIZE_ACRONYMS

      // ── Phase 2: Address cleansing ──
      cr(810, 'site_address_1',       90, 10),                   // TRIM
      cr(811, 'site_address_2',       90, 11),                   // TRIM
      cr(812, 'city',                 90, 12),                   // TRIM
      cr(813, 'site_address_1',       104, 13),                  // ADDRESS_STANDARDIZE
      cr(814, 'city',                 93, 14),                   // PROPER_CASE
      cr(815, 'state',                102, 15, { default: 'CA' }), // STATE_NORMALIZE
      cr(816, 'zip',                  103, 16, { length: 5 }),   // ZIP_FORMAT

      // ── Phase 3: Contact cleansing ──
      cr(820, 'phone',                105, 20),                  // GET_NUMERIC
      cr(821, 'phone',                101, 21),                  // PHONE_FORMAT
      cr(822, 'fax',                  105, 22),                  // GET_NUMERIC
      cr(823, 'fax',                  101, 23),                  // PHONE_FORMAT

      // ── Phase 4: Code normalization ──
      cr(830, 'provider_npi',         108, 30, { expectedLength: 10, padWithZeros: true }), // NPI_VALIDATE
      cr(831, 'gender',               109, 31),                  // GENDER_NORMALIZE
      cr(832, 'languages',            107, 32, { delimiter: ',' }), // DISTINCT_LIST
      cr(833, 'languages',            113, 33, { mapping: { SPA: 'Spanish', VIE: 'Vietnamese', CHI: 'Chinese', KOR: 'Korean', RUS: 'Russian', ARM: 'Armenian', ARA: 'Arabic', FAR: 'Farsi', KHM: 'Khmer', TAG: 'Tagalog' } }), // LANGUAGE_NORMALIZE

      // ── Phase 5: Smart quotes & misc ──
      cr(840, 'first_name',           106, 40),                  // SMART_QUOTE_REPLACE
      cr(841, 'last_name',            106, 41),                  // SMART_QUOTE_REPLACE
      cr(842, 'site_address_1',       106, 42),                  // SMART_QUOTE_REPLACE
    ];
  },
  // Real UDF function library (28+ built-in functions used by cleansing pipeline)
  udf_function: () => {
    const u = (seed, name, cat, desc, params, opts = {}) => ({
      id: bscaUuid(seed), name, category: cat, description: desc,
      parameters_schema: params,
      input_type: opts.inputType || 'string',
      output_type: opts.outputType || 'string',
      is_deterministic: opts.deterministic !== false,
      is_builtin: true,
      python_implementation: `def ${name.toLowerCase()}(value, **kw): ...`,
      javascript_implementation: `function ${name.toLowerCase()}(value, params) { ... }`,
      examples: opts.examples || [{ input: opts.exIn || 'hello', params: {}, expected: opts.exOut || 'hello' }],
    });
    return [
      u(90, 'TRIM', 'string', 'Remove leading/trailing whitespace. Legacy: LTRIM(RTRIM(ISNULL(col,"")))', {}, { exIn: '  Smith  ', exOut: 'Smith' }),
      u(91, 'UPPER', 'string', 'Convert to UPPERCASE. Legacy: UPPER(PROV_LNAME)', {}, { exIn: 'smith', exOut: 'SMITH' }),
      u(92, 'LOWER', 'string', 'Convert to lowercase', {}, { exIn: 'SMITH', exOut: 'smith' }),
      u(93, 'PROPER_CASE', 'string', 'Title case with hyphen/apostrophe handling (O\'Brien, Smith-Jones)', {}, { exIn: 'JOHN O\'BRIEN', exOut: 'John O\'Brien' }),
      u(94, 'CAPITALIZE_ACRONYMS', 'string', 'Preserve known acronyms after ProperCase — CVS, LLC, FQHC, MD, DO, DDS, NP, PA', { acronyms: { type: 'array', default: ['CVS','LLC','FQHC','MD','DO','DDS','NP','PA'] } }, { exIn: 'cvs health llc', exOut: 'CVS health LLC' }),
      u(95, 'REPLACE', 'string', 'Replace all occurrences of a substring', { find: { type: 'string' }, replacement: { type: 'string' } }),
      u(96, 'LEFT', 'string', 'Extract first N characters', { count: { type: 'integer', default: 5 } }, { exIn: 'ABCDEFGH', exOut: 'ABCDE' }),
      u(97, 'RIGHT', 'string', 'Extract last N characters', { count: { type: 'integer', default: 4 } }, { exIn: 'ABCDEFGH', exOut: 'EFGH' }),
      u(98, 'CONCAT', 'string', 'Concatenate with suffix', { suffix: { type: 'string' } }),
      u(99, 'ISNULL', 'string', 'Return default if value is empty/null. Legacy: CASE WHEN col="" THEN "CA"', { default: { type: 'string' } }, { exIn: '', exOut: 'CA' }),
      u(100, 'LEN', 'string', 'Return string length as number', {}, { outputType: 'integer', exIn: 'Hello', exOut: '5' }),
      u(101, 'PHONE_FORMAT', 'formatting', 'Strip non-digits, format as (XXX) XXX-XXXX. Replaces legacy dbo.fn_FormatPhone SQL function', { format: { type: 'string', default: '(###) ###-####' } }, { exIn: '2135551234', exOut: '(213) 555-1234' }),
      u(102, 'STATE_NORMALIZE', 'formatting', 'UPPER if <=2 chars. Legacy: CASE WHEN SITE_STATE="" THEN "CA" ELSE UPPER(SITE_STATE)', {}, { exIn: 'ca', exOut: 'CA' }),
      u(103, 'ZIP_FORMAT', 'formatting', 'Extract first 5 digits, pad with zeros if needed', { length: { type: 'integer', default: 5 } }, { exIn: '90012-1234', exOut: '90012' }),
      u(104, 'ADDRESS_STANDARDIZE', 'formatting', 'ProperCase with directional preservation (NE, NW, SE, SW). Legacy: UPPER(SITE_ADDR1)', { directionals: { type: 'array', default: ['NE','NW','SE','SW','N','S','E','W'] } }, { exIn: '123 nw main st', exOut: '123 NW Main St' }),
      u(105, 'GET_NUMERIC', 'formatting', 'Strip all non-numeric characters — preprocessing step before PHONE_FORMAT', {}, { exIn: '(213) 555-1234', exOut: '2135551234' }),
      u(106, 'SMART_QUOTE_REPLACE', 'string', 'Replace curly/smart quotes with straight ASCII quotes', {}),
      u(107, 'DISTINCT_LIST', 'list', 'Deduplicate comma-delimited list', { delimiter: { type: 'string', default: ',' } }, { exIn: 'Spanish,English,Spanish', exOut: 'Spanish,English' }),
      u(108, 'NPI_VALIDATE', 'validation', '10-digit Luhn (Mod-10) check with 80840 prefix. Pad with leading zeros if short. Legacy: LEN(NPI)=10 AND ISNUMERIC(NPI)=1', { expectedLength: { type: 'integer', default: 10 }, padWithZeros: { type: 'boolean', default: true }, nullifyInvalid: { type: 'boolean', default: false } }, { exIn: '123', exOut: '0000000123' }),
      u(109, 'GENDER_NORMALIZE', 'validation', 'Normalize gender to M/F/U, nullify N/A values', { nullValues: { type: 'array', default: ['N/A','NA','UNKNOWN',''] } }, { exIn: 'Male', exOut: 'M' }),
      u(110, 'CAST_INT', 'conversion', 'Safe integer conversion — returns null on failure', {}, { inputType: 'string', outputType: 'integer', exIn: '42', exOut: '42' }),
      u(111, 'CAST_FLOAT', 'conversion', 'Safe float conversion with configurable precision', { precision: { type: 'integer', default: 2 } }, { inputType: 'string', outputType: 'decimal', exIn: '34.123456', exOut: '34.12' }),
      u(112, 'LANGUAGE_MAP', 'lookup', 'Map language codes to recognized standard names', { recognized: { type: 'array', default: ['ENGLISH','SPANISH','CHINESE','VIETNAMESE'] }, default: { type: 'string', default: 'OTHER' } }),
      u(113, 'LANGUAGE_NORMALIZE', 'lookup', 'Map short codes to full language names — SPA→Spanish, VIE→Vietnamese', { mapping: { type: 'object' } }, { exIn: 'SPA', exOut: 'Spanish' }),
      u(114, 'CASS_ERROR_MAP', 'lookup', 'Map BCC CASS error codes to severity levels — used post-CASS', { errorPrefix: { type: 'string', default: 'E' }, codeMap: { type: 'object' } }),
      u(115, 'GEOCODE_FROM_ZIP', 'special', 'Lookup lat/lon from ZIP code via geocode_fallback_ref table', { zipField: { type: 'string', default: 'zip' }, onlyWhenNull: { type: 'boolean', default: true } }, { deterministic: false }),
      u(116, 'BACKUP_ORIGINAL', 'special', 'Create a backup copy of field value before transformation (e.g., original_address_1)', { targetPrefix: { type: 'string', default: 'original_' } }),
      u(117, 'NOOP', 'control', 'No operation — pass value through unchanged. Used as placeholder in pipeline design', {}),
      u(118, 'SPLIT', 'list', 'Extract Nth element from delimited string', { delimiter: { type: 'string', default: ',' }, index: { type: 'integer', default: 0 } }, { exIn: 'A,B,C', exOut: 'A' }),
    ];
  },
  quality_rule: () => [
    {
      id: bscaUuid(821),
      tenant_id: BSCA_IDS.tenant,
      name: 'BSCA IMAPDHMO PROV_NPI null rate',
      rule_type: 'batch',
      rule_expression: { field: 'PROV_NPI', op: 'null_pct_max', value: 5 },
      severity: 'error',
      is_stopper: true,
      threshold: 5.0,
    },
  ],
  quality_result: () => [
    {
      id: bscaUuid(980),
      run_id: BSCA_IDS.pipelineRun,
      quality_rule_id: bscaUuid(821),
      passed: true,
      actual_value: 0.8,
      threshold: 5.0,
      affected_records: 0,
    },
  ],
  quality_score: () => [
    {
      id: bscaUuid(981),
      run_id: BSCA_IDS.pipelineRun,
      overall_score: 97.5,
      completeness_score: 96.0,
      rules_passed: 12,
      rules_failed: 0,
    },
  ],
  recon_result: () => [
    {
      id: bscaUuid(991),
      run_id: BSCA_IDS.pipelineRun,
      comparison_type: 'count_match',
      from_station: 'INGESTION',
      to_station: 'CLEANSING',
      passed: true,
      details: { from_count: 100, to_count: 100 },
    },
  ],
  recon_rule: () => [
    {
      id: bscaUuid(992),
      tenant_id: BSCA_IDS.tenant,
      name: 'ingest_to_cleanse_rowcount',
      rule_expression: { op: 'eq', left: 'staging_count', right: 'ingest_valid_count' },
      is_active: true,
    },
  ],
  output_config: () => [
    {
      id: bscaUuid(1161),
      tenant_id: BSCA_IDS.tenant,
      output_type: 'precomp',
      delivery_method: 'sftp',
      csv_include_header: true,
      include_enclosures: true,
      include_footers: true,
      footer_default_text: 'Blue Shield of California is an independent member of the Blue Shield Association.',
      footer_hospital_text: 'For hospital quality information, visit www.calhospitalcompare.org.',
      config: { composition: 'BSCA TNO', encoding: 'utf-8', delimiter: '|', sftp_path: '/bsca/precomp/' },
    },
    {
      id: bscaUuid(1162),
      tenant_id: BSCA_IDS.tenant,
      output_type: 'api',
      delivery_method: 'api',
      csv_include_header: false,
      include_enclosures: true,
      include_footers: true,
      footer_default_text: 'Blue Shield of California is an independent member of the Blue Shield Association.',
      footer_hospital_text: 'For hospital quality information, visit www.calhospitalcompare.org.',
      config: { base_url: '/api/v1/bsca', rate_limit_per_minute: 60, cache_ttl_seconds: 3600 },
    },
  ],
  component_template: () => [
    {
      id: bscaUuid(1171),
      name: 'deduplication_v2',
      component_type: 'deduplication',
      component_role: 'processor',
      default_config: { phase1: 'name', phase2: 'hash' },
    },
  ],
  supported_file_format: () => {
    const ff = (uuid, code, name, mime, delim, parser, enc, streaming, cfg = {}) => ({
      id: bscaUuid(uuid), format_code: code, name, mime_type: mime, delimiter: delim,
      parser_class: parser, default_encoding: enc, supports_streaming: streaming,
      default_config: cfg, is_active: true,
    });
    return [
      ff(4001, 'CSV_PIPE',     'Pipe-Delimited CSV',    'text/csv',                       '|',  'CsvStreamParser',       'UTF-8',        true,  { quote_char: '"', escape_char: '\\' }),
      ff(4002, 'CSV_COMMA',    'Comma-Delimited CSV',   'text/csv',                       ',',  'CsvStreamParser',       'UTF-8',        true,  { quote_char: '"', escape_char: '\\' }),
      ff(4003, 'CSV_TAB',      'Tab-Delimited CSV',     'text/tab-separated-values',      '\t', 'CsvStreamParser',       'UTF-8',        true,  { quote_char: '"' }),
      ff(4004, 'EXCEL_XLSX',   'Excel Spreadsheet',     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, 'ExcelParser', 'UTF-8', false, { sheet_index: 0, header_row: 1 }),
      ff(4005, 'JSON',         'JSON Lines',            'application/json',                null, 'JsonStreamParser',      'UTF-8',        true,  { json_path: '$[*]' }),
      ff(4006, 'XML',          'XML Structured',        'application/xml',                 null, 'XmlParser',             'UTF-8',        false, { row_element: 'record' }),
      ff(4007, 'FIXED_WIDTH',  'Fixed-Width Columnar',  'text/plain',                      null, 'FixedWidthParser',      'Windows-1252', true,  { column_spec_required: true }),
    ];
  },
  tenant_config: () => [
    {
      id: bscaUuid(501),
      tenant_id: BSCA_IDS.tenant,
      config_key: 'intake.watcher.exclude_patterns',
      config_value: '["*.yaml","*.log"]',
      config_type: 'json',
    },
    {
      id: bscaUuid(502),
      tenant_id: BSCA_IDS.tenant,
      config_key: 'ingestion.null_profile.sample_rate',
      config_value: '0.05',
      config_type: 'string',
    },
    {
      id: bscaUuid(503),
      tenant_id: BSCA_IDS.tenant,
      config_key: 'output.default_language',
      config_value: 'EN01',
      config_type: 'string',
    },
  ],
  variable: () => [
    {
      id: bscaUuid(831),
      tenant_id: BSCA_IDS.tenant,
      scope: 'tenant',
      scope_id: BSCA_IDS.tenant,
      key: 'directory.brand',
      value: 'Blue Shield of California',
    },
  ],
  external_service_config: () => [
    {
      id: bscaUuid(851),
      tenant_id: BSCA_IDS.tenant,
      service_name: 'bcc_geocode',
      base_url: 'https://geocode.bcc.example/v1',
      auth_type: 'client_credentials',
      credentials_ref: 'secret/bsca/bcc/prod',
    },
  ],
  ingestion_field_threshold: () => [
    {
      id: bscaUuid(1081),
      tenant_id: BSCA_IDS.tenant,
      file_source_id: BSCA_IDS.fileSource,
      field_name: 'PROV_NPI',
      field_scope: 'canonical',
      max_null_pct: 5.0,
      severity: 'error',
      is_stopper: true,
      expected_null_reason: null,
    },
    {
      id: bscaUuid(1082),
      tenant_id: BSCA_IDS.tenant,
      file_source_id: BSCA_IDS.fileSource,
      field_name: 'SITE_NPI',
      field_scope: 'canonical',
      max_null_pct: 100.0,
      severity: 'info',
      is_stopper: false,
      expected_null_reason: 'BSCA does not supply site NPI for this LOB',
    },
  ],
  file_quarantine: () => [
    {
      id: bscaUuid(1075),
      file_name: 'IMAPDHMOFullDirectory_20260301_dup.txt',
      reason: 'duplicate_hash',
      status: 'quarantined',
      resolution: null,
      quarantined_at: '2026-03-01T09:00:00Z',
    },
  ],
  spatial_index: () => [
    {
      id: bscaUuid(1181),
      run_id: BSCA_IDS.pipelineRun,
      provider_count: 100,
      build_time_ms: 48,
      built_at: '2026-04-04T10:20:00Z',
    },
  ],
  schema_version: () => [
    {
      id: bscaUuid(1191),
      version: '2026.04.0',
      description: 'BSCA-aligned designTables + intake v2',
      applied_at: '2026-04-01T00:00:00Z',
      checksum: 'sha256:schema-mig-202604',
    },
  ],
  api_request_schema: () => [
    {
      id: bscaUuid(1192),
      tenant_id: BSCA_IDS.tenant,
      api_client_id: BSCA_IDS.apiClient,
      directory_id: BSCA_IDS.directoryMain,
      query_type: 'radius',
      name: 'radius_query_v2',
      version: 2,
      parameters: { required: ['lat', 'lon', 'miles'] },
      is_active: true,
    },
  ],
  api_access_token: () => [
    {
      id: bscaUuid(1193),
      client_id: BSCA_IDS.apiClient,
      token_hash: 'sha256:token…',
      scopes: ['directory:read'],
      issued_at: '2026-04-04T09:00:00Z',
      expires_at: '2026-04-04T15:00:00Z',
    },
  ],
  execution_log: () => [
    {
      id: bscaUuid(1011),
      run_id: BSCA_IDS.pipelineRun,
      total_duration_ms: null,
      total_records_processed: 100,
      outcome: 'partial',
      summary: { note: 'Run in progress — log finalized on completion' },
    },
  ],
  address_cache: () => [
    {
      id: bscaUuid(1021),
      tenant_id: BSCA_IDS.tenant,
      cache_key: 'sha256:addr-sample-1',
      input_address_normalized: '100 market st los angeles ca 90012',
      output_address: { dpv: 'Y', line1: '100 MARKET ST' },
      latitude: 34.0522,
      longitude: -118.2437,
      cass_status: 'MATCHED_VALID',
      hit_count: 42,
      expires_at: '2026-06-13T12:00:00Z',
    },
  ],

  // ── Admin / RBAC (schema: admin) ──
  app_user: () => [
    {
      id: BSCA_IDS.userJlynn,
      oidc_provider: 'azure_ad',
      oidc_subject: 'aad-sub-jlynn-001',
      oidc_issuer: 'https://login.microsoftonline.com/ods-tenant/v2.0',
      email: 'jlynn@oneilldigital.com',
      display_name: 'Jamie Lynn',
      first_name: 'Jamie',
      last_name: 'Lynn',
      avatar_url: null,
      is_active: true,
      last_login_at: '2026-04-04T08:15:00Z',
      login_count: 247,
      created_at: '2025-06-15T09:00:00Z',
      updated_at: '2026-04-04T08:15:00Z',
    },
    {
      id: BSCA_IDS.userAdmin,
      oidc_provider: 'azure_ad',
      oidc_subject: 'aad-sub-dcalvin-002',
      oidc_issuer: 'https://login.microsoftonline.com/ods-tenant/v2.0',
      email: 'dcalvin@oneilldigital.com',
      display_name: 'Danang Calvin',
      first_name: 'Danang',
      last_name: 'Calvin',
      avatar_url: null,
      is_active: true,
      last_login_at: '2026-04-04T09:30:00Z',
      login_count: 512,
      created_at: '2025-01-10T09:00:00Z',
      updated_at: '2026-04-04T09:30:00Z',
    },
    {
      id: BSCA_IDS.userAnalyst,
      oidc_provider: 'azure_ad',
      oidc_subject: 'aad-sub-msantos-003',
      oidc_issuer: 'https://login.microsoftonline.com/ods-tenant/v2.0',
      email: 'msantos@oneilldigital.com',
      display_name: 'Maria Santos',
      first_name: 'Maria',
      last_name: 'Santos',
      avatar_url: null,
      is_active: true,
      last_login_at: '2026-04-03T14:20:00Z',
      login_count: 89,
      created_at: '2025-09-01T09:00:00Z',
      updated_at: '2026-04-03T14:20:00Z',
    },
  ],
  role: () => [
    { id: BSCA_IDS.roleSuperAdmin, code: 'super_admin', name: 'Super Administrator', description: 'Full system access — all tenants, all permissions', is_system: true, rank: 100, created_at: '2025-01-01T00:00:00Z' },
    { id: BSCA_IDS.roleTenantAdmin, code: 'tenant_admin', name: 'Tenant Administrator', description: 'Full access within assigned tenants', is_system: true, rank: 80, created_at: '2025-01-01T00:00:00Z' },
    { id: BSCA_IDS.rolePipelineOps, code: 'pipeline_ops', name: 'Pipeline Operations', description: 'Run/retry pipelines, manage files, view all data', is_system: true, rank: 60, created_at: '2025-01-01T00:00:00Z' },
    { id: BSCA_IDS.roleRuleEditor, code: 'rule_editor', name: 'Rule Editor', description: 'Create/modify rules, chapters, books', is_system: true, rank: 50, created_at: '2025-01-01T00:00:00Z' },
    { id: BSCA_IDS.roleAnalyst, code: 'analyst', name: 'Data Analyst', description: 'View data, DQ scores, run tests', is_system: true, rank: 30, created_at: '2025-01-01T00:00:00Z' },
    { id: BSCA_IDS.roleViewer, code: 'viewer', name: 'Read-Only Viewer', description: 'View dashboards and pipeline status', is_system: true, rank: 10, created_at: '2025-01-01T00:00:00Z' },
    { id: BSCA_IDS.roleApiConsumer, code: 'api_consumer', name: 'API Consumer', description: 'Token-based API access only', is_system: true, rank: 5, created_at: '2025-01-01T00:00:00Z' },
  ],
  permission: () => [
    { id: bscaUuid(8100), code: 'pipeline.view', name: 'View pipeline status', category: 'PIPELINE', description: 'View pipeline runs, station status, and execution history', is_dangerous: false },
    { id: bscaUuid(8101), code: 'pipeline.trigger', name: 'Trigger pipeline run', category: 'PIPELINE', description: 'Start a new pipeline run for a tenant', is_dangerous: false },
    { id: bscaUuid(8102), code: 'pipeline.retry', name: 'Retry failed run', category: 'PIPELINE', description: 'Retry a failed pipeline run from checkpoint', is_dangerous: false },
    { id: bscaUuid(8103), code: 'pipeline.cancel', name: 'Cancel running pipeline', category: 'PIPELINE', description: 'Cancel a currently running pipeline', is_dangerous: false },
    { id: bscaUuid(8104), code: 'pipeline.configure', name: 'Configure pipeline DAG', category: 'PIPELINE', description: 'Modify pipeline station and component structure', is_dangerous: false },
    { id: bscaUuid(8110), code: 'rule.view', name: 'View rules', category: 'RULE', description: 'View rules, chapters, and directory structure', is_dangerous: false },
    { id: bscaUuid(8111), code: 'rule.create', name: 'Create rules', category: 'RULE', description: 'Create new directory rules', is_dangerous: false },
    { id: bscaUuid(8112), code: 'rule.edit', name: 'Edit rules', category: 'RULE', description: 'Modify existing rules', is_dangerous: false },
    { id: bscaUuid(8113), code: 'rule.delete', name: 'Delete rules', category: 'RULE', description: 'Delete rules — affects downstream books', is_dangerous: true },
    { id: bscaUuid(8120), code: 'data.view', name: 'View provider data', category: 'DATA', description: 'View provider records (PII masked)', is_dangerous: false },
    { id: bscaUuid(8121), code: 'data.pii_view', name: 'View PII (unmasked)', category: 'DATA', description: 'View provider PII fields without masking', is_dangerous: true },
    { id: bscaUuid(8130), code: 'admin.user_manage', name: 'Manage users', category: 'ADMIN', description: 'Create/edit users, assign roles, grant tenant access', is_dangerous: true },
    { id: bscaUuid(8131), code: 'admin.audit_view', name: 'View audit trail', category: 'ADMIN', description: 'View all audit events', is_dangerous: false },
    { id: bscaUuid(8132), code: 'config.view', name: 'View configuration', category: 'CONFIG', description: 'View tenant and pipeline configuration', is_dangerous: false },
    { id: bscaUuid(8133), code: 'config.edit', name: 'Edit configuration', category: 'CONFIG', description: 'Modify tenant and pipeline configuration', is_dangerous: false },
  ],
  role_permission: () => [
    // super_admin gets everything implicitly (checked in code)
    // pipeline_ops permissions
    { role_id: BSCA_IDS.rolePipelineOps, permission_id: bscaUuid(8100) },
    { role_id: BSCA_IDS.rolePipelineOps, permission_id: bscaUuid(8101) },
    { role_id: BSCA_IDS.rolePipelineOps, permission_id: bscaUuid(8102) },
    { role_id: BSCA_IDS.rolePipelineOps, permission_id: bscaUuid(8103) },
    { role_id: BSCA_IDS.rolePipelineOps, permission_id: bscaUuid(8110) },
    { role_id: BSCA_IDS.rolePipelineOps, permission_id: bscaUuid(8120) },
    // rule_editor permissions
    { role_id: BSCA_IDS.roleRuleEditor, permission_id: bscaUuid(8110) },
    { role_id: BSCA_IDS.roleRuleEditor, permission_id: bscaUuid(8111) },
    { role_id: BSCA_IDS.roleRuleEditor, permission_id: bscaUuid(8112) },
    { role_id: BSCA_IDS.roleRuleEditor, permission_id: bscaUuid(8113) },
    // viewer permissions
    { role_id: BSCA_IDS.roleViewer, permission_id: bscaUuid(8100) },
    { role_id: BSCA_IDS.roleViewer, permission_id: bscaUuid(8110) },
    { role_id: BSCA_IDS.roleViewer, permission_id: bscaUuid(8120) },
    { role_id: BSCA_IDS.roleViewer, permission_id: bscaUuid(8132) },
  ],
  user_role: () => [
    { id: bscaUuid(8200), user_id: BSCA_IDS.userAdmin, role_id: BSCA_IDS.roleSuperAdmin, assigned_by: null, assigned_at: '2025-01-10T09:00:00Z', expires_at: null },
    { id: bscaUuid(8201), user_id: BSCA_IDS.userJlynn, role_id: BSCA_IDS.rolePipelineOps, assigned_by: BSCA_IDS.userAdmin, assigned_at: '2025-06-15T09:00:00Z', expires_at: null },
    { id: bscaUuid(8202), user_id: BSCA_IDS.userJlynn, role_id: BSCA_IDS.roleRuleEditor, assigned_by: BSCA_IDS.userAdmin, assigned_at: '2025-06-15T09:00:00Z', expires_at: null },
    { id: bscaUuid(8203), user_id: BSCA_IDS.userAnalyst, role_id: BSCA_IDS.roleAnalyst, assigned_by: BSCA_IDS.userAdmin, assigned_at: '2025-09-01T09:00:00Z', expires_at: null },
  ],
  user_tenant_access: () => [
    { id: bscaUuid(8210), user_id: BSCA_IDS.userJlynn, tenant_id: BSCA_IDS.tenant, access_level: 'full', granted_by: BSCA_IDS.userAdmin, granted_at: '2025-06-15T09:00:00Z', expires_at: null },
    { id: bscaUuid(8211), user_id: BSCA_IDS.userAnalyst, tenant_id: BSCA_IDS.tenant, access_level: 'read_only', granted_by: BSCA_IDS.userAdmin, granted_at: '2025-09-01T09:00:00Z', expires_at: null },
  ],
  user_setting: () => [
    { id: bscaUuid(8220), user_id: BSCA_IDS.userJlynn, setting_key: 'ui.theme', setting_value: { mode: 'dark', accent: '#4f46e5' }, updated_at: '2026-03-15T10:00:00Z' },
    { id: bscaUuid(8221), user_id: BSCA_IDS.userJlynn, setting_key: 'ui.default_tenant', setting_value: BSCA_IDS.tenant, updated_at: '2026-01-02T08:00:00Z' },
    { id: bscaUuid(8222), user_id: BSCA_IDS.userJlynn, setting_key: 'ui.sidebar_collapsed', setting_value: false, updated_at: '2026-04-01T09:00:00Z' },
    { id: bscaUuid(8223), user_id: BSCA_IDS.userJlynn, setting_key: 'ui.table_page_size', setting_value: 50, updated_at: '2026-01-02T08:00:00Z' },
    { id: bscaUuid(8224), user_id: BSCA_IDS.userJlynn, setting_key: 'notifications.email', setting_value: true, updated_at: '2025-06-15T09:00:00Z' },
    { id: bscaUuid(8225), user_id: BSCA_IDS.userJlynn, setting_key: 'pipeline.auto_refresh', setting_value: true, updated_at: '2025-06-15T09:00:00Z' },
    { id: bscaUuid(8226), user_id: BSCA_IDS.userJlynn, setting_key: 'pipeline.refresh_interval_sec', setting_value: 30, updated_at: '2025-06-15T09:00:00Z' },
    { id: bscaUuid(8227), user_id: BSCA_IDS.userAdmin, setting_key: 'ui.theme', setting_value: { mode: 'light', accent: '#2563eb' }, updated_at: '2026-02-10T09:00:00Z' },
  ],
  admin_audit_event: () => [
    {
      id: bscaUuid(8300),
      actor_type: 'user',
      actor_id: BSCA_IDS.userJlynn,
      actor_email: 'jlynn@oneilldigital.com',
      event_type: 'user.login',
      tenant_id: null,
      entity_type: 'app_user',
      entity_id: BSCA_IDS.userJlynn,
      summary: 'User logged in via Azure AD SSO',
      detail: { oidc_provider: 'azure_ad', login_count: 247 },
      ip_address: '10.0.1.42',
      user_agent: 'Mozilla/5.0 Chrome/124',
      request_id: bscaUuid(8301),
      created_at: '2026-04-04T08:15:00Z',
    },
    {
      id: bscaUuid(8302),
      actor_type: 'user',
      actor_id: BSCA_IDS.userJlynn,
      actor_email: 'jlynn@oneilldigital.com',
      event_type: 'pipeline.triggered',
      tenant_id: BSCA_IDS.tenant,
      entity_type: 'pipeline_run',
      entity_id: BSCA_IDS.pipelineRun,
      summary: 'Triggered BSCA IMAPDHMO refresh run',
      detail: { trigger_source: 'MANUAL_TRIGGER', plan_year: 2026 },
      ip_address: '10.0.1.42',
      user_agent: 'Mozilla/5.0 Chrome/124',
      request_id: bscaUuid(8303),
      created_at: '2026-04-04T10:00:00Z',
    },
    {
      id: bscaUuid(8304),
      actor_type: 'user',
      actor_id: BSCA_IDS.userAdmin,
      actor_email: 'dcalvin@oneilldigital.com',
      event_type: 'role.assigned',
      tenant_id: null,
      entity_type: 'user_role',
      entity_id: bscaUuid(8201),
      summary: 'Assigned pipeline_ops role to Jamie Lynn',
      detail: { target_user: BSCA_IDS.userJlynn, role: 'pipeline_ops' },
      ip_address: '10.0.1.15',
      user_agent: 'Mozilla/5.0 Chrome/124',
      request_id: bscaUuid(8305),
      created_at: '2025-06-15T09:00:00Z',
    },
    {
      id: bscaUuid(8306),
      actor_type: 'user',
      actor_id: BSCA_IDS.userJlynn,
      actor_email: 'jlynn@oneilldigital.com',
      event_type: 'rule.updated',
      tenant_id: BSCA_IDS.tenant,
      entity_type: 'rule',
      entity_id: bscaUuid(1121),
      summary: 'Updated max_distance_miles from 25 to 30 on NPI Required Filter',
      detail: { before: { max_distance_miles: 25 }, after: { max_distance_miles: 30 }, fields_changed: ['max_distance_miles'], confirmed_dangerous: false },
      ip_address: '10.0.1.42',
      user_agent: 'Mozilla/5.0 Chrome/124',
      request_id: bscaUuid(8307),
      created_at: '2026-03-20T14:30:00Z',
    },
  ],

  // ── UI / Frontend (schema: ui) ──
  dashboard_widget: () => [
    { id: bscaUuid(8400), user_id: BSCA_IDS.userJlynn, widget_type: 'live_runs', grid_col: 0, grid_row: 0, grid_width: 12, grid_height: 3, config: { auto_advance: true, advance_interval_sec: 10 }, is_visible: true, sort_order: 0, created_at: '2025-06-15T09:00:00Z', updated_at: '2026-04-01T09:00:00Z' },
    { id: bscaUuid(8401), user_id: BSCA_IDS.userJlynn, widget_type: 'recent_runs', grid_col: 0, grid_row: 3, grid_width: 8, grid_height: 4, config: { page_size: 5, show_failures_only: false }, is_visible: true, sort_order: 1, created_at: '2025-06-15T09:00:00Z', updated_at: '2026-04-01T09:00:00Z' },
    { id: bscaUuid(8402), user_id: BSCA_IDS.userJlynn, widget_type: 'client_health', grid_col: 8, grid_row: 3, grid_width: 4, grid_height: 4, config: {}, is_visible: true, sort_order: 2, created_at: '2025-06-15T09:00:00Z', updated_at: '2026-04-01T09:00:00Z' },
    { id: bscaUuid(8403), user_id: BSCA_IDS.userJlynn, widget_type: 'provider_trends', grid_col: 0, grid_row: 7, grid_width: 8, grid_height: 3, config: { months: 6, tenants: [BSCA_IDS.tenant], show_gridlines: true }, is_visible: true, sort_order: 3, created_at: '2025-06-15T09:00:00Z', updated_at: '2026-04-01T09:00:00Z' },
    { id: bscaUuid(8404), user_id: BSCA_IDS.userJlynn, widget_type: 'failure_breakdown', grid_col: 8, grid_row: 7, grid_width: 4, grid_height: 3, config: { days: 30 }, is_visible: true, sort_order: 4, created_at: '2025-06-15T09:00:00Z', updated_at: '2026-04-01T09:00:00Z' },
    { id: bscaUuid(8405), user_id: BSCA_IDS.userJlynn, widget_type: 'weekly_volume', grid_col: 0, grid_row: 10, grid_width: 6, grid_height: 3, config: {}, is_visible: true, sort_order: 5, created_at: '2025-06-15T09:00:00Z', updated_at: '2026-04-01T09:00:00Z' },
    { id: bscaUuid(8406), user_id: BSCA_IDS.userJlynn, widget_type: 'aep_reminder', grid_col: 6, grid_row: 10, grid_width: 6, grid_height: 2, config: {}, is_visible: true, sort_order: 6, created_at: '2025-06-15T09:00:00Z', updated_at: '2026-04-01T09:00:00Z' },
  ],
  saved_filter: () => [
    {
      id: bscaUuid(8410),
      user_id: BSCA_IDS.userJlynn,
      tenant_id: BSCA_IDS.tenant,
      name: 'Failed runs (last 7 days)',
      view_key: 'pipeline_runs',
      criteria: { status: ['failed', 'stopped'], date_range: { from: '2026-03-28', to: '2026-04-04' }, sort: '-started_at', page_size: 25 },
      is_shared: true,
      is_default: false,
      created_at: '2026-03-28T10:00:00Z',
      updated_at: '2026-03-28T10:00:00Z',
    },
    {
      id: bscaUuid(8411),
      user_id: BSCA_IDS.userJlynn,
      tenant_id: BSCA_IDS.tenant,
      name: 'BSCA all runs',
      view_key: 'pipeline_runs',
      criteria: { tenant_ids: [BSCA_IDS.tenant], sort: '-started_at', page_size: 50 },
      is_shared: false,
      is_default: true,
      created_at: '2025-06-20T09:00:00Z',
      updated_at: '2025-06-20T09:00:00Z',
    },
  ],
  recent_activity: () => [
    { id: bscaUuid(8420), user_id: BSCA_IDS.userJlynn, activity_type: 'page_visit', entity_type: null, entity_id: null, entity_label: 'Dashboard', page_path: '#/dashboard', tenant_id: null, visited_at: '2026-04-04T10:20:00Z' },
    { id: bscaUuid(8421), user_id: BSCA_IDS.userJlynn, activity_type: 'entity_view', entity_type: 'pipeline_run', entity_id: BSCA_IDS.pipelineRun, entity_label: 'BSCA IMAPDHMO run #101', page_path: '#/refreshflow', tenant_id: BSCA_IDS.tenant, visited_at: '2026-04-04T10:18:00Z' },
    { id: bscaUuid(8422), user_id: BSCA_IDS.userJlynn, activity_type: 'entity_view', entity_type: 'rule', entity_id: bscaUuid(1121), entity_label: 'MPCP rule #2', page_path: '#/client-blueshield-ca', tenant_id: BSCA_IDS.tenant, visited_at: '2026-04-04T10:15:00Z' },
    { id: bscaUuid(8423), user_id: BSCA_IDS.userJlynn, activity_type: 'page_visit', entity_type: null, entity_id: null, entity_label: 'UDF Studio', page_path: '#/udf-studio', tenant_id: null, visited_at: '2026-04-04T09:45:00Z' },
  ],
  notification_inbox: () => [
    {
      id: bscaUuid(8430),
      user_id: BSCA_IDS.userJlynn,
      title: 'BSCA IMAPDHMO pipeline completed',
      message: 'Pipeline run #101 completed successfully — 100 providers processed in 9m 42s.',
      severity: 'success',
      source_type: 'pipeline',
      source_id: BSCA_IDS.pipelineRun,
      action_url: '#/refreshflow?run=' + BSCA_IDS.pipelineRun,
      action_label: 'View Run',
      is_read: false,
      read_at: null,
      is_dismissed: false,
      tenant_id: BSCA_IDS.tenant,
      created_at: '2026-04-04T10:10:00Z',
    },
    {
      id: bscaUuid(8431),
      user_id: BSCA_IDS.userJlynn,
      title: 'NPI null rate exceeded threshold',
      message: 'Schema validation found 342 null NPI values in BSCA IMAPDHMO file — exceeds 5% threshold.',
      severity: 'error',
      source_type: 'alert',
      source_id: bscaUuid(8432),
      action_url: '#/alerts?id=' + bscaUuid(8432),
      action_label: 'Review Alert',
      is_read: true,
      read_at: '2026-04-03T15:00:00Z',
      is_dismissed: false,
      tenant_id: BSCA_IDS.tenant,
      created_at: '2026-04-03T14:30:00Z',
    },
    {
      id: bscaUuid(8433),
      user_id: BSCA_IDS.userJlynn,
      title: 'Role assigned: rule_editor',
      message: 'Danang Calvin granted you the Rule Editor role — you can now create and modify directory rules.',
      severity: 'info',
      source_type: 'admin',
      source_id: bscaUuid(8202),
      action_url: null,
      action_label: null,
      is_read: true,
      read_at: '2025-06-15T09:05:00Z',
      is_dismissed: false,
      tenant_id: null,
      created_at: '2025-06-15T09:00:00Z',
    },
  ],
  udf_test_run: () => [
    {
      id: bscaUuid(8440),
      user_id: BSCA_IDS.userJlynn,
      udf_function_id: BSCA_IDS.udfTrim,
      pipeline_id: null,
      test_type: 'single_udf',
      input_data: { params: { input: '  JOHN DOE  ' }, sample_rows: [] },
      output_data: { result: 'JOHN DOE', execution_time_ms: 1 },
      status: 'completed',
      error_message: null,
      execution_ms: 1,
      created_at: '2026-04-04T09:50:00Z',
    },
    {
      id: bscaUuid(8441),
      user_id: BSCA_IDS.userJlynn,
      udf_function_id: null,
      pipeline_id: BSCA_IDS.cleansingPipeline,
      test_type: 'pipeline_preview',
      input_data: { sample_data: [{ PROV_LAST_NM: ' doe ', PROV_FIRST_NM: ' jane ' }], pipeline_config: { version: 3 } },
      output_data: { rows: [{ PROV_LAST_NM: 'Doe', PROV_FIRST_NM: 'Jane' }], per_step_results: [], errors: [] },
      status: 'completed',
      error_message: null,
      execution_ms: 45,
      created_at: '2026-04-04T09:55:00Z',
    },
  ],
  canvas_state: () => [
    {
      id: bscaUuid(8450),
      user_id: BSCA_IDS.userJlynn,
      canvas_type: 'udf_pipeline',
      entity_id: BSCA_IDS.cleansingPipeline,
      tenant_id: BSCA_IDS.tenant,
      state: {
        nodes: [
          { id: 'node-1', type: 'data_input', x: 50, y: 100, config: { source: 'staging_record' } },
          { id: 'node-2', type: 'udf_transform', x: 250, y: 100, config: { function: 'TRIM', column: 'PROV_LAST_NM' } },
          { id: 'node-3', type: 'udf_transform', x: 450, y: 100, config: { function: 'PROPER_CASE', column: 'PROV_LAST_NM' } },
          { id: 'node-4', type: 'output', x: 650, y: 100, config: {} },
        ],
        connections: [
          { from: 'node-1', to: 'node-2', from_port: 'output', to_port: 'input' },
          { from: 'node-2', to: 'node-3', from_port: 'output', to_port: 'input' },
          { from: 'node-3', to: 'node-4', from_port: 'output', to_port: 'input' },
        ],
        viewport: { x: 0, y: 0, zoom: 1.0 },
        selected_node_id: 'node-3',
        unsaved_changes: false,
      },
      is_draft: false,
      last_saved_at: '2026-04-03T16:00:00Z',
      created_at: '2026-03-01T10:00:00Z',
      updated_at: '2026-04-03T16:00:00Z',
    },
  ],
  search_index_cache: () => [
    { id: bscaUuid(8460), entity_type: 'table', entity_id: 'staging_record', label: 'staging_record', description: 'Working record through the pipeline — cleansing, CASS, rules, output', keywords: ['staging', 'canonical', 'cleansing', 'provider'], parent_entity: null, layer: 'pipeline_run', url_path: '#/tables/staging_record', indexed_at: '2026-04-04T06:00:00Z' },
    { id: bscaUuid(8461), entity_type: 'column', entity_id: 'staging_record.canonical_data', label: 'canonical_data', description: 'Mapped provider data in canonical format (JSONB)', keywords: ['canonical', 'jsonb', 'provider', 'data'], parent_entity: 'staging_record', layer: 'pipeline_run', url_path: '#/tables/staging_record', indexed_at: '2026-04-04T06:00:00Z' },
    { id: bscaUuid(8462), entity_type: 'service', entity_id: 'cleansing', label: 'Cleansing Service', description: 'UDF pipeline execution with DAG config, DLQ, per-field audit', keywords: ['cleansing', 'udf', 'transform', 'dag'], parent_entity: null, layer: null, url_path: '#/services/cleansing', indexed_at: '2026-04-04T06:00:00Z' },
    { id: bscaUuid(8463), entity_type: 'udf', entity_id: 'PROPER_CASE', label: 'PROPER_CASE', description: 'Title case with acronym recognition (LLC, PLLC, IPA, YMCA, CVS)', keywords: ['proper', 'case', 'title', 'capitalize', 'acronym'], parent_entity: null, layer: null, url_path: '#/udf-studio/PROPER_CASE', indexed_at: '2026-04-04T06:00:00Z' },
    { id: bscaUuid(8464), entity_type: 'table', entity_id: 'app_user', label: 'app_user', description: 'OIDC-linked user identity — Azure AD / Okta SSO', keywords: ['user', 'auth', 'oidc', 'login', 'sso'], parent_entity: null, layer: 'admin_rbac', url_path: '#/tables/app_user', indexed_at: '2026-04-04T06:00:00Z' },
  ],

  // ── Archival Service ──
  retention_policy: () => [
    { id: bscaUuid(9030), tenant_id: null, data_class: 'provider_refresh', hot_days: 90, warm_days: 1095, cold_days: 3650, total_retention_days: 3650, legal_citation: '42 CFR 422.504', is_active: true, approved_by: 'Compliance', approved_at: '2026-01-15T00:00:00Z', notes: 'Global default — 10-year Medicare Advantage retention', created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z' },
    { id: bscaUuid(9031), tenant_id: null, data_class: 'raw_import_file', hot_days: 90, warm_days: 1095, cold_days: 3650, total_retention_days: 3650, legal_citation: '42 CFR 422.504', is_active: true, approved_by: 'Compliance', approved_at: '2026-01-15T00:00:00Z', notes: null, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z' },
    { id: bscaUuid(9032), tenant_id: null, data_class: 'cass_result', hot_days: 90, warm_days: 1095, cold_days: 3650, total_retention_days: 3650, legal_citation: '42 CFR 422.504', is_active: true, approved_by: 'Compliance', approved_at: '2026-01-15T00:00:00Z', notes: null, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z' },
    { id: bscaUuid(9033), tenant_id: null, data_class: 'audit_event', hot_days: 90, warm_days: 1095, cold_days: 3650, total_retention_days: 3650, legal_citation: 'HIPAA + 42 CFR 422.504', is_active: true, approved_by: 'Compliance', approved_at: '2026-01-15T00:00:00Z', notes: null, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z' },
    { id: bscaUuid(9034), tenant_id: null, data_class: 'execution_log', hot_days: 30, warm_days: 365, cold_days: 3650, total_retention_days: 3650, legal_citation: 'Best practice', is_active: true, approved_by: 'Engineering', approved_at: '2026-01-15T00:00:00Z', notes: null, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z' },
    { id: bscaUuid(9035), tenant_id: null, data_class: 'quality_result', hot_days: 30, warm_days: 1095, cold_days: 3650, total_retention_days: 3650, legal_citation: '42 CFR 422.504', is_active: true, approved_by: 'Compliance', approved_at: '2026-01-15T00:00:00Z', notes: null, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z' },
    { id: bscaUuid(9036), tenant_id: null, data_class: 'config', hot_days: -1, warm_days: -1, cold_days: -1, total_retention_days: -1, legal_citation: 'Indefinite (versioned)', is_active: true, approved_by: 'Compliance', approved_at: '2026-01-15T00:00:00Z', notes: 'Configuration data retained indefinitely — versioned by plan year', created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z' },
    { id: bscaUuid(9037), tenant_id: null, data_class: 'cass_cache', hot_days: 90, warm_days: 90, cold_days: 0, total_retention_days: 90, legal_citation: 'Transient', is_active: true, approved_by: 'Engineering', approved_at: '2026-01-15T00:00:00Z', notes: 'Rebuilt per refresh — no long-term value', created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z' },
    { id: bscaUuid(9038), tenant_id: null, data_class: 'spatial_index', hot_days: 0, warm_days: 0, cold_days: 0, total_retention_days: 0, legal_citation: 'Rebuilt per refresh', is_active: true, approved_by: 'Engineering', approved_at: '2026-01-15T00:00:00Z', notes: 'No retention — rebuilt from provider_record on every refresh', created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z' },
  ],

  archival_schedule: () => [
    { id: BSCA_IDS.archivalScheduleHotToWarm, job_type: 'hot_to_warm', schedule_name: 'Daily Hot→Warm Transition', cron_expression: '0 2 * * *', timezone: 'America/New_York', is_enabled: true, tenant_id: null, data_class: null, parameters: { max_partitions_per_table: 1 }, max_runtime_minutes: 120, alert_on_failure: true, alert_recipients: 'ops@bsca.com', last_run_at: '2026-04-04T06:00:00Z', last_run_status: 'success', next_run_at: '2026-04-05T06:00:00Z', created_at: '2026-01-15T00:00:00Z', updated_at: '2026-04-04T06:00:15Z' },
    { id: BSCA_IDS.archivalScheduleWarmToCold, job_type: 'warm_to_cold', schedule_name: 'Monthly Warm→Cold Export', cron_expression: '0 1 1 * *', timezone: 'America/New_York', is_enabled: true, tenant_id: null, data_class: null, parameters: { max_concurrent_exports: 3 }, max_runtime_minutes: 360, alert_on_failure: true, alert_recipients: 'ops@bsca.com,compliance@bsca.com', last_run_at: '2026-04-01T05:00:00Z', last_run_status: 'success', next_run_at: '2026-05-01T05:00:00Z', created_at: '2026-01-15T00:00:00Z', updated_at: '2026-04-01T08:45:00Z' },
    { id: BSCA_IDS.archivalScheduleSoftPurge, job_type: 'soft_purge', schedule_name: 'Monthly Soft Purge', cron_expression: '0 3 1 * *', timezone: 'America/New_York', is_enabled: true, tenant_id: null, data_class: null, parameters: null, max_runtime_minutes: 120, alert_on_failure: true, alert_recipients: 'ops@bsca.com,compliance@bsca.com', last_run_at: '2026-04-01T07:00:00Z', last_run_status: 'success', next_run_at: '2026-05-01T07:00:00Z', created_at: '2026-01-15T00:00:00Z', updated_at: '2026-04-01T07:45:00Z' },
    { id: BSCA_IDS.archivalScheduleHardPurge, job_type: 'hard_purge', schedule_name: 'Monthly Hard Purge', cron_expression: '0 4 1 * *', timezone: 'America/New_York', is_enabled: true, tenant_id: null, data_class: null, parameters: null, max_runtime_minutes: 120, alert_on_failure: true, alert_recipients: 'ops@bsca.com,compliance@bsca.com', last_run_at: '2026-04-01T08:00:00Z', last_run_status: 'success', next_run_at: '2026-05-01T08:00:00Z', created_at: '2026-01-15T00:00:00Z', updated_at: '2026-04-01T08:30:00Z' },
    { id: BSCA_IDS.archivalSchedulePartCreate, job_type: 'partition_create', schedule_name: 'Monthly Partition Pre-Creation', cron_expression: '0 5 1 * *', timezone: 'America/New_York', is_enabled: true, tenant_id: null, data_class: null, parameters: null, max_runtime_minutes: 60, alert_on_failure: true, alert_recipients: 'ops@bsca.com', last_run_at: '2026-04-01T09:00:00Z', last_run_status: 'success', next_run_at: '2026-05-01T09:00:00Z', created_at: '2026-01-15T00:00:00Z', updated_at: '2026-04-01T09:15:00Z' },
    { id: BSCA_IDS.archivalSchedulePartStats, job_type: 'partition_stats', schedule_name: 'Daily Partition Stats Update', cron_expression: '0 5 * * *', timezone: 'America/New_York', is_enabled: true, tenant_id: null, data_class: null, parameters: null, max_runtime_minutes: 60, alert_on_failure: false, alert_recipients: null, last_run_at: '2026-04-04T09:00:00Z', last_run_status: 'success', next_run_at: '2026-04-05T09:00:00Z', created_at: '2026-01-15T00:00:00Z', updated_at: '2026-04-04T09:45:00Z' },
    { id: BSCA_IDS.archivalScheduleCassCleanup, job_type: 'cass_cache_cleanup', schedule_name: 'Daily CASS Cache Cleanup', cron_expression: '0 3 * * *', timezone: 'America/New_York', is_enabled: true, tenant_id: null, data_class: null, parameters: null, max_runtime_minutes: 30, alert_on_failure: true, alert_recipients: 'ops@bsca.com', last_run_at: '2026-04-04T07:00:00Z', last_run_status: 'success', next_run_at: '2026-04-05T07:00:00Z', created_at: '2026-01-15T00:00:00Z', updated_at: '2026-04-04T07:10:00Z' },
    { id: BSCA_IDS.archivalScheduleLockCleanup, job_type: 'lock_cleanup', schedule_name: 'Daily Lock Cleanup', cron_expression: '30 3 * * *', timezone: 'America/New_York', is_enabled: true, tenant_id: null, data_class: null, parameters: null, max_runtime_minutes: 15, alert_on_failure: true, alert_recipients: 'ops@bsca.com', last_run_at: '2026-04-04T07:30:00Z', last_run_status: 'success', next_run_at: '2026-04-05T07:30:00Z', created_at: '2026-01-15T00:00:00Z', updated_at: '2026-04-04T07:32:00Z' },
    { id: BSCA_IDS.archivalScheduleRestoreCleanup, job_type: 'restore_cleanup', schedule_name: 'Daily Restore Expiry Cleanup', cron_expression: '0 4 * * *', timezone: 'America/New_York', is_enabled: true, tenant_id: null, data_class: null, parameters: null, max_runtime_minutes: 30, alert_on_failure: true, alert_recipients: 'ops@bsca.com', last_run_at: '2026-04-04T08:00:00Z', last_run_status: 'success', next_run_at: '2026-04-05T08:00:00Z', created_at: '2026-01-15T00:00:00Z', updated_at: '2026-04-04T08:05:00Z' },
    { id: BSCA_IDS.archivalScheduleIntegrity, job_type: 'integrity_check', schedule_name: 'Weekly Integrity Check', cron_expression: '0 2 * * 0', timezone: 'America/New_York', is_enabled: true, tenant_id: null, data_class: null, parameters: { sample_pct: 10 }, max_runtime_minutes: 180, alert_on_failure: true, alert_recipients: 'ops@bsca.com', last_run_at: '2026-03-30T06:00:00Z', last_run_status: 'success', next_run_at: '2026-04-06T06:00:00Z', created_at: '2026-01-15T00:00:00Z', updated_at: '2026-03-30T08:30:00Z' },
    { id: BSCA_IDS.archivalScheduleCompliance, job_type: 'compliance_report', schedule_name: 'Monthly Compliance Report', cron_expression: '0 6 1 * *', timezone: 'America/New_York', is_enabled: true, tenant_id: null, data_class: null, parameters: null, max_runtime_minutes: 60, alert_on_failure: true, alert_recipients: 'compliance@bsca.com', last_run_at: '2026-04-01T10:00:00Z', last_run_status: 'success', next_run_at: '2026-05-01T10:00:00Z', created_at: '2026-01-15T00:00:00Z', updated_at: '2026-04-01T10:30:00Z' },
    { id: BSCA_IDS.archivalScheduleGlacier, job_type: 'glacier_transition', schedule_name: 'Quarterly Glacier Transition', cron_expression: '0 1 1 1,4,7,10 *', timezone: 'America/New_York', is_enabled: true, tenant_id: null, data_class: null, parameters: null, max_runtime_minutes: 240, alert_on_failure: true, alert_recipients: 'ops@bsca.com', last_run_at: '2026-04-01T05:00:00Z', last_run_status: 'success', next_run_at: '2026-07-01T05:00:00Z', created_at: '2026-01-15T00:00:00Z', updated_at: '2026-04-01T08:00:00Z' },
  ],

  partition_registry: () => [
    { id: bscaUuid(9050), tenant_id: BSCA_IDS.tenant, source_table: 'staging_record', partition_name: 'staging_record_bsca_2026_01', partition_scheme: 'ps_monthly', range_start: '2026-01-01T00:00:00Z', range_end: '2026-02-01T00:00:00Z', storage_tier: 'warm', is_compressed: true, compression_type: 'PAGE', row_count: 161432, size_bytes: 524288000, indexes_active: false, is_exported: false, export_snapshot_id: null, is_dropped: false, dropped_at: null, last_accessed: '2026-03-15T10:00:00Z', stats_updated_at: '2026-04-04T09:00:00Z', created_at: '2025-12-01T09:00:00Z', updated_at: '2026-04-04T09:00:00Z' },
    { id: bscaUuid(9051), tenant_id: BSCA_IDS.tenant, source_table: 'staging_record', partition_name: 'staging_record_bsca_2026_02', partition_scheme: 'ps_monthly', range_start: '2026-02-01T00:00:00Z', range_end: '2026-03-01T00:00:00Z', storage_tier: 'warm', is_compressed: true, compression_type: 'PAGE', row_count: 161432, size_bytes: 518144000, indexes_active: false, is_exported: false, export_snapshot_id: null, is_dropped: false, dropped_at: null, last_accessed: '2026-03-20T14:00:00Z', stats_updated_at: '2026-04-04T09:00:00Z', created_at: '2026-01-01T09:00:00Z', updated_at: '2026-04-04T09:00:00Z' },
    { id: bscaUuid(9052), tenant_id: BSCA_IDS.tenant, source_table: 'staging_record', partition_name: 'staging_record_bsca_2026_03', partition_scheme: 'ps_monthly', range_start: '2026-03-01T00:00:00Z', range_end: '2026-04-01T00:00:00Z', storage_tier: 'hot', is_compressed: false, compression_type: null, row_count: 161432, size_bytes: 1073741824, indexes_active: true, is_exported: false, export_snapshot_id: null, is_dropped: false, dropped_at: null, last_accessed: '2026-04-04T10:00:00Z', stats_updated_at: '2026-04-04T09:00:00Z', created_at: '2026-02-01T09:00:00Z', updated_at: '2026-04-04T09:00:00Z' },
    { id: bscaUuid(9053), tenant_id: BSCA_IDS.tenant, source_table: 'staging_record', partition_name: 'staging_record_bsca_2026_04', partition_scheme: 'ps_monthly', range_start: '2026-04-01T00:00:00Z', range_end: '2026-05-01T00:00:00Z', storage_tier: 'hot', is_compressed: false, compression_type: null, row_count: 42510, size_bytes: 268435456, indexes_active: true, is_exported: false, export_snapshot_id: null, is_dropped: false, dropped_at: null, last_accessed: '2026-04-04T18:00:00Z', stats_updated_at: '2026-04-04T09:00:00Z', created_at: '2026-03-01T09:00:00Z', updated_at: '2026-04-04T09:00:00Z' },
    { id: bscaUuid(9054), tenant_id: BSCA_IDS.tenant, source_table: 'audit_event', partition_name: 'audit_event_bsca_2026_01', partition_scheme: 'ps_monthly', range_start: '2026-01-01T00:00:00Z', range_end: '2026-02-01T00:00:00Z', storage_tier: 'warm', is_compressed: true, compression_type: 'PAGE', row_count: 85200, size_bytes: 134217728, indexes_active: false, is_exported: false, export_snapshot_id: null, is_dropped: false, dropped_at: null, last_accessed: null, stats_updated_at: '2026-04-04T09:00:00Z', created_at: '2025-12-01T09:00:00Z', updated_at: '2026-04-04T09:00:00Z' },
    { id: bscaUuid(9055), tenant_id: BSCA_IDS.tenant, source_table: 'audit_event', partition_name: 'audit_event_bsca_2026_04', partition_scheme: 'ps_monthly', range_start: '2026-04-01T00:00:00Z', range_end: '2026-05-01T00:00:00Z', storage_tier: 'hot', is_compressed: false, compression_type: null, row_count: 12800, size_bytes: 33554432, indexes_active: true, is_exported: false, export_snapshot_id: null, is_dropped: false, dropped_at: null, last_accessed: '2026-04-04T18:00:00Z', stats_updated_at: '2026-04-04T09:00:00Z', created_at: '2026-03-01T09:00:00Z', updated_at: '2026-04-04T09:00:00Z' },
    // Cold-tier partition (exported + dropped)
    { id: bscaUuid(9056), tenant_id: BSCA_IDS.tenant, source_table: 'staging_record', partition_name: 'staging_record_bsca_2024_01', partition_scheme: 'ps_monthly', range_start: '2024-01-01T00:00:00Z', range_end: '2024-02-01T00:00:00Z', storage_tier: 'warm', is_compressed: true, compression_type: 'PAGE', row_count: 155000, size_bytes: 0, indexes_active: false, is_exported: true, export_snapshot_id: BSCA_IDS.snapshotColdQ12024, is_dropped: true, dropped_at: '2026-02-01T06:30:00Z', last_accessed: null, stats_updated_at: '2026-02-01T06:30:00Z', created_at: '2023-12-01T09:00:00Z', updated_at: '2026-02-01T06:30:00Z' },
  ],

  partition_creation_schedule: () => [
    { id: bscaUuid(9060), tenant_id: BSCA_IDS.tenant, source_table: 'staging_record', partition_name: 'staging_record_bsca_2026_05', range_start: '2026-05-01T00:00:00Z', range_end: '2026-06-01T00:00:00Z', scheduled_date: '2026-04-01', is_created: true, created_at: '2026-03-01T09:00:00Z' },
    { id: bscaUuid(9061), tenant_id: BSCA_IDS.tenant, source_table: 'staging_record', partition_name: 'staging_record_bsca_2026_06', range_start: '2026-06-01T00:00:00Z', range_end: '2026-07-01T00:00:00Z', scheduled_date: '2026-05-01', is_created: false, created_at: '2026-04-01T09:00:00Z' },
    { id: bscaUuid(9062), tenant_id: BSCA_IDS.tenant, source_table: 'audit_event', partition_name: 'audit_event_bsca_2026_05', range_start: '2026-05-01T00:00:00Z', range_end: '2026-06-01T00:00:00Z', scheduled_date: '2026-04-01', is_created: true, created_at: '2026-03-01T09:00:00Z' },
    { id: bscaUuid(9063), tenant_id: BSCA_IDS.tenant, source_table: 'quality_result', partition_name: 'quality_result_bsca_2026_05', range_start: '2026-05-01T00:00:00Z', range_end: '2026-06-01T00:00:00Z', scheduled_date: '2026-04-01', is_created: true, created_at: '2026-03-01T09:00:00Z' },
  ],

  archive_snapshot: () => [
    // Warm-tier snapshots (compressed DB partitions)
    { id: BSCA_IDS.snapshotStagingJan, tenant_id: BSCA_IDS.tenant, source_table: 'staging_record', partition_key: '2026-01', data_start_date: '2026-01-01', data_end_date: '2026-01-31', row_count: 161432, size_bytes: 524288000, format: 'db_partition', storage_tier: 'warm', storage_path: 'staging_record_bsca_2026_01', checksum_sha256: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', checksum_verified: true, compressed: true, encrypted: false, encryption_key_id: null, reason: 'tier_transition', retention_tier: '10_year', expires_at: '2036-01-31T00:00:00Z', legal_hold_id: null, pipeline_job_id: BSCA_IDS.archivalJobHotToWarm, archived_at: '2026-04-02T06:05:00Z', restored_at: null, restored_by: null, restore_expires: null, purged_at: null, purge_confirmed: false, created_at: '2026-04-02T06:05:00Z', updated_at: '2026-04-02T06:05:00Z' },
    { id: BSCA_IDS.snapshotStagingFeb, tenant_id: BSCA_IDS.tenant, source_table: 'staging_record', partition_key: '2026-02', data_start_date: '2026-02-01', data_end_date: '2026-02-28', row_count: 161432, size_bytes: 518144000, format: 'db_partition', storage_tier: 'warm', storage_path: 'staging_record_bsca_2026_02', checksum_sha256: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3', checksum_verified: true, compressed: true, encrypted: false, encryption_key_id: null, reason: 'tier_transition', retention_tier: '10_year', expires_at: '2036-02-28T00:00:00Z', legal_hold_id: null, pipeline_job_id: BSCA_IDS.archivalJobHotToWarm, archived_at: '2026-04-02T06:08:00Z', restored_at: null, restored_by: null, restore_expires: null, purged_at: null, purge_confirmed: false, created_at: '2026-04-02T06:08:00Z', updated_at: '2026-04-02T06:08:00Z' },
    { id: BSCA_IDS.snapshotAuditJan, tenant_id: BSCA_IDS.tenant, source_table: 'audit_event', partition_key: '2026-01', data_start_date: '2026-01-01', data_end_date: '2026-01-31', row_count: 85200, size_bytes: 134217728, format: 'db_partition', storage_tier: 'warm', storage_path: 'audit_event_bsca_2026_01', checksum_sha256: 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4', checksum_verified: true, compressed: true, encrypted: false, encryption_key_id: null, reason: 'tier_transition', retention_tier: '10_year', expires_at: '2036-01-31T00:00:00Z', legal_hold_id: null, pipeline_job_id: BSCA_IDS.archivalJobHotToWarm, archived_at: '2026-04-02T06:12:00Z', restored_at: null, restored_by: null, restore_expires: null, purged_at: null, purge_confirmed: false, created_at: '2026-04-02T06:12:00Z', updated_at: '2026-04-02T06:12:00Z' },
    // Cold-tier snapshot (Parquet on S3)
    { id: BSCA_IDS.snapshotColdQ12024, tenant_id: BSCA_IDS.tenant, source_table: 'staging_record', partition_key: '2024-01', data_start_date: '2024-01-01', data_end_date: '2024-01-31', row_count: 155000, size_bytes: 89128960, format: 'parquet', storage_tier: 'cold', storage_path: 's3://bsca-archive/archive/BSCA/staging_record/2024/2024-01.parquet', checksum_sha256: 'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5', checksum_verified: true, compressed: true, encrypted: true, encryption_key_id: 'arn:aws:kms:us-west-2:123:key/archival-bsca', reason: 'tier_transition', retention_tier: '10_year', expires_at: '2034-01-31T00:00:00Z', legal_hold_id: null, pipeline_job_id: BSCA_IDS.archivalJobWarmToCold, archived_at: '2026-02-01T06:00:00Z', restored_at: null, restored_by: null, restore_expires: null, purged_at: null, purge_confirmed: false, created_at: '2026-02-01T06:00:00Z', updated_at: '2026-02-01T06:30:00Z' },
  ],

  legal_hold: () => [
    { id: BSCA_IDS.legalHoldOig, tenant_id: BSCA_IDS.tenant, hold_name: 'OIG Investigation 2026-001 — BSCA Network Adequacy Review', hold_type: 'investigation', scope: 'provider_refresh,audit_event', scope_start: '2025-01-01', scope_end: '2026-03-31', issued_by: 'General Counsel (Office of Inspector General notice)', issued_at: '2026-03-15T14:00:00Z', expected_duration_days: 180, released_at: null, released_by: null, release_reason: null, notes: 'OIG reviewing BSCA provider network adequacy for MA plans during PY2025-2026. All provider refresh data and audit events within scope period must be retained until investigation concludes.', notification_sent: true, is_active: true, created_at: '2026-03-15T14:00:00Z', updated_at: '2026-03-15T14:00:00Z' },
  ],

  archival_job: () => [
    // Recent daily Hot→Warm (completed successfully)
    { id: BSCA_IDS.archivalJobHotToWarm, job_type: 'hot_to_warm', job_name: 'hot_to_warm_2026_04_04', trigger_type: 'scheduled', tenant_id: null, data_class: null, parameters: { max_partitions_per_table: 1 }, status: 'success', total_items: 3, processed_items: 3, failed_items: 0, skipped_items: 0, error_message: null, retry_count: 0, max_retries: 3, last_retry_at: null, started_at: '2026-04-04T06:00:00Z', completed_at: '2026-04-04T06:15:00Z', next_run_at: '2026-04-05T06:00:00Z', created_at: '2026-04-04T06:00:00Z', created_by: 'SYSTEM' },
    // Monthly Warm→Cold (completed with 1 skip due to legal hold)
    { id: BSCA_IDS.archivalJobWarmToCold, job_type: 'warm_to_cold', job_name: 'warm_to_cold_2026_04_01', trigger_type: 'scheduled', tenant_id: null, data_class: null, parameters: { max_concurrent_exports: 3 }, status: 'partial', total_items: 4, processed_items: 3, failed_items: 0, skipped_items: 1, error_message: null, retry_count: 0, max_retries: 3, last_retry_at: null, started_at: '2026-04-01T05:00:00Z', completed_at: '2026-04-01T08:45:00Z', next_run_at: '2026-05-01T05:00:00Z', created_at: '2026-04-01T05:00:00Z', created_by: 'SYSTEM' },
    // Monthly soft purge
    { id: BSCA_IDS.archivalJobSoftPurge, job_type: 'soft_purge', job_name: 'soft_purge_2026_04_01', trigger_type: 'scheduled', tenant_id: null, data_class: null, parameters: null, status: 'success', total_items: 0, processed_items: 0, failed_items: 0, skipped_items: 0, error_message: null, retry_count: 0, max_retries: 3, last_retry_at: null, started_at: '2026-04-01T07:00:00Z', completed_at: '2026-04-01T07:02:00Z', next_run_at: '2026-05-01T07:00:00Z', created_at: '2026-04-01T07:00:00Z', created_by: 'SYSTEM' },
    // Partition pre-creation
    { id: BSCA_IDS.archivalJobPartCreate, job_type: 'partition_create', job_name: 'partition_create_2026_04_01', trigger_type: 'scheduled', tenant_id: null, data_class: null, parameters: null, status: 'success', total_items: 7, processed_items: 7, failed_items: 0, skipped_items: 0, error_message: null, retry_count: 0, max_retries: 3, last_retry_at: null, started_at: '2026-04-01T09:00:00Z', completed_at: '2026-04-01T09:05:00Z', next_run_at: '2026-05-01T09:00:00Z', created_at: '2026-04-01T09:00:00Z', created_by: 'SYSTEM' },
    // Weekly integrity check
    { id: BSCA_IDS.archivalJobIntegrity, job_type: 'integrity_check', job_name: 'integrity_check_2026_03_30', trigger_type: 'scheduled', tenant_id: null, data_class: null, parameters: { sample_pct: 10 }, status: 'success', total_items: 3, processed_items: 3, failed_items: 0, skipped_items: 0, error_message: null, retry_count: 0, max_retries: 3, last_retry_at: null, started_at: '2026-03-30T06:00:00Z', completed_at: '2026-03-30T08:30:00Z', next_run_at: '2026-04-06T06:00:00Z', created_at: '2026-03-30T06:00:00Z', created_by: 'SYSTEM' },
    // Monthly compliance report
    { id: BSCA_IDS.archivalJobCompliance, job_type: 'compliance_report', job_name: 'compliance_report_2026_04_01', trigger_type: 'scheduled', tenant_id: null, data_class: null, parameters: null, status: 'success', total_items: 1, processed_items: 1, failed_items: 0, skipped_items: 0, error_message: null, retry_count: 0, max_retries: 3, last_retry_at: null, started_at: '2026-04-01T10:00:00Z', completed_at: '2026-04-01T10:15:00Z', next_run_at: '2026-05-01T10:00:00Z', created_at: '2026-04-01T10:00:00Z', created_by: 'SYSTEM' },
  ],

  archival_job_step: () => [
    // Steps from Hot→Warm job (3 partitions compressed)
    { id: bscaUuid(9070), job_id: BSCA_IDS.archivalJobHotToWarm, step_order: 1, step_name: 'compress_staging_record_bsca_2026_01', step_type: 'compress', target_table: 'staging_record', target_partition: 'staging_record_bsca_2026_01', target_path: null, archive_snapshot_id: BSCA_IDS.snapshotStagingJan, status: 'success', error_message: null, retry_count: 0, input_row_count: 161432, output_row_count: 161432, input_size_bytes: 1073741824, output_size_bytes: 524288000, checksum: null, duration_seconds: 245, started_at: '2026-04-04T06:00:10Z', completed_at: '2026-04-04T06:04:15Z', created_at: '2026-04-04T06:00:10Z' },
    { id: bscaUuid(9071), job_id: BSCA_IDS.archivalJobHotToWarm, step_order: 2, step_name: 'compress_staging_record_bsca_2026_02', step_type: 'compress', target_table: 'staging_record', target_partition: 'staging_record_bsca_2026_02', target_path: null, archive_snapshot_id: BSCA_IDS.snapshotStagingFeb, status: 'success', error_message: null, retry_count: 0, input_row_count: 161432, output_row_count: 161432, input_size_bytes: 1073741824, output_size_bytes: 518144000, checksum: null, duration_seconds: 238, started_at: '2026-04-04T06:04:20Z', completed_at: '2026-04-04T06:08:18Z', created_at: '2026-04-04T06:04:20Z' },
    { id: bscaUuid(9072), job_id: BSCA_IDS.archivalJobHotToWarm, step_order: 3, step_name: 'compress_audit_event_bsca_2026_01', step_type: 'compress', target_table: 'audit_event', target_partition: 'audit_event_bsca_2026_01', target_path: null, archive_snapshot_id: BSCA_IDS.snapshotAuditJan, status: 'success', error_message: null, retry_count: 0, input_row_count: 85200, output_row_count: 85200, input_size_bytes: 268435456, output_size_bytes: 134217728, checksum: null, duration_seconds: 120, started_at: '2026-04-04T06:08:25Z', completed_at: '2026-04-04T06:10:25Z', created_at: '2026-04-04T06:08:25Z' },
    // Steps from Warm→Cold job (export + verify + drop, plus 1 skipped for legal hold)
    { id: bscaUuid(9073), job_id: BSCA_IDS.archivalJobWarmToCold, step_order: 1, step_name: 'export_staging_record_bsca_2024_01', step_type: 'export', target_table: 'staging_record', target_partition: 'staging_record_bsca_2024_01', target_path: 's3://bsca-archive/archive/BSCA/staging_record/2024/2024-01.parquet', archive_snapshot_id: BSCA_IDS.snapshotColdQ12024, status: 'success', error_message: null, retry_count: 0, input_row_count: 155000, output_row_count: 155000, input_size_bytes: 502000000, output_size_bytes: 89128960, checksum: 'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5', duration_seconds: 1800, started_at: '2026-04-01T05:05:00Z', completed_at: '2026-04-01T05:35:00Z', created_at: '2026-04-01T05:05:00Z' },
    { id: bscaUuid(9074), job_id: BSCA_IDS.archivalJobWarmToCold, step_order: 2, step_name: 'skip_legal_hold_staging_record_bsca_2025_03', step_type: 'skip', target_table: 'staging_record', target_partition: 'staging_record_bsca_2025_03', target_path: null, archive_snapshot_id: null, status: 'skipped', error_message: 'Active legal hold: OIG Investigation 2026-001 — scope covers 2025-01 to 2026-03', retry_count: 0, input_row_count: null, output_row_count: null, input_size_bytes: null, output_size_bytes: null, checksum: null, duration_seconds: 0, started_at: '2026-04-01T05:35:05Z', completed_at: '2026-04-01T05:35:05Z', created_at: '2026-04-01T05:35:05Z' },
  ],

  archival_transition_log: () => [
    { id: bscaUuid(9080), archive_snapshot_id: BSCA_IDS.snapshotStagingJan, tenant_id: BSCA_IDS.tenant, source_table: 'staging_record', from_tier: 'hot', to_tier: 'warm', action: 'compress', row_count: 161432, size_before_bytes: 1073741824, size_after_bytes: 524288000, compression_ratio: 0.49, checksum_source: null, checksum_dest: null, checksum_match: null, storage_path_from: 'staging_record_bsca_2026_01', storage_path_to: 'staging_record_bsca_2026_01', pipeline_job_id: BSCA_IDS.archivalJobHotToWarm, duration_seconds: 245, error_message: null, status: 'success', started_at: '2026-04-04T06:00:10Z', completed_at: '2026-04-04T06:04:15Z', created_at: '2026-04-04T06:04:15Z' },
    { id: bscaUuid(9081), archive_snapshot_id: BSCA_IDS.snapshotColdQ12024, tenant_id: BSCA_IDS.tenant, source_table: 'staging_record', from_tier: 'warm', to_tier: 'cold', action: 'export_parquet', row_count: 155000, size_before_bytes: 502000000, size_after_bytes: 89128960, compression_ratio: 0.18, checksum_source: 'e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6', checksum_dest: 'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5', checksum_match: true, storage_path_from: 'staging_record_bsca_2024_01', storage_path_to: 's3://bsca-archive/archive/BSCA/staging_record/2024/2024-01.parquet', pipeline_job_id: BSCA_IDS.archivalJobWarmToCold, duration_seconds: 1800, error_message: null, status: 'success', started_at: '2026-04-01T05:05:00Z', completed_at: '2026-04-01T05:35:00Z', created_at: '2026-04-01T05:35:00Z' },
    { id: bscaUuid(9082), archive_snapshot_id: BSCA_IDS.snapshotColdQ12024, tenant_id: BSCA_IDS.tenant, source_table: 'staging_record', from_tier: 'warm', to_tier: 'cold', action: 'drop_partition', row_count: 155000, size_before_bytes: 502000000, size_after_bytes: 0, compression_ratio: 0.00, checksum_source: null, checksum_dest: null, checksum_match: null, storage_path_from: 'staging_record_bsca_2024_01', storage_path_to: null, pipeline_job_id: BSCA_IDS.archivalJobWarmToCold, duration_seconds: 5, error_message: null, status: 'success', started_at: '2026-04-01T05:35:10Z', completed_at: '2026-04-01T05:35:15Z', created_at: '2026-04-01T05:35:15Z' },
  ],

  archival_lock: () => [
    { id: bscaUuid(9090), lock_key: 'scheduler', owner_id: 'archival-service-pod-1', lock_type: 'exclusive', acquired_at: '2026-04-04T06:00:00Z', expires_at: '2026-04-04T06:05:00Z', heartbeat_at: '2026-04-04T06:04:30Z', metadata: { hostname: 'archival-pod-1', pid: 12345 }, created_at: '2026-04-04T06:00:00Z' },
  ],

  restore_request: () => [
    { id: BSCA_IDS.restoreReq1, tenant_id: BSCA_IDS.tenant, source_table: 'staging_record', date_range_start: '2024-01-01', date_range_end: '2024-01-31', requested_by: 'jlynn@bsca.com', status: 'available', restored_table_name: 'restored_staging_record_' + BSCA_IDS.restoreReq1.slice(0, 8), archive_snapshot_ids: [BSCA_IDS.snapshotColdQ12024], row_count: 155000, size_bytes: 502000000, expires_at: '2026-04-11T10:00:00Z', error_message: null, created_at: '2026-04-04T10:00:00Z', completed_at: '2026-04-04T10:15:00Z', cleaned_up_at: null },
  ],

  compliance_report: () => [
    {
      id: BSCA_IDS.complianceReport202603,
      report_period_start: '2026-03-01',
      report_period_end: '2026-03-31',
      generated_at: '2026-04-01T10:15:00Z',
      generated_by: 'SYSTEM',
      report_data: {
        hot_tier: { tables: 7, partitions: 14, total_gb: 8.2 },
        warm_tier: { tables: 7, partitions: 28, total_gb: 4.1 },
        cold_tier: { tables: 3, partitions: 12, total_gb: 1.2, format: 'parquet' },
        archive_tier: { tables: 0, partitions: 0, total_gb: 0 },
        transitions_this_month: { hot_to_warm: 6, warm_to_cold: 3, purged: 0 },
        policy_adherence_pct: 100.0,
        upcoming_purges_90d: [],
        failed_operations: 0,
        integrity_pass_rate: 100.0,
      },
      tenant_summary: {
        BSCA: { hot_gb: 8.2, warm_gb: 4.1, cold_gb: 1.2, archive_gb: 0, compliance_pct: 100.0 },
      },
      legal_holds_active: 1,
      total_snapshots: 4,
      total_storage_bytes: 14495514624,
      compliance_status: 'compliant',
      notes: 'All tenants compliant. 1 active legal hold (OIG Investigation 2026-001) — no purge impact this period.',
      created_at: '2026-04-01T10:15:00Z',
    },
  ],

  integrity_check_result: () => [
    { id: BSCA_IDS.integrityCheck1, archive_snapshot_id: BSCA_IDS.snapshotColdQ12024, checked_at: '2026-03-30T06:15:00Z', check_type: 'checksum', expected_checksum: 'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5', actual_checksum: 'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5', checksum_match: true, row_count_match: true, expected_row_count: 155000, actual_row_count: 155000, sample_rows_checked: 1000, sample_rows_matched: 1000, storage_path: 's3://bsca-archive/archive/BSCA/staging_record/2024/2024-01.parquet', file_size_bytes: 89128960, duration_seconds: 45, error_message: null, status: 'passed', created_at: '2026-03-30T06:15:00Z' },
    { id: BSCA_IDS.integrityCheck2, archive_snapshot_id: BSCA_IDS.snapshotStagingJan, checked_at: '2026-03-30T06:20:00Z', check_type: 'row_count', expected_checksum: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', actual_checksum: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', checksum_match: true, row_count_match: true, expected_row_count: 161432, actual_row_count: 161432, sample_rows_checked: 0, sample_rows_matched: 0, storage_path: 'staging_record_bsca_2026_01', file_size_bytes: 524288000, duration_seconds: 12, error_message: null, status: 'passed', created_at: '2026-03-30T06:20:00Z' },
    { id: BSCA_IDS.integrityCheck3, archive_snapshot_id: BSCA_IDS.snapshotStagingFeb, checked_at: '2026-03-30T06:25:00Z', check_type: 'sample_verify', expected_checksum: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3', actual_checksum: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3', checksum_match: true, row_count_match: true, expected_row_count: 161432, actual_row_count: 161432, sample_rows_checked: 500, sample_rows_matched: 500, storage_path: 'staging_record_bsca_2026_02', file_size_bytes: 518144000, duration_seconds: 28, error_message: null, status: 'passed', created_at: '2026-03-30T06:25:00Z' },
  ],
};

export function getBscaRows(tableId) {
  const gen = GENERATORS[tableId];
  if (!gen) return [];
  return gen();
}

export function getBscaRowCount(tableId) {
  return getBscaRows(tableId).length;
}

export const BSCA_PIPELINE_NOTES = {
  client: 'Blue Shield of California (BSCA)',
  primaryLobSample: 'IMAPDHMO',
  sourceColumnsMapped: 386,
  stagingRecordRows: 100,
  cassResultRows: 100,
  providerRecordRows: 25,
  designRefs: [
    'docs/design/intake/intake-service-design-v2.md',
    'docs/design/ingestion/ingestion-service-design.md',
    'docs/design/cass/cass-station-er.puml',
    'docs/design/rules/rules-station-design.md',
    'docs/design/aep/aep-station-design.md',
    'docs/design/output/output-service-design.md',
    'docs/design/archival/archival-service-design.md',
    'uml-pipeline/src/data/designTables.js',
    'docs/schema-design-v4.md',
  ],
};
