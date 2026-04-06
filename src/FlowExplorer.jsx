import { useState, useMemo } from 'react';
import { getTableById } from './data/tables';
import { getBscaRows } from './data/bscaPipelineData';
import './FlowExplorer.css';

/* ────────────────────────────────────────────────────────────
   Flow step data — one array per flow, each step has:
     label, subtitle, tables[], description, api/json snippets
   ──────────────────────────────────────────────────────────── */

const COLORS = {
  intake: '#3b82f6',
  ingestion: '#f59e0b',
  cleansing: '#f97316',
  cass: '#10b981',
  spatial: '#8b5cf6',
  auth: '#6366f1',
  validate: '#14b8a6',
  language: '#ec4899',
  chapter: '#f59e0b',
  rule: '#ef4444',
  ckdtree: '#8b5cf6',
  provider: '#10b981',
  enclosure: '#06b6d4',
  format: '#64748b',
  audit: '#475569',
  book: '#3b82f6',
};

/* ═══════════════════════════════════════════════════════════════
   FLOW 1: REFRESH PIPELINE
   ═══════════════════════════════════════════════════════════════ */
const REFRESH_STEPS = [
  {
    id: 'file_drop',
    label: 'File Drop',
    subtitle: 'Operator drops file on network share',
    color: COLORS.intake,
    icon: '📁',
    tables: [
      { name: 'file_source', op: 'CONFIG', rows: '1 (IMAPDHMO source)' },
    ],
    description: 'BSCA drops RdIMAPDHMORaw.txt (386 columns, pipe-delimited, ~359MB) onto \\\\odsbscastoragedev\\',
    detail: 'File sits on UNC share until watcher picks it up.',
  },
  {
    id: 'file_watcher',
    label: 'File Watcher Detects',
    subtitle: 'Always-running daemon polls watch path',
    color: COLORS.intake,
    icon: '👁',
    tables: [
      { name: 'intake_watch_path', op: 'READ', rows: '1 (\\\\odsbscastoragedev\\...\\RdIMAPDHMORaw\\)' },
      { name: 'intake_file_event', op: 'WRITE', rows: '1 (status: detected)' },
    ],
    description: 'FileWatcherService polls the configured watch_path every 30 seconds. Stability check waits 5s to confirm write is complete. Creates intake_file_event row.',
    detail: 'READ intake_watch_path → match file pattern\nWRITE intake_file_event → status: detected',
  },
  {
    id: 'intake_job',
    label: 'Intake Job Created',
    subtitle: 'File claimed by worker pool',
    color: COLORS.intake,
    icon: '⚙️',
    tables: [
      { name: 'intake_job', op: 'WRITE', rows: '1 (status: CREATED)' },
      { name: 'refresh_flow', op: 'READ', rows: '1 (BSCA Radius Directory Refresh v3)' },
      { name: 'refresh_flow_station', op: 'READ', rows: '7 (FILE_BRIDGE → INGESTION → ... → OUTPUT)' },
    ],
    description: 'Worker claims the file via lease-based lock. Job linked to refresh_flow blueprint.',
    detail: 'WRITE intake_job → status: CREATED\nREAD refresh_flow → load pipeline blueprint\nREAD refresh_flow_station → load FILE_BRIDGE config',
  },
  {
    id: 'file_move',
    label: 'File Copy + Delete',
    subtitle: 'Move from drop zone to app directory',
    color: COLORS.intake,
    icon: '📋',
    tables: [
      { name: 'intake_file_move_log', op: 'WRITE', rows: '1 (359MB, checksums verified)' },
    ],
    description: 'Copy file to organized path: /{tenant}/{product}/{plan_year}/{filename}_{job_id}.txt. Verify size match. Delete source.',
    detail: 'WRITE intake_file_move_log → source_path, dest_path, checksums',
  },
  {
    id: 'dedup',
    label: 'Deduplication Check',
    subtitle: 'Name-based + hash-based dual check',
    color: COLORS.intake,
    icon: '🔍',
    tables: [
      { name: 'file_fingerprint', op: 'READ', rows: '0 matches (new file)' },
      { name: 'intake_dedup_result', op: 'WRITE', rows: '1 (verdict: NEW_FILE)' },
      { name: 'file_fingerprint', op: 'WRITE', rows: '1 (xxHash64 + SHA-256 stored)' },
    ],
    description: 'Phase 1: Reject if filename pattern matches prior intake. Phase 2: xxHash64 fast path + SHA-256 confirmation.',
    detail: 'READ file_fingerprint → check for hash match\nWRITE intake_dedup_result → verdict: NEW_FILE\nWRITE file_fingerprint → store hashes',
  },
  {
    id: 'corruption',
    label: 'Corruption Check',
    subtitle: 'Read sample rows to verify readability',
    color: COLORS.intake,
    icon: '🛡',
    tables: [
      { name: 'intake_corruption_check', op: 'WRITE', rows: '1 (10 rows sampled, is_corrupt: false, encoding: CP1252)' },
    ],
    description: 'Read 10 sample rows. Verify encoding, column count, parsability. Detect truncation or binary content.',
    detail: 'WRITE intake_corruption_check → rows_sampled: 10, is_corrupt: false\n  detected_encoding: CP1252 (via encoding_override)',
  },
  {
    id: 'format_parse',
    label: 'Format Detection + Streaming Parse',
    subtitle: 'Auto-detect format, stream all rows',
    color: COLORS.intake,
    icon: '📊',
    tables: [
      { name: 'file_import', op: 'WRITE', rows: '1 (row_count: 145,376, status: imported)' },
      { name: 'intake_job', op: 'UPDATE', rows: '1 (status: PARSED)' },
    ],
    description: 'Detect pipe-delimited, 386 columns, CP1252 encoding from 64KB sample. Stream all 145,376 rows. Never load full file to memory (peak 10-20MB).',
    detail: 'WRITE file_import → row_count: 145376, status: imported\nUPDATE intake_job → status: PARSED',
  },
  {
    id: 'ingestion',
    label: 'Ingestion Station',
    subtitle: 'Raw → Canonical mapping + NULL profiling',
    color: COLORS.ingestion,
    icon: '🔄',
    tables: [
      { name: 'source_field_mapping', op: 'READ', rows: '386 mappings (386 raw → 80 canonical)' },
      { name: 'ingestion_field_threshold', op: 'READ', rows: '8 thresholds (PROV_NPI ≤5%, SITE_ADDR1 ≤1%, ...)' },
      { name: 'raw_record', op: 'WRITE', rows: '145,376 (immutable audit copy, all 386 columns as JSONB)' },
      { name: 'staging_record', op: 'WRITE', rows: '145,376 (stage: mapped, 80 canonical fields)' },
      { name: 'ingestion_run', op: 'WRITE', rows: '1 (statistics: 145,376 in, 0 rejected)' },
      { name: 'ingestion_null_profile', op: 'WRITE', rows: '80 (one per canonical field with NULL %)' },
    ],
    description: 'Map 386 raw columns → 80 canonical fields via source_field_mapping. Consolidate repeating groups (25 language columns → JSON array, 14 schedule fields → hours JSON). Profile NULL rates. Store immutable raw_record + working staging_record.',
    detail: 'READ source_field_mapping → 386 → 80 column mapping\nREAD ingestion_field_threshold → NULL thresholds\nWRITE raw_record → 145,376 rows (immutable audit copy)\nWRITE staging_record → 145,376 rows (stage: mapped)\nWRITE ingestion_run → statistics\nWRITE ingestion_null_profile → per-field NULL %',
  },
  {
    id: 'cleansing',
    label: 'Cleansing Station',
    subtitle: 'UDF pipeline transforms (TRIM, ProperCase, NPI validate...)',
    color: COLORS.cleansing,
    icon: '✨',
    tables: [
      { name: 'cleansing_pipeline', op: 'READ', rows: '1 (IMAPDHMO DAG pipeline definition)' },
      { name: 'cleansing_rule', op: 'READ', rows: '63 rules (one per field × UDF chain)' },
      { name: 'variable', op: 'READ', rows: '3 ($acronyms, $phoneFormat, $degreeList)' },
      { name: 'staging_record', op: 'UPDATE', rows: '145,376 (stage: mapped → cleansed)' },
    ],
    description: 'Execute visual DAG pipeline: 28+ UDF functions across 63 columns. TRIM → PROPER_CASE for names, NPI_VALIDATE for NPIs, PHONE_FORMAT for phones, ZIP_FORMAT for ZIPs. Per-field audit logging. Dead letter queue for failures.',
    detail: 'READ cleansing_pipeline → load DAG definition\nREAD variable → resolve $acronyms, $phoneFormat\nREAD cleansing_rule → field → UDF chain\nUPDATE staging_record → stage: mapped → cleansed\n  (canonical_data transformed, quality_flags set)',
  },
  {
    id: 'cass',
    label: 'CASS / Address Standardization',
    subtitle: 'BCC Architect geocoding + 3-tier fallback',
    color: COLORS.cass,
    icon: '📍',
    tables: [
      { name: 'cass_config', op: 'READ', rows: '1 (batch_size: 5000, cache_ttl: 90d)' },
      { name: 'address_cache', op: 'READ', rows: '~100K (60-70% hit ratio on repeat addresses)' },
      { name: 'cass_run', op: 'WRITE', rows: '1 (station execution record)' },
      { name: 'cass_batch', op: 'WRITE', rows: '29 batches (145,376 ÷ 5,000)' },
      { name: 'cass_result', op: 'WRITE', rows: '145,376 (lat, lon, error_code per provider)' },
      { name: 'geocode_fallback_ref', op: 'READ', rows: '~3,200 ZIP centroids (fallback for CASS failures)' },
      { name: 'staging_record', op: 'UPDATE', rows: '145,376 (stage: cleansed → cass_verified)' },
    ],
    description: 'Send addresses to BCC Architect SDK for USPS CASS standardization and geocoding. Extract lat/lon + error code. 3-tier fallback for failures: ZIP centroid → City+State → County. 90-day SHA-256 address cache avoids redundant calls.',
    detail: 'READ cass_config → batch_size: 5000, cache_ttl: 90 days\nREAD address_cache → 60-70% hit ratio\nWRITE cass_batch → batch tracking\nWRITE cass_result → lat, lon, error_code per provider\nREAD geocode_fallback_ref → ZIP/City/County centroids\nUPDATE staging_record → stage: cleansed → cass_verified\n  (latitude, longitude, cass_error_code applied)',
  },
  {
    id: 'spatial_build',
    label: 'Spatial Index Built',
    subtitle: 'CKDTree from approved provider geocodes',
    color: COLORS.spatial,
    icon: '🌐',
    tables: [
      { name: 'staging_record', op: 'READ', rows: '145,376 (all providers with lat/lon)' },
      { name: 'provider_spatial_index', op: 'WRITE', rows: '1 (status: active, 145K points, 48ms build)' },
    ],
    description: 'Build scipy CKDTree from all geocoded providers (lat/lon → 3D Cartesian). ~50ms build time for 145K providers. Index serialized to disk. Status set to "active".',
    detail: 'READ staging_record → all providers with lat/lon\nWRITE provider_spatial_index → status: active\n  provider_count: 145376, build_time_ms: 48',
  },
  {
    id: 'ready',
    label: 'Ready for API Requests',
    subtitle: 'Cleansed data + spatial index = serving',
    color: '#22c55e',
    icon: '✅',
    tables: [
      { name: 'staging_record', op: 'READY', rows: '145,376 rows (cleansed + geocoded)' },
      { name: 'provider_spatial_index', op: 'READY', rows: '1 active CKDTree (145K points)' },
      { name: 'rule', op: 'READY', rows: '847 rules awaiting on-demand evaluation' },
      { name: 'chapter', op: 'READY', rows: '6 chapters with 72 translations' },
    ],
    description: 'Pipeline complete. Provider data sits in staging_record (cleansed, geocoded). CKDTree spatial index is active. Rules are applied on-demand when API requests arrive — no pre-computation.',
    detail: 'staging_record: 145,376 rows (stage: cass_verified)\nprovider_spatial_index: active (145K providers)\nRules: 847 rules ready for on-demand evaluation\nChapters: 6 chapters with 72 translations',
  },
];

