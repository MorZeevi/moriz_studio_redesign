import { test } from 'node:test';
import assert from 'node:assert/strict';

import { isSortDir, isSortKey, sortLeadRows, type LeadSortRow } from './leadSort.ts';

const NOW = new Date('2026-07-16T12:00:00.000Z').getTime();
const HOUR = 60 * 60 * 1000;

function row(overrides: Partial<LeadSortRow> & { sessionId: string }): LeadSortRow {
  return {
    status: 'new',
    createdAt: new Date(NOW - HOUR).toISOString(),
    leadTier: null,
    ...overrides,
  };
}

function ids(rows: LeadSortRow[]): string[] {
  return rows.map((r) => r.sessionId);
}

// ── guards ───────────────────────────────────────────────────────────────────

test('isSortKey accepts the four known keys and rejects everything else', () => {
  for (const k of ['created', 'grade', 'urgency', 'status']) assert.equal(isSortKey(k), true);
  for (const v of ['Created', '', 'name', 42, null, undefined]) assert.equal(isSortKey(v), false);
});

test('isSortDir accepts asc/desc and rejects everything else', () => {
  assert.equal(isSortDir('asc'), true);
  assert.equal(isSortDir('desc'), true);
  for (const v of ['ASC', '', 'up', 1, null, undefined]) assert.equal(isSortDir(v), false);
});

// ── created ──────────────────────────────────────────────────────────────────

test('sort by created: desc is newest-first, asc is oldest-first', () => {
  const rows = [
    row({ sessionId: 'a', createdAt: new Date(NOW - 3 * HOUR).toISOString() }),
    row({ sessionId: 'b', createdAt: new Date(NOW - 1 * HOUR).toISOString() }),
    row({ sessionId: 'c', createdAt: new Date(NOW - 2 * HOUR).toISOString() }),
  ];
  assert.deepEqual(ids(sortLeadRows(rows, NOW, 'created', 'desc')), ['b', 'c', 'a']);
  assert.deepEqual(ids(sortLeadRows(rows, NOW, 'created', 'asc')), ['a', 'c', 'b']);
});

// ── grade ────────────────────────────────────────────────────────────────────

test('sort by grade: desc is A-first, asc is C-first, null always last', () => {
  const rows = [
    row({ sessionId: 'nullTier', leadTier: null }),
    row({ sessionId: 'b', leadTier: 'B' }),
    row({ sessionId: 'a', leadTier: 'A' }),
    row({ sessionId: 'c', leadTier: 'C' }),
  ];
  assert.deepEqual(ids(sortLeadRows(rows, NOW, 'grade', 'desc')), ['a', 'b', 'c', 'nullTier']);
  assert.deepEqual(ids(sortLeadRows(rows, NOW, 'grade', 'asc')), ['c', 'b', 'a', 'nullTier']);
});

test('sort by grade: multiple null-tier rows among themselves fall to tie-break, never crash', () => {
  const rows = [
    row({ sessionId: 'n2', leadTier: null, createdAt: new Date(NOW - 1 * HOUR).toISOString() }),
    row({ sessionId: 'n1', leadTier: null, createdAt: new Date(NOW - 2 * HOUR).toISOString() }),
    row({ sessionId: 'a', leadTier: 'A' }),
  ];
  const desc = sortLeadRows(rows, NOW, 'grade', 'desc');
  assert.equal(desc[0].sessionId, 'a');
  assert.deepEqual(ids(desc), ['a', 'n2', 'n1']); // among nulls: tie-break is createdAt desc
});

// ── urgency ──────────────────────────────────────────────────────────────────

test('sort by urgency: desc is most-urgent-first, asc is least-urgent-first', () => {
  const rows = [
    row({ sessionId: 'fresh', status: 'new', createdAt: new Date(NOW).toISOString() }),
    row({ sessionId: 'urgent', status: 'new', createdAt: new Date(NOW - 100 * HOUR).toISOString() }),
    row({ sessionId: 'none', status: 'closed', createdAt: new Date(NOW - 100 * HOUR).toISOString() }),
    row({ sessionId: 'aging', status: 'in_review', createdAt: new Date(NOW - 48 * HOUR).toISOString() }),
  ];
  assert.deepEqual(ids(sortLeadRows(rows, NOW, 'urgency', 'desc')), ['urgent', 'aging', 'fresh', 'none']);
  assert.deepEqual(ids(sortLeadRows(rows, NOW, 'urgency', 'asc')), ['none', 'fresh', 'aging', 'urgent']);
});

