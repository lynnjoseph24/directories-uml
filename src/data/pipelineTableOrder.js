/**
 * Pipeline phases and table order: earliest affected / dependency-first within each phase.
 * Phases: master_load → tenant_setup → pipeline_run (chronological execution).
 */

export const PHASE_KEYS = ['master_load', 'tenant_setup', 'pipeline_run', 'archival', 'admin_rbac', 'ui_frontend'];

/** @type {{ id: string, phase: 'master_load' | 'tenant_setup' | 'pipeline_run' | 'archival' | 'admin_rbac' | 'ui_frontend' }[]} */
const PIPELINE_TABLES = [
  // --- Master table load (reference / global seeds) ---
  { id: 'schema_version', phase: 'master_load' },
  { id: 'iso_language_standard', phase: 'master_load' },
  { id: 'language', phase: 'master_load' },
  { id: 'provider_specialty_type', phase: 'master_load' },
  { id: 'network_type', phase: 'master_load' },
  { id: 'enrollment_period_ref', phase: 'master_load' },
  { id: 'canonical_field', phase: 'master_load' },
  { id: 'supported_file_format', phase: 'master_load' },
  { id: 'udf_function', phase: 'master_load' },
  { id: 'cass_error_code', phase: 'master_load' },
  { id: 'geocode_fallback_ref', phase: 'master_load' },
  { id: 'component_template', phase: 'master_load' },
  { id: 'app_version', phase: 'master_load' },
  { id: 'run_status', phase: 'master_load' },

  // --- Tenant setup (configuration before a run) ---
  { id: 'tenant', phase: 'tenant_setup' },
  { id: 'tenant_config', phase: 'tenant_setup' },
  { id: 'product', phase: 'tenant_setup' },
  { id: 'plan_year', phase: 'tenant_setup' },
  { id: 'product_plan_year', phase: 'tenant_setup' },
  { id: 'aep_window', phase: 'tenant_setup' },
  { id: 'file_source', phase: 'tenant_setup' },
  { id: 'file_mask', phase: 'tenant_setup' },
  { id: 'intake_watch_path', phase: 'tenant_setup' },
  { id: 'intake_retry_config', phase: 'tenant_setup' },
  { id: 'refresh_flow', phase: 'tenant_setup' },
  { id: 'refresh_flow_station', phase: 'tenant_setup' },
  { id: 'station_connection', phase: 'tenant_setup' },
  { id: 'refresh_flow_component', phase: 'tenant_setup' },
  { id: 'ingestion_config', phase: 'tenant_setup' },
  { id: 'source_field_mapping', phase: 'tenant_setup' },
  { id: 'ingestion_field_threshold', phase: 'tenant_setup' },
  { id: 'cleansing_pipeline', phase: 'tenant_setup' },
  { id: 'cleansing_rule', phase: 'tenant_setup' },
  { id: 'cass_config', phase: 'tenant_setup' },
  { id: 'quality_rule', phase: 'tenant_setup' },
  { id: 'variable', phase: 'tenant_setup' },
  { id: 'external_service_config', phase: 'tenant_setup' },
  { id: 'language_alias', phase: 'tenant_setup' },
  { id: 'directory', phase: 'tenant_setup' },
  { id: 'chapter', phase: 'tenant_setup' },
  { id: 'chapter_translation', phase: 'tenant_setup' },
  { id: 'rule', phase: 'tenant_setup' },
  { id: 'rule_translation', phase: 'tenant_setup' },
  { id: 'book', phase: 'tenant_setup' },
  { id: 'book_translation', phase: 'tenant_setup' },
  { id: 'book_geography', phase: 'tenant_setup' },
  { id: 'book_chapter', phase: 'tenant_setup' },
  { id: 'book_enclosure', phase: 'tenant_setup' },
  { id: 'output_config', phase: 'tenant_setup' },
  { id: 'output_response_template', phase: 'tenant_setup' },
  { id: 'api_client', phase: 'tenant_setup' },
  { id: 'api_request_schema', phase: 'tenant_setup' },
  { id: 'alert_definition', phase: 'tenant_setup' },
  { id: 'alert_notification_link', phase: 'tenant_setup' },
  { id: 'notification_channel', phase: 'tenant_setup' },
  { id: 'notification_rule', phase: 'tenant_setup' },
  { id: 'station_type_registry', phase: 'tenant_setup' },
  { id: 'component_type_registry', phase: 'tenant_setup' },
  { id: 'recon_rule', phase: 'tenant_setup' },

  // --- Pipeline run (runtime — order follows station flow: intake → ingestion → … → output API) ---
  { id: 'pipeline_run', phase: 'pipeline_run' },
  { id: 'refresh_flow_run', phase: 'pipeline_run' },
  { id: 'pipeline_lock', phase: 'pipeline_run' },
  { id: 'intake_file_event', phase: 'pipeline_run' },
  { id: 'intake_job', phase: 'pipeline_run' },
  { id: 'intake_job_component_run', phase: 'pipeline_run' },
  { id: 'intake_file_move_log', phase: 'pipeline_run' },
  { id: 'intake_dedup_result', phase: 'pipeline_run' },
  { id: 'intake_corruption_check', phase: 'pipeline_run' },
  { id: 'file_fingerprint', phase: 'pipeline_run' },
  { id: 'file_import', phase: 'pipeline_run' },
  { id: 'file_quarantine', phase: 'pipeline_run' },
  { id: 'station_run', phase: 'pipeline_run' },
  { id: 'component_run', phase: 'pipeline_run' },
  { id: 'recon_checkpoint', phase: 'pipeline_run' },
  { id: 'raw_record', phase: 'pipeline_run' },
  { id: 'ingestion_run', phase: 'pipeline_run' },
  { id: 'ingestion_null_profile', phase: 'pipeline_run' },
  { id: 'staging_record', phase: 'pipeline_run' },
  { id: 'provider_record', phase: 'pipeline_run' },
  { id: 'cass_run', phase: 'pipeline_run' },
  { id: 'cass_batch', phase: 'pipeline_run' },
  { id: 'address_cache', phase: 'pipeline_run' },
  { id: 'cass_result', phase: 'pipeline_run' },
  { id: 'provider_cass_error', phase: 'pipeline_run' },
  { id: 'cass_change_log', phase: 'pipeline_run' },
  { id: 'quality_result', phase: 'pipeline_run' },
  { id: 'quality_score', phase: 'pipeline_run' },
  { id: 'recon_result', phase: 'pipeline_run' },
  { id: 'provider_spatial_index', phase: 'pipeline_run' },
  { id: 'spatial_index', phase: 'pipeline_run' },
  { id: 'rule_execution_log', phase: 'pipeline_run' },
  { id: 'plan_year_change_history', phase: 'pipeline_run' },
  { id: 'rule_change_history', phase: 'pipeline_run' },
  { id: 'audit_event', phase: 'pipeline_run' },
  { id: 'execution_log', phase: 'pipeline_run' },
  { id: 'service_call_log', phase: 'pipeline_run' },
  { id: 'circuit_breaker_state', phase: 'pipeline_run' },
  { id: 'api_request_log', phase: 'pipeline_run' },
  { id: 'idempotency_cache', phase: 'pipeline_run' },
  { id: 'rate_limit_counter', phase: 'pipeline_run' },
  { id: 'api_access_token', phase: 'pipeline_run' },
  { id: 'alert_instance', phase: 'pipeline_run' },
  { id: 'notification_log', phase: 'pipeline_run' },
  { id: 'webhook_delivery', phase: 'pipeline_run' },


  // --- Archival / Lifecycle (independent service — data tier transitions, legal holds, compliance) ---
  { id: 'retention_policy', phase: 'archival' },
  { id: 'archival_schedule', phase: 'archival' },
  { id: 'partition_registry', phase: 'archival' },
  { id: 'partition_creation_schedule', phase: 'archival' },
  { id: 'archive_snapshot', phase: 'archival' },
  { id: 'legal_hold', phase: 'archival' },
  { id: 'archival_job', phase: 'archival' },
  { id: 'archival_job_step', phase: 'archival' },
  { id: 'archival_transition_log', phase: 'archival' },
  { id: 'archival_lock', phase: 'archival' },
  { id: 'restore_request', phase: 'archival' },
  { id: 'compliance_report', phase: 'archival' },
  { id: 'integrity_check_result', phase: 'archival' },

  // --- Admin / RBAC (schema: admin — authentication, authorization, audit) ---
  { id: 'app_user', phase: 'admin_rbac' },
  { id: 'role', phase: 'admin_rbac' },
  { id: 'permission', phase: 'admin_rbac' },
  { id: 'role_permission', phase: 'admin_rbac' },
  { id: 'user_role', phase: 'admin_rbac' },
  { id: 'user_tenant_access', phase: 'admin_rbac' },
  { id: 'user_setting', phase: 'admin_rbac' },
  { id: 'admin_audit_event', phase: 'admin_rbac' },

  // --- UI / Frontend (schema: ui — browser-only tables) ---
  { id: 'dashboard_widget', phase: 'ui_frontend' },
  { id: 'saved_filter', phase: 'ui_frontend' },
  { id: 'recent_activity', phase: 'ui_frontend' },
  { id: 'notification_inbox', phase: 'ui_frontend' },
  { id: 'udf_test_run', phase: 'ui_frontend' },
  { id: 'canvas_state', phase: 'ui_frontend' },
  { id: 'search_index_cache', phase: 'ui_frontend' },
];

/** Ordered table ids (single source of truth for sidebar order). */
export const ORDERED_PIPELINE_TABLE_IDS = PIPELINE_TABLES.map((x) => x.id);

/** @type {Map<string, number>} */
export const PIPELINE_ORDER_INDEX = new Map(
  ORDERED_PIPELINE_TABLE_IDS.map((id, i) => [id, i])
);

/** @type {Map<string, 'master_load' | 'tenant_setup' | 'pipeline_run' | 'archival' | 'admin_rbac' | 'ui_frontend'>} */
export const PHASE_BY_TABLE_ID = new Map(PIPELINE_TABLES.map((x) => [x.id, x.phase]));