/* ═══════════════════════════════════════════════════════════════
   FLOW 2: RADIUS QUERY
   ═══════════════════════════════════════════════════════════════ */
const RADIUS_STEPS = [
  {
    id: 'api_request',
    label: 'API Request Arrives',
    subtitle: 'POST /directories/{dir_id}/radius-query',
    color: COLORS.auth,
    icon: '📨',
    tables: [
      { name: 'rate_limit_counter', op: 'CHECK', rows: '1 (vendor-tno: 12/60 this minute)' },
    ],
    description: 'Vendor system (TNO, member portal, mobile app) sends radius query with member location.',
    json: `POST /api/v1/tenants/bsca/directories/{dir_id}/radius-query
Authorization: Bearer <jwt>

{
  "plan_year": 2026,
  "latitude": 34.0522,
  "longitude": -118.2437,
  "member_template": "IMAPDHMO0504_1_3_5",
  "language_code": "KO01"
}`,
  },
  {
    id: 'auth',
    label: 'Authentication',
    subtitle: 'JWT validation + tenant scoping',
    color: COLORS.auth,
    icon: '🔐',
    tables: [
      { name: 'api_access_token', op: 'READ', rows: '1 (verify token_hash not revoked)' },
      { name: 'api_client', op: 'READ', rows: '1 (tenant=bsca, scope=directory:read)' },
    ],
    description: 'Validate JWT signature, check not expired/revoked. Extract tenant_id, plan_years[], scopes[] from claims.',
    detail: 'READ api_access_token → verify token_hash not revoked\nREAD api_client → confirm tenant=bsca, scope=directory:read',
  },
  {
    id: 'validate',
    label: 'Request Validation',
    subtitle: 'Params + approval status check',
    color: COLORS.validate,
    icon: '✓',
    tables: [
      { name: 'directory', op: 'READ', rows: '1 (IMAPDHMO, query_set confirmed)' },
      { name: 'pipeline_run', op: 'READ', rows: '1 (status: APPROVED, refresh 2026-04-01)' },
    ],
    description: 'Validate coordinates (-90 to 90, -180 to 180), plan_year in allowed range, member_template not empty. Fresh DB query confirms an approved refresh exists.',
    detail: 'READ directory → confirm dir_id exists, is_active\nREAD pipeline_run → WHERE status = APPROVED\n  AND product_plan_year matches → confirmed',
  },
  {
    id: 'language_route',
    label: 'Language Routing',
    subtitle: 'Resolve chapter label language + enclosure language',
    color: COLORS.language,
    icon: '🌍',
    tables: [
      { name: 'language_routing_rule', op: 'READ', rows: '1 (KO01 → bilingual, labels: EN01SP01)' },
    ],
    description: 'Lookup product + language_code → routing_type. For IMAPDHMO + KO01: routing_type = "bilingual", chapter labels in EN01+SP01, enclosures in EN01SP01.',
    detail: 'READ language_routing_rule\n  WHERE product_plan_year = IMAPDHMO×2026\n    AND member_language_code = KO01\n  → routing_type: bilingual\n  → chapter_label_language: EN01SP01\n  → enclosure_language_code: EN01SP01',
  },
  {
    id: 'load_chapters',
    label: 'Load Chapters + Translations',
    subtitle: 'All chapters for this directory with labels',
    color: COLORS.chapter,
    icon: '📑',
    tables: [
      { name: 'chapter', op: 'READ', rows: '6 (MPCP, MSPC, MHOSPITAL, MUC, MMH, MSNF)' },
      { name: 'chapter_translation', op: 'READ', rows: '12 (6 chapters × EN01 + SP01 bilingual)' },
    ],
    description: 'Load all 6 IMAPDHMO chapters. Because routing_type = bilingual, load both EN01 and SP01 labels.',
    detail: 'READ chapter → 6 rows (MPCP, MSPC, MHOSPITAL, MUC, MMH, MSNF)\nREAD chapter_translation\n  → MPCP: "Primary Care Providers / Proveedores de atención primaria"\n  → MSPC: "Specialists / Especialistas"\n  → ... (6 × 2 languages = 12 lookups)',
  },
  {
    id: 'filter_rules',
    label: 'Filter Rules by Member Template',
    subtitle: 'member_filter narrows 847 rules → ~170',
    color: COLORS.rule,
    icon: '🎯',
    tables: [
      { name: 'rule', op: 'READ', rows: '847 total → 169 match template IMAPDHMO0504_1_3_5' },
    ],
    description: 'Load all rules for the directory. Evaluate member_filter against member_template = "IMAPDHMO0504_1_3_5". Only matching rules fire.',
    detail: 'READ rule → 847 rules for IMAPDHMO directory\nEVALUATE member_filter for each:\n  Rule 7200: member_filter = IMAPDHMO0504_1_3_5 ✓ MATCH\n  Rule 7000: member_filter = GMAPDHMO ✗ SKIP\n  Rule 7500: member_filter = IMAPDHMO5928_1 ✗ SKIP\n  → ~170 rules match this template',
  },
  {
    id: 'ckdtree_query',
    label: 'CKDTree Spatial Query',
    subtitle: 'Nearest providers from member location',
    color: COLORS.ckdtree,
    icon: '📐',
    tables: [
      { name: 'provider_spatial_index', op: 'READ', rows: '1 (active CKDTree, 145K providers, ~0.8ms query)' },
    ],
    description: 'For each matching rule: CKDTree query_ball_point from member lat/lon within rule max_distance. Apply provider_filter (specialty + network). Sort by distance. Take TopN.',
    detail: 'READ provider_spatial_index → load active CKDTree\n\nFor each chapter (6):\n  For each matching rule:\n    query_ball_point(34.0522, -118.2437, radius=50mi)\n    → 3,200 candidates within 50 miles\n    EVALUATE provider_filter:\n      PCP + Network 1,3,5 → 180 match\n    Sort by distance ascending\n    Take top 150 → providers for this rule\n\nSpatial query: ~0.8ms total',
  },
  {
    id: 'load_providers',
    label: 'Load Provider Data',
    subtitle: 'Canonical data for matched providers',
    color: COLORS.provider,
    icon: '👨‍⚕️',
    tables: [
      { name: 'staging_record', op: 'READ', rows: '~150 providers (canonical_data JSONB for matched IDs)' },
    ],
    description: 'Load canonical_data from staging_record for all matched provider IDs. NPI, name, degree, address, phone, hours, languages, etc.',
    detail: 'READ staging_record → canonical_data for ~150 matched providers\n  NPI, last_name, first_name, degree, specialty,\n  site_name, address, city, state, zip, phone,\n  hours, languages, board_certified, telehealth,\n  accepting_new_patients, gender, accessibility',
  },
  {
    id: 'enclosures',
    label: 'Load Enclosures',
    subtitle: 'NDN/MLI PDFs in resolved language',
    color: COLORS.enclosure,
    icon: '📎',
    tables: [
      { name: 'book_enclosure', op: 'READ', rows: '2 (NDN + Medicare_MLI in EN01SP01)' },
    ],
    description: 'If include_enclosures=true: filter enclosures by language_code from routing rule (EN01SP01 for bilingual).',
    detail: 'READ book_enclosure\n  WHERE language_code = EN01SP01\n  → NDN: CMS_MAPD_NDN_EN01SP01.pdf\n  → Medicare_MLI: CMS_MAPD_MLI_EN01SP01.pdf',
  },
  {
    id: 'format_response',
    label: 'Format + Audit + Respond',
    subtitle: 'JSON response → audit log → send',
    color: COLORS.audit,
    icon: '📤',
    tables: [
      { name: 'rule_execution_log', op: 'WRITE', rows: '6 (one per chapter evaluated)' },
      { name: 'api_request_log', op: 'WRITE', rows: '1 (full request + response body, HIPAA)' },
    ],
    description: 'Format response as JSON (chapters → providers sorted by distance). Log full request + response bodies for HIPAA audit. Send to client.',
    detail: 'WRITE rule_execution_log → 6 rows (one per chapter)\n  candidates_found, providers_returned, spatial_query_ms\nWRITE api_request_log → 1 row\n  full request body + full response body (JSONB)\n  processing_time_ms: 18, providers_returned: 150\n\nResponse: 200 OK (18ms)',
  },
];

