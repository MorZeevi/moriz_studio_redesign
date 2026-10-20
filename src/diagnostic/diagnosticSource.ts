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

// This deployment's own ownership. Every admin read and mutation is pinned to
// it, and it is never taken from a request (body, query string, UTM, referrer).
// Eyal's rows share the same tables and must stay unreadable and unchangeable
// from here. The insert path never sends it: the column's DB default ('moriz')
// labels every row this app creates. Never copy this into the Eyal repo.
export const OWN_SOURCE: DiagnosticSource = 'moriz';

export const SOURCE_LABELS_HE: Record<DiagnosticSource, string> = {
  moriz: 'מוריז',
  eyal: 'אייל',
};