// ── status ───────────────────────────────────────────────────────────────────

test('sort by status: desc is most-actionable-first (new>in_review>contacted>closed), asc reverses', () => {
  const rows = [
    row({ sessionId: 'closed', status: 'closed' }),
    row({ sessionId: 'contacted', status: 'contacted' }),
    row({ sessionId: 'new', status: 'new' }),
    row({ sessionId: 'inreview', status: 'in_review' }),
  ];
  assert.deepEqual(ids(sortLeadRows(rows, NOW, 'status', 'desc')), ['new', 'inreview', 'contacted', 'closed']);
  assert.deepEqual(ids(sortLeadRows(rows, NOW, 'status', 'asc')), ['closed', 'contacted', 'inreview', 'new']);
});

// ── tie-break ────────────────────────────────────────────────────────────────

test('tie-break: identical createdAt falls back to sessionId ascending, both directions', () => {
  const sameCreatedAt = new Date(NOW - HOUR).toISOString();
  const rows = [
    row({ sessionId: 'zzz', status: 'new', createdAt: sameCreatedAt }),
    row({ sessionId: 'aaa', status: 'new', createdAt: sameCreatedAt }),
    row({ sessionId: 'mmm', status: 'new', createdAt: sameCreatedAt }),
  ];
  assert.deepEqual(ids(sortLeadRows(rows, NOW, 'status', 'desc')), ['aaa', 'mmm', 'zzz']);
  assert.deepEqual(ids(sortLeadRows(rows, NOW, 'status', 'asc')), ['aaa', 'mmm', 'zzz']);
});

test('tie-break is stable across repeated sorts of the same input (no accidental swap)', () => {
  const sameCreatedAt = new Date(NOW - HOUR).toISOString();
  const rows = [
    row({ sessionId: 'b', createdAt: sameCreatedAt }),
    row({ sessionId: 'a', createdAt: sameCreatedAt }),
  ];
  const run1 = ids(sortLeadRows(rows, NOW, 'created', 'desc'));
  const run2 = ids(sortLeadRows(rows, NOW, 'created', 'desc'));
  assert.deepEqual(run1, ['a', 'b']);
  assert.deepEqual(run2, ['a', 'b']);
});

// ── default (no explicit sort) ───────────────────────────────────────────────

test('default: actionable statuses (new/in_review) always precede worked ones (contacted/closed)', () => {
  const rows = [
    row({ sessionId: 'closed', status: 'closed', createdAt: new Date(NOW).toISOString() }),
    row({ sessionId: 'new-old', status: 'new', createdAt: new Date(NOW - 200 * HOUR).toISOString() }),
  ];
  // closed is far newer than new-old, but actionable still wins.
  assert.deepEqual(ids(sortLeadRows(rows, NOW)), ['new-old', 'closed']);
});

test('default: within actionable rows, most-urgent-first then best-grade-first, null tier last', () => {
  const rows = [
    row({ sessionId: 'freshB', status: 'new', leadTier: 'B', createdAt: new Date(NOW).toISOString() }),
    row({ sessionId: 'urgentNull', status: 'new', leadTier: null, createdAt: new Date(NOW - 100 * HOUR).toISOString() }),
    row({ sessionId: 'urgentA', status: 'in_review', leadTier: 'A', createdAt: new Date(NOW - 100 * HOUR).toISOString() }),
  ];
  // both urgentA and urgentNull are "urgent"; A beats null (null always last within a tie).
  assert.deepEqual(ids(sortLeadRows(rows, NOW)), ['urgentA', 'urgentNull', 'freshB']);
});

test('default: within worked rows, ordering is recency only (tie-break)', () => {
  const rows = [
    row({ sessionId: 'oldClosed', status: 'closed', createdAt: new Date(NOW - 3 * HOUR).toISOString() }),
    row({ sessionId: 'newContacted', status: 'contacted', createdAt: new Date(NOW - 1 * HOUR).toISOString() }),
  ];
  assert.deepEqual(ids(sortLeadRows(rows, NOW)), ['newContacted', 'oldClosed']);
});

test('sortLeadRows never mutates the input array', () => {
  const rows = [
    row({ sessionId: 'a', createdAt: new Date(NOW - 2 * HOUR).toISOString() }),
    row({ sessionId: 'b', createdAt: new Date(NOW - 1 * HOUR).toISOString() }),
  ];
  const before = ids(rows);
  sortLeadRows(rows, NOW, 'created', 'asc');
  assert.deepEqual(ids(rows), before);
});
