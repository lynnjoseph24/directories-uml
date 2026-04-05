/** UI phase groupings: master data → tenant configuration → pipeline execution → admin/RBAC → UI (order of impact). */
export const TABLE_LAYERS = {
  master_load: {
    name: 'Master table load',
    shortName: 'Master',
    color: '#6366f1',
    description:
      'Global reference data loaded first: ISO languages, specialties, networks, canonical fields, UDFs, CASS codes, geocode fallbacks, component templates.',
  },
  tenant_setup: {
    name: 'Tenant setup',
    shortName: 'Tenant',
    color: '#f59e0b',
    description:
      'Per-tenant configuration before a run: tenant, products, plan years, intake paths, refresh flow graph, ingestion/cleansing/CASS rules, directory rules, API clients.',
  },
  pipeline_run: {
    name: 'Pipeline run',
    shortName: 'Run',
    color: '#10b981',
    description:
      'Runtime rows for one execution: jobs, file import, ingestion, staging, CASS, quality, recon, spatial indexes, audit, API logs.',
  },
  archival: {
    name: 'Archival / Lifecycle',
    shortName: 'Archival',
    color: '#14b8a6',
    description:
      'Data lifecycle management: retention policies, partition registry, tier transitions (Hot→Warm→Cold→Archive→Purge), legal holds, compliance reports, integrity checks, and restore-on-request. Independent service — never affects main pipeline.',
  },
  admin_rbac: {
    name: 'Admin / RBAC',
    shortName: 'Admin',
    color: '#ef4444',
    description:
      'Authentication, authorization, and audit: OIDC users, roles, permissions, tenant access grants, user settings, and the global audit event log.',
  },
  ui_frontend: {
    name: 'UI / Frontend',
    shortName: 'UI',
    color: '#8b5cf6',
    description:
      'Frontend-only tables serving the React SPA: dashboard widget layouts, saved filters, notification inbox, UDF test runs, canvas editor state, search index.',
  },
};