/* ═══════════════════════════════════════════════════════════════
   FLOW 3: FULL DIRECTORY
   ═══════════════════════════════════════════════════════════════ */
const FULL_DIR_STEPS = [
  {
    id: 'api_request',
    label: 'API Request Arrives',
    subtitle: 'POST /directories/{dir_id}/full-directory',
    color: COLORS.auth,
    icon: '📨',
    tables: [
      { name: 'rate_limit_counter', op: 'CHECK', rows: '1 (vendor-tno: 13/60 this minute)' },
    ],
    description: 'Request for all providers in a geographic book region.',
    json: `POST /api/v1/tenants/bsca/directories/{dir_id}/full-directory
Authorization: Bearer <jwt>

{
  "plan_year": 2026,
  "book_code": "MRH0504-02",
  "language_code": "KO01"
}`,
  },
  {
    id: 'auth',
    label: 'Authentication',
    subtitle: 'JWT validation + tenant scoping',
    color: COLORS.auth,
    icon: '🔐',
    tables: [
      { name: 'api_access_token', op: 'READ', rows: '1 (token valid, not revoked)' },
      { name: 'api_client', op: 'READ', rows: '1 (tenant=bsca confirmed)' },
    ],
    description: 'Same as radius — validate JWT, extract tenant scope.',
    detail: 'READ api_access_token → verify token_hash\nREAD api_client → confirm tenant=bsca',
  },
  {
    id: 'validate',
    label: 'Request Validation',
    subtitle: 'Params + approval status',
    color: COLORS.validate,
    icon: '✓',
    tables: [
      { name: 'directory', op: 'READ', rows: '1 (IMAPDHMO directory confirmed)' },
      { name: 'pipeline_run', op: 'READ', rows: '1 (status: APPROVED)' },
    ],
    description: 'Validate book_code exists, plan_year approved.',
    detail: 'READ directory → confirm exists, is_active\nREAD pipeline_run → WHERE status = APPROVED',
  },
  {
    id: 'book_lookup',
    label: 'Book Lookup',
    subtitle: 'Resolve geographic center + radius',
    color: COLORS.book,
    icon: '📖',
    tables: [
      { name: 'book', op: 'READ', rows: '1 (MRH0504-02: center 33.634/-117.857, radius 25mi)' },
      { name: 'book_translation', op: 'READ', rows: '2 ("Orange County" + "Condado de Orange")' },
    ],
    description: 'Book defines the search geography. MRH0504-02 = Orange County center (33.634, -117.857), radius 25 miles. No language on the book — purely geographic.',
    detail: 'READ book WHERE book_code = MRH0504-02\n  → center_lat: 33.634, center_lon: -117.857\n  → radius_miles: 25\n  → region: "Orange County"\n\nREAD book_translation\n  → "Orange County / Condado de Orange" (bilingual)',
  },
  {
    id: 'book_chapters',
    label: 'Load Book Chapters',
    subtitle: 'Which chapters are in this book',
    color: COLORS.chapter,
    icon: '📑',
    tables: [
      { name: 'book_chapter', op: 'READ', rows: '6 (this book has all 6 IMAPDHMO chapters)' },
      { name: 'chapter', op: 'READ', rows: '6 (MPCP, MSPC, MHOSPITAL, MUC, MMH, MSNF)' },
    ],
    description: 'Not every book has every chapter. A dental book only has MDENTHMO. This IMAPDHMO book has all 6 chapters.',
    detail: 'READ book_chapter WHERE book_id = MRH0504-02\n  → MPCP, MSPC, MHOSPITAL, MUC, MMH, MSNF (all 6)\n\nREAD chapter → load ordinal, description for each',
  },
  {
    id: 'language_route',
    label: 'Language Routing',
    subtitle: 'Same lookup as radius — unified',
    color: COLORS.language,
    icon: '🌍',
    tables: [
      { name: 'language_routing_rule', op: 'READ', rows: '1 (KO01 → bilingual, same as radius)' },
    ],
    description: 'Same table, same logic as radius. IMAPDHMO + KO01 → bilingual, EN01+SP01 labels, EN01SP01 enclosures.',
    detail: 'READ language_routing_rule\n  WHERE product_plan_year = IMAPDHMO×2026\n    AND member_language_code = KO01\n  → routing_type: bilingual\n  → chapter_label_language: EN01SP01\n\nSAME result as radius query.\nLanguage is always resolved at request time.',
  },
  {
    id: 'chapter_labels',
    label: 'Chapter Translations',
    subtitle: 'Labels in resolved language',
    color: COLORS.chapter,
    icon: '🏷',
    tables: [
      { name: 'chapter_translation', op: 'READ', rows: '12 (6 chapters × EN01 + SP01)' },
    ],
    description: 'Load bilingual EN01+SP01 labels for each chapter.',
    detail: 'READ chapter_translation\n  → MPCP: "Primary Care Providers /\n          Proveedores de atención primaria"\n  → MSPC: "Specialists / Especialistas"\n  → ...',
  },
  {
    id: 'rules_eval',
    label: 'Evaluate Rules (provider_filter only)',
    subtitle: 'member_filter SKIPPED — all rules fire',
    color: COLORS.rule,
    icon: '🎯',
    tables: [
      { name: 'rule', op: 'READ', rows: '847 (ALL rules fire — member_filter IGNORED)' },
    ],
    description: 'Load all rules for each chapter. member_filter is IGNORED (full directory is not member-specific). provider_count is IGNORED (return ALL). max_distance is IGNORED (book radius used instead). Only provider_filter is evaluated.',
    detail: 'READ rule → all rules for 6 chapters\n\nDIFFERENCES FROM RADIUS:\n  ✗ member_filter → IGNORED (all rules fire)\n  ✗ provider_count → IGNORED (return ALL)\n  ✗ max_distance → IGNORED (book.radius = 25mi)\n  ✓ provider_filter → APPLIED\n      PCP + Network codes, Specialist codes, etc.',
  },
  {
    id: 'ckdtree_query',
    label: 'CKDTree Ball Query',
    subtitle: 'ALL providers within book radius — not TopN',
    color: COLORS.ckdtree,
    icon: '📐',
    tables: [
      { name: 'provider_spatial_index', op: 'READ', rows: '1 (ball query from book center, ~0.5ms)' },
    ],
    description: 'CKDTree query from BOOK CENTER (not member location) within BOOK RADIUS. Return ALL matching providers, sorted alphabetically.',
    detail: 'READ provider_spatial_index → load active CKDTree\n\nquery_ball_point(33.634, -117.857, radius=25mi)\n  ← BOOK center, not member location\n  → 1,800 providers within 25 miles\n\nFor each chapter:\n  EVALUATE provider_filter → matching providers\n  Sort alphabetically (city → last_name)\n  Return ALL (no TopN limit)\n\nSpatial query: ~0.5ms',
  },
  {
    id: 'load_providers',
    label: 'Load ALL Provider Data',
    subtitle: 'Every matched provider — could be thousands',
    color: COLORS.provider,
    icon: '👨‍⚕️',
    tables: [
      { name: 'staging_record', op: 'READ', rows: '~1,800 providers (ALL within 25mi of Orange County)' },
    ],
    description: 'Load canonical_data for ALL matched providers (not TopN). Full directory can return hundreds or thousands per chapter.',
    detail: 'READ staging_record → canonical_data for ~1,800 providers\n  (vs. ~150 for radius — much larger response)\n\nPagination recommended: page_size=500',
  },
  {
    id: 'enclosures',
    label: 'Load Enclosures + Footers',
    subtitle: 'NDN/MLI PDFs + footer text',
    color: COLORS.enclosure,
    icon: '📎',
    tables: [
      { name: 'book_enclosure', op: 'READ', rows: '2 (NDN + Medicare_MLI in EN01SP01)' },
    ],
    description: 'Enclosures default to included for full directory. Filter by enclosure_language_code from routing rule.',
    detail: 'READ book_enclosure\n  WHERE language_code = EN01SP01\n  → NDN: CMS_MAPD_NDN_EN01SP01.pdf\n  → Medicare_MLI: CMS_MAPD_MLI_EN01SP01.pdf',
  },
  {
    id: 'format_response',
    label: 'Format + Audit + Respond',
    subtitle: 'JSON response → audit log → send',
    color: COLORS.audit,
    icon: '📤',
    tables: [
      { name: 'rule_execution_log', op: 'WRITE', rows: '6 (one per chapter)' },
      { name: 'api_request_log', op: 'WRITE', rows: '1 (full req + resp, 1,800 providers)' },
    ],
    description: 'Format response with all providers sorted alphabetically. Includes book metadata, region labels, enclosures, footers. Log for HIPAA audit.',
    detail: 'WRITE rule_execution_log → 6 rows (one per chapter)\nWRITE api_request_log → 1 row (full req + resp)\n  processing_time_ms: 1850\n  providers_returned: 1800\n\nResponse: 200 OK (1.8s)\n  (much slower than radius — more data)',
  },
];

