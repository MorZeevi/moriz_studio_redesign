// ── P9f lead queue sort ──────────────────────────────────────────────────────
// Pure, generic sort over a minimal row shape. No Date.now() — `now` is
// always caller-supplied so a single page render pins one instant for every
// row's derived urgency (the caller passes the same `now` to sortLeadRows AND
// to every deriveUrgency/relative-time call for badges — see admin/page.tsx).
//
// Rank tables are oriented so a HIGHER number always means "more important /
// more urgent / more actionable / better grade". `dir === 'desc'` (the
// default) then uniformly means "most important first" for every column —
// desc on `created` shows newest first, desc on `urgency` shows urgent first,
// desc on `grade` shows A first, desc on `status` shows the most actionable
// (new) first. `asc` flips that. The one exception, by design, is a null
// leadTier under the `grade` key: it always sorts last, in both directions
// (an absent grade isn't "better" or "worse", it's unranked).

import type { LeadStatus } from './leadStatus.ts';
import { ACTIONABLE_STATUSES, deriveUrgency, type Urgency } from './urgency.ts';

export interface LeadSortRow {
  status: LeadStatus;
  createdAt: string;
  leadTier: 'A' | 'B' | 'C' | null;
  sessionId: string;
}

const SORT_KEYS = ['created', 'grade', 'urgency', 'status'] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export function isSortKey(value: unknown): value is SortKey {
  return typeof value === 'string' && (SORT_KEYS as readonly string[]).includes(value);
}

const SORT_DIRS = ['asc', 'desc'] as const;
export type SortDir = (typeof SORT_DIRS)[number];

export function isSortDir(value: unknown): value is SortDir {
  return typeof value === 'string' && (SORT_DIRS as readonly string[]).includes(value);
}

const GRADE_RANK: Record<'A' | 'B' | 'C', number> = { A: 2, B: 1, C: 0 };
const URGENCY_RANK: Record<Urgency, number> = { urgent: 3, aging: 2, fresh: 1, none: 0 };
// Judgment call: dispatch doesn't specify a status rank order. Chosen order
// mirrors the actionable-first philosophy used elsewhere: new > in_review >
// contacted > closed.
const STATUS_RANK: Record<LeadStatus, number> = { new: 3, in_review: 2, contacted: 1, closed: 0 };

// Deterministic, direction-independent tie-break: newest first, then
// sessionId, so two rows with an identical primary key never swap order
// between runs/renders.
function tieBreak(a: LeadSortRow, b: LeadSortRow): number {
  const byCreated = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  if (byCreated !== 0) return byCreated;
  if (a.sessionId < b.sessionId) return -1;
  if (a.sessionId > b.sessionId) return 1;
  return 0;
}

function primaryCompare(key: SortKey, a: LeadSortRow, b: LeadSortRow, now: number, dir: SortDir): number {
  switch (key) {
    case 'created': {
      const base = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return dir === 'asc' ? -base : base;
    }
    case 'urgency': {
      const base =
        URGENCY_RANK[deriveUrgency(b.createdAt, b.status, now)] - URGENCY_RANK[deriveUrgency(a.createdAt, a.status, now)];
      return dir === 'asc' ? -base : base;
    }
    case 'status': {
      const base = STATUS_RANK[b.status] - STATUS_RANK[a.status];
      return dir === 'asc' ? -base : base;
    }
    case 'grade': {
      // Null tier always last, regardless of `dir` — checked before the sign
      // flip below so direction never reaches this branch.
      if (a.leadTier === null && b.leadTier === null) return 0;
      if (a.leadTier === null) return 1;
      if (b.leadTier === null) return -1;
      const base = GRADE_RANK[b.leadTier] - GRADE_RANK[a.leadTier];
      return dir === 'asc' ? -base : base;
    }
  }
}

function compareByKey(key: SortKey, a: LeadSortRow, b: LeadSortRow, now: number, dir: SortDir): number {
  const primary = primaryCompare(key, a, b, now, dir);
  return primary !== 0 ? primary : tieBreak(a, b);
}

// Default (no explicit ?sort): actionable-first queue ordering. Actionable
// rows (new/in_review) come before worked rows (contacted/closed); within
// the actionable group, most-urgent-first then best-grade-first (null last);
// within the worked group, recency only (tieBreak) — the spec only calls out
// recency for already-worked leads.
function compareDefault(a: LeadSortRow, b: LeadSortRow, now: number): number {
  const aActionable = ACTIONABLE_STATUSES.includes(a.status);
  const bActionable = ACTIONABLE_STATUSES.includes(b.status);
  if (aActionable !== bActionable) return aActionable ? -1 : 1;

  if (aActionable) {
    const urgencyDiff =
      URGENCY_RANK[deriveUrgency(b.createdAt, b.status, now)] - URGENCY_RANK[deriveUrgency(a.createdAt, a.status, now)];
    if (urgencyDiff !== 0) return urgencyDiff;

    if (a.leadTier === null && b.leadTier !== null) return 1;
    if (a.leadTier !== null && b.leadTier === null) return -1;
    if (a.leadTier !== null && b.leadTier !== null) {
      const gradeDiff = GRADE_RANK[b.leadTier] - GRADE_RANK[a.leadTier];
      if (gradeDiff !== 0) return gradeDiff;
    }
  }

  return tieBreak(a, b);
}

export function sortLeadRows<T extends LeadSortRow>(
  rows: readonly T[],
  now: number,
  sort?: string,
  dir: SortDir = 'desc'
): T[] {
  const copy = [...rows];
  if (!isSortKey(sort)) {
    copy.sort((a, b) => compareDefault(a, b, now));
    return copy;
  }
  copy.sort((a, b) => compareByKey(sort, a, b, now, dir));
  return copy;
}
