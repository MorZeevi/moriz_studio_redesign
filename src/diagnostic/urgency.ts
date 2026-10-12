// ── P9f urgency derivation ───────────────────────────────────────────────────
// Pure. No Date.now() here — `now` is always a caller-supplied number so a
// single page render (and every test) can pin one instant for every lead.

import type { LeadStatus } from './leadStatus.ts';
import { URGENCY_AGING_MS, URGENCY_URGENT_MS } from './leadStatus.ts';

export type Urgency = 'urgent' | 'aging' | 'fresh' | 'none';

// Only unworked leads accrue urgency. Once someone has acted on a lead
// (contacted/closed), the clock stops mattering — it never shows as urgent.
// Exported so leadSort.ts shares this exact list (single source of truth for
// "what counts as actionable") instead of redefining it.
export const ACTIONABLE_STATUSES: readonly LeadStatus[] = ['new', 'in_review'];

export function deriveUrgency(createdAtIso: string, status: LeadStatus, now: number): Urgency {
  if (!ACTIONABLE_STATUSES.includes(status)) {
    return 'none';
  }

  const age = now - new Date(createdAtIso).getTime();
  if (age > URGENCY_URGENT_MS) return 'urgent';
  if (age > URGENCY_AGING_MS) return 'aging';
  return 'fresh';
}
