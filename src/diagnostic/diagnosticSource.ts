// ── Diagnostic source (Milestone 2) ─────────────────────────────────────────
// Product-level provenance: which diagnostic deployment (app/brand) a session
// belongs to. Set once at session creation (src/diagnostic/db/mutations.ts)
// and never changed after — unlike is_test, there is no reclassify path.
// Pure, dependency-free module: no DB, no secret, no React.

export type DiagnosticSource = 'moriz' | 'eyal';

const DIAGNOSTIC_SOURCES = ['moriz', 'eyal'] as const satisfies readonly DiagnosticSource[];

export function isDiagnosticSource(value: unknown): value is DiagnosticSource {
  return typeof value === 'string' && (DIAGNOSTIC_SOURCES as readonly string[]).includes(value);
}

// Admin queue filter: the two real sources, or 'all' to see both pooled
// together. Distinct from DiagnosticSource because 'all' is never a value
// stored on a row — it only ever describes a query.
export type LeadSourceFilter = DiagnosticSource | 'all';

const LEAD_SOURCE_FILTERS = ['moriz', 'eyal', 'all'] as const satisfies readonly LeadSourceFilter[];

export function isLeadSourceFilter(value: unknown): value is LeadSourceFilter {
  return typeof value === 'string' && (LEAD_SOURCE_FILTERS as readonly string[]).includes(value);
}

export const SOURCE_LABELS_HE: Record<DiagnosticSource, string> = {
  moriz: 'מוריז',
  eyal: 'אייל',
};