const FLOWS = [
  { id: 'refresh', label: 'Refresh Pipeline', icon: '🔄', subtitle: 'File → Cleansed Data + Spatial Index', steps: REFRESH_STEPS },
  { id: 'radius', label: 'Radius Query', icon: '📍', subtitle: 'Nearest providers for a member location', steps: RADIUS_STEPS },
  { id: 'full', label: 'Full Directory', icon: '📖', subtitle: 'All providers in a book region', steps: FULL_DIR_STEPS },
];

/* ════════════════════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════════════════════ */
function formatCellValue(val) {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'object') return JSON.stringify(val);
  const s = String(val);
  return s.length > 80 ? s.slice(0, 77) + '…' : s;
}

function TablePreview({ tableId }) {
  const tableDef = getTableById(tableId);
  const rows = useMemo(() => getBscaRows(tableId), [tableId]);
  if (!tableDef || rows.length === 0) return <div className="flow-preview-empty">No sample data for {tableId}</div>;
  const cols = tableDef.columns?.map((c) => c.name) ?? Object.keys(rows[0] ?? {});
  const previewRows = rows.slice(0, 5);
  return (
    <div className="flow-preview-wrap">
      <div className="flow-preview-meta">
        Showing {previewRows.length} of {rows.length} sample rows from <code>{tableDef.schema ? `${tableDef.schema}.` : ''}{tableDef.name}</code>
      </div>
      <div className="flow-preview-scroll">
        <table className="flow-preview-grid">
          <thead>
            <tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {previewRows.map((row, ri) => (
              <tr key={ri}>{cols.map((c) => <td key={c} title={String(row[c] ?? '')}>{formatCellValue(row[c])}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 5 && <div className="flow-preview-more">+ {rows.length - 5} more rows</div>}
    </div>
  );
}

export default function FlowExplorer() {
  const [activeFlow, setActiveFlow] = useState('refresh');
  const [activeStep, setActiveStep] = useState(0);
  const [expandedTable, setExpandedTable] = useState(null);

  const flow = FLOWS.find((f) => f.id === activeFlow);
  const steps = flow?.steps ?? [];
  const step = steps[activeStep] ?? steps[0];

  return (
    <main className="flow-explorer">
      <header className="flow-header">
        <div>
          <p className="flow-app-badge">uml-pipeline</p>
          <h1 className="flow-title">Request & Pipeline Flows</h1>
          <p className="flow-subtitle">
            Step-by-step visualization: every table hit, every data transformation, every API request parameter.
          </p>
        </div>
      </header>

      {/* Flow selector tabs */}
      <div className="flow-tabs">
        {FLOWS.map((f) => (
          <button
            key={f.id}
            className={`flow-tab ${activeFlow === f.id ? 'active' : ''}`}
            onClick={() => { setActiveFlow(f.id); setActiveStep(0); setExpandedTable(null); }}
          >
            <span className="flow-tab-icon">{f.icon}</span>
            <span className="flow-tab-label">{f.label}</span>
            <span className="flow-tab-sub">{f.subtitle}</span>
          </button>
        ))}
      </div>

      <div className="flow-body">
        {/* Left: Step timeline */}
        <div className="flow-timeline">
          {steps.map((s, i) => (
            <button
              key={s.id}
              className={`flow-step-btn ${activeStep === i ? 'active' : ''} ${i < activeStep ? 'done' : ''}`}
              onClick={() => { setActiveStep(i); setExpandedTable(null); }}
            >
              <div className="flow-step-connector" style={{ background: i === 0 ? 'transparent' : (i <= activeStep ? s.color : '#334155') }} />
              <div className="flow-step-dot" style={{ background: i <= activeStep ? s.color : '#334155', boxShadow: activeStep === i ? `0 0 0 4px ${s.color}33` : 'none' }}>
                <span className="flow-step-icon">{s.icon}</span>
              </div>
              <div className="flow-step-text">
                <span className="flow-step-label">{s.label}</span>
                <span className="flow-step-sub">{s.subtitle}</span>
              </div>
              {s.tables.length > 0 && (
                <span className="flow-step-table-count">{s.tables.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Right: Step detail */}
        <div className="flow-detail">
          {step && (
            <>
              <div className="flow-detail-header" style={{ borderLeftColor: step.color }}>
                <span className="flow-detail-icon">{step.icon}</span>
                <div>
                  <h2>{step.label}</h2>
                  <p className="flow-detail-subtitle">{step.subtitle}</p>
                </div>
                <span className="flow-step-number">Step {activeStep + 1} of {steps.length}</span>
              </div>

              <p className="flow-detail-desc">{step.description}</p>

              {/* API request JSON */}
              {step.json && (
                <div className="flow-json-block">
                  <span className="flow-json-label">API Request</span>
                  <pre>{step.json}</pre>
                </div>
              )}

              {/* Table operations */}
              {step.tables.length > 0 && (
                <div className="flow-tables-block">
                  <span className="flow-tables-label">Tables Touched <span className="flow-tables-hint">(click a table to see sample records)</span></span>
                  <div className="flow-table-list">
                    {step.tables.map((t, i) => {
                      const key = `${t.name}-${i}`;
                      const isExpanded = expandedTable === key;
                      const hasData = getBscaRows(t.name).length > 0;
                      return (
                        <div key={key} className="flow-table-entry">
                          <div
                            className={`flow-table-row flow-table-op-${(t.op || 'READ').toLowerCase()} ${hasData ? 'clickable' : ''} ${isExpanded ? 'expanded' : ''}`}
                            onClick={() => hasData && setExpandedTable(isExpanded ? null : key)}
                          >
                            <span className="flow-table-op">{t.op || 'READ'}</span>
                            <span className="flow-table-name">{t.name}</span>
                            {hasData && <span className="flow-table-expand">{isExpanded ? '▾' : '▸'}</span>}
                            <span className="flow-table-rows">{t.rows || ''}</span>
                          </div>
                          {isExpanded && <TablePreview tableId={t.name} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Detail operations */}
              {step.detail && (
                <div className="flow-ops-block">
                  <span className="flow-ops-label">Operations</span>
                  <pre className="flow-ops-pre">{step.detail}</pre>
                </div>
              )}

              {/* Navigation */}
              <div className="flow-nav">
                <button
                  className="flow-nav-btn"
                  disabled={activeStep === 0}
                  onClick={() => { setActiveStep((s) => s - 1); setExpandedTable(null); }}
                >
                  ← Previous
                </button>
                <button
                  className="flow-nav-btn primary"
                  disabled={activeStep === steps.length - 1}
                  onClick={() => { setActiveStep((s) => s + 1); setExpandedTable(null); }}
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
