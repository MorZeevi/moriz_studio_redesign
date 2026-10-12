// ── P9f lead status model ────────────────────────────────────────────────────
// Pure, dependency-free module: no DB, no secret, no React. Safe to import
// from server pages (app/admin) AND the client StatusControl component.
//
// The four values below are the existing `diagnostic_contacts.status` CHECK
// constraint (see supabase/migrations) — this module never adds a fifth
// value, it only gives the existing four a central Hebrew label (CLAUDE.md
// rule 8: copy centralized). The DB column itself stays English.

export type LeadStatus = 'new' | 'in_review' | 'contacted' | 'closed';

const LEAD_STATUSES = ['new', 'in_review', 'contacted', 'closed'] as const satisfies readonly LeadStatus[];

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === 'string' && (LEAD_STATUSES as readonly string[]).includes(value);
}

export const STATUS_LABELS_HE: Record<LeadStatus, string> = {
  new: 'חדש',
  in_review: 'בבדיקה',
  contacted: 'נוצר קשר',
  closed: 'סגור',
};

// Urgency display labels: only the two attention-worthy urgency levels get a
// badge. `fresh`/`none` are deliberately absent from this map — a lookup miss
// is the signal to render no badge at all, not an error.
export const URGENCY_LABELS_HE: Record<'urgent' | 'aging', string> = {
  urgent: 'דחוף',
  aging: 'ממתין לטיפול',
};

// Urgency thresholds (§ locked product model #5): age > 72h -> urgent;
// 24h < age <= 72h -> aging; age <= 24h -> fresh. Named constants so the
// boundary values live in exactly one place.
export const URGENCY_AGING_MS = 24 * 60 * 60 * 1000;
export const URGENCY_URGENT_MS = 72 * 60 * 60 * 1000;
