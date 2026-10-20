import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  assertOwnedSession,
  approveLeadBrief,
  createDiagnosticSessionMutationRepository,
  SessionNotOwnedError,
  updateDiagnosticContactStatus,
  upsertLeadBrief,
} from './mutations.ts';
import {
  createDiagnosticQueryRepository,
  getDiagnosticAnswers,
  getDiagnosticLeadBySessionId,
  getLeadBriefBySessionId,
  getSessionResultSnapshot,
} from './queries.ts';

// An in-memory stand-in for the slice of PostgREST these helpers use. It
// applies filters for real (including embedded "relation.column" filters on an
// !inner join), so a missing or wrong source predicate shows up as a foreign
// row leaking through or a foreign row being changed.

type Row = Record<string, unknown>;
type Result = { data: unknown; error: { message: string } | null; count?: number };

const OWN = '11111111-1111-4111-8111-111111111111';
const OWN_INCOMPLETE = '11111111-1111-4111-8111-222222222222';
const FOREIGN = '22222222-2222-4222-8222-222222222222';
const SNAPSHOT = { primarySolution: 'lead_flow_system', leadTier: 'A' };

function seed(): Record<string, Row[]> {
  return {
    diagnostic_sessions: [
      { id: OWN, source: 'moriz', is_test: false, completed_at: '2026-10-01T10:00:00Z', result_snapshot: SNAPSHOT, primary_solution: 'lead_flow_system', lead_tier: 'A', utm: null },
      { id: OWN_INCOMPLETE, source: 'moriz', is_test: false, completed_at: null, result_snapshot: null, primary_solution: null, lead_tier: null, utm: null },
      { id: FOREIGN, source: 'eyal', is_test: false, completed_at: '2026-10-01T10:00:00Z', result_snapshot: SNAPSHOT, primary_solution: 'lead_flow_system', lead_tier: 'B', utm: null },
    ],
    diagnostic_answers: [
      { session_id: OWN, question_id: 'q1', answer_value: 'own-answer' },
      { session_id: FOREIGN, question_id: 'q1', answer_value: 'foreign-answer' },
    ],
    diagnostic_contacts: [
      { session_id: OWN, full_name: 'Own Lead', phone: '1', email: 'a@x.co', business_name: null, link: null, review_request: null, status: 'new', created_at: '2026-10-02T10:00:00Z' },
      { session_id: FOREIGN, full_name: 'Foreign Lead', phone: '2', email: 'b@x.co', business_name: null, link: null, review_request: null, status: 'new', created_at: '2026-10-03T10:00:00Z' },
    ],
    diagnostic_lead_briefs: [
      { session_id: OWN, evidence_md: 'own', internal_brief_md: null, client_audit_md: null, status: 'draft', created_at: 't', updated_at: 't' },
      { session_id: FOREIGN, evidence_md: 'foreign', internal_brief_md: null, client_audit_md: null, status: 'draft', created_at: 't', updated_at: 't' },
    ],
  };
}

class FakeDb {
  tables: Record<string, Row[]> = seed();
  writes: Array<{ table: string; op: string; values: Row }> = [];
  inserted: Row[] = [];
  from(table: string) {
    return new FakeQuery(this, table);
  }
  parent(table: string, row: Row): Row | undefined {
    if (table === 'diagnostic_sessions') return row;
    return this.tables.diagnostic_sessions.find((session) => session.id === row.session_id);
  }
  as(): SupabaseClient {
    return this as unknown as SupabaseClient;
  }
}

class FakeQuery implements PromiseLike<Result> {
  private filters: Array<(row: Row) => boolean> = [];
  private op: 'select' | 'update' | 'upsert' | 'insert' = 'select';
  private values: Row = {};
  private onConflict = '';
  private selecting = false;
  private embeds: string[] = [];
  private readonly db: FakeDb;
  private readonly table: string;
  constructor(db: FakeDb, table: string) {
    this.db = db;
    this.table = table;
  }

  private value(row: Row, column: string): unknown {
    const [relation, field] = column.split('.');
    if (field === undefined) return row[column];
    // "diagnostic_sessions.source": a column of the related session row.
    if (relation === 'diagnostic_sessions') return this.db.parent(this.table, row)?.[field];
    throw new Error(`unsupported embedded filter ${column}`);
  }

  select(columns?: string): this {
    this.selecting = true;
    if (columns?.includes('diagnostic_sessions!inner')) this.embeds.push('diagnostic_sessions');
    return this;
  }
  eq(column: string, expected: unknown): this {
    this.filters.push((row) => this.value(row, column) === expected);
    return this;
  }
  in(column: string, expected: unknown[]): this {
    this.filters.push((row) => expected.includes(this.value(row, column)));
    return this;
  }
  not(column: string, operator: string, expected: unknown): this {
    assert.equal(operator, 'is');
    assert.equal(expected, null);
    this.filters.push((row) => this.value(row, column) !== null);
    return this;
  }
  order(): this {
    return this;
  }
  limit(): this {
    return this;
  }
  update(values: Row): this {
    this.op = 'update';
    this.values = values;
    return this;
  }
  upsert(values: Row, options?: { onConflict?: string }): this {
    this.op = 'upsert';
    this.values = values;
    this.onConflict = options?.onConflict ?? '';
    return this;
  }
  insert(values: Row): this {
    this.op = 'insert';
    this.values = values;
    return this;
  }

  private execute(): Result {
    const rows = this.db.tables[this.table] ?? [];
    const matched = rows.filter((row) => this.filters.every((filter) => filter(row)));
    if (this.op === 'update') {
      for (const row of matched) Object.assign(row, this.values);
      if (matched.length) this.db.writes.push({ table: this.table, op: 'update', values: this.values });
      return { data: this.selecting ? matched.map((row) => ({ ...row })) : null, error: null };
    }
    if (this.op === 'upsert') {
      const existing = rows.find((row) => this.onConflict.split(',').every((key) => row[key] === this.values[key]));
      this.db.writes.push({ table: this.table, op: 'upsert', values: this.values });
      if (existing) Object.assign(existing, this.values);
      else rows.push({ ...this.values });
      return { data: [existing ?? this.values], error: null };
    }
    if (this.op === 'insert') {
      this.db.inserted.push({ ...this.values });
      // The DB default labels the row: 'moriz' unless the insert sent a source.
      const row = { id: `00000000-0000-4000-8000-${String(rows.length).padStart(12, '0')}`, source: 'moriz', started_at: 't', ...this.values };
      rows.push(row);
      return { data: [row], error: null };
    }
    const visible = this.embeds.length ? matched.filter((row) => this.db.parent(this.table, row)) : matched;
    const data = visible.map((row) => ({ ...row, diagnostic_sessions: this.db.parent(this.table, row) }));
    return { data, error: null, count: data.length };
  }

  async maybeSingle(): Promise<Result> {
    const result = this.execute();
    const list = result.data as Row[] | null;
    return { data: list?.[0] ?? null, error: null };
  }
  async single(): Promise<Result> {
    const result = this.execute();
    const list = result.data as Row[];
    return { data: list[0] ?? null, error: list[0] ? null : { message: 'no row' } };
  }
  then<T1 = Result, T2 = never>(
    onfulfilled?: ((value: Result) => T1 | PromiseLike<T1>) | null,
    onrejected?: ((reason: unknown) => T2 | PromiseLike<T2>) | null,
  ): PromiseLike<T1 | T2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }
}

// ── reads ───────────────────────────────────────────────────────────────────

test('answers: an owned session returns its answers, a foreign session returns none', async () => {
  const db = new FakeDb();
  assert.deepEqual(await getDiagnosticAnswers(OWN, db.as()), { q1: 'own-answer' });
  assert.deepEqual(await getDiagnosticAnswers(FOREIGN, db.as()), {});
});

test('snapshot: an owned session returns its snapshot, a foreign session returns null', async () => {
  const db = new FakeDb();
  assert.deepEqual(await getSessionResultSnapshot(OWN, db.as()), SNAPSHOT);
  assert.equal(await getSessionResultSnapshot(FOREIGN, db.as()), null);
});

test('lead by session: an owned lead is returned, a foreign lead is null', async () => {
  const db = new FakeDb();
  const own = await getDiagnosticLeadBySessionId(OWN, db.as());
  assert.equal(own?.fullName, 'Own Lead');
  assert.equal(own?.source, 'moriz');
  assert.equal(await getDiagnosticLeadBySessionId(FOREIGN, db.as()), null);
});

test('brief: an owned brief is returned, a foreign brief is null', async () => {
  const db = new FakeDb();
  assert.equal((await getLeadBriefBySessionId(OWN, db.as()))?.evidenceMd, 'own');
  assert.equal(await getLeadBriefBySessionId(FOREIGN, db.as()), null);
});

test('queue and test queue return only moriz-owned leads', async () => {
  const db = new FakeDb();
  db.tables.diagnostic_sessions.push({ id: '33333333-3333-4333-8333-333333333333', source: 'moriz', is_test: true, primary_solution: null, lead_tier: null, utm: null });
  db.tables.diagnostic_contacts.push({ session_id: '33333333-3333-4333-8333-333333333333', full_name: 'Own Test', phone: '3', email: '', business_name: null, link: null, review_request: null, status: 'new', created_at: 't' });
  db.tables.diagnostic_sessions.push({ id: '44444444-4444-4444-8444-444444444444', source: 'eyal', is_test: true, primary_solution: null, lead_tier: null, utm: null });
  db.tables.diagnostic_contacts.push({ session_id: '44444444-4444-4444-8444-444444444444', full_name: 'Foreign Test', phone: '4', email: '', business_name: null, link: null, review_request: null, status: 'new', created_at: 't' });
  const repository = createDiagnosticQueryRepository(db.as());

  const real = await repository.getLeadsForQueue();
  assert.deepEqual(real.map((lead) => lead.fullName), ['Own Lead']);
  const tests = await repository.getTestLeadsForQueue();
  assert.deepEqual(tests.map((lead) => lead.fullName), ['Own Test']);
});

// ── mutations ───────────────────────────────────────────────────────────────

test('classification: a foreign session is refused and left unchanged', async () => {
  const db = new FakeDb();
  const repository = createDiagnosticSessionMutationRepository(db.as());
  assert.equal(await repository.updateDiagnosticSessionClassification(FOREIGN, true), null);
  assert.equal(db.tables.diagnostic_sessions.find((s) => s.id === FOREIGN)?.is_test, false);
  assert.deepEqual(db.writes, []);
});

test('classification: an owned completed session is classified, an incomplete one is not', async () => {
  const db = new FakeDb();
  const repository = createDiagnosticSessionMutationRepository(db.as());
  assert.deepEqual(await repository.updateDiagnosticSessionClassification(OWN, true), { isTest: true });
  assert.equal(await repository.updateDiagnosticSessionClassification(OWN_INCOMPLETE, true), null);
  assert.equal(db.tables.diagnostic_sessions.find((s) => s.id === OWN_INCOMPLETE)?.is_test, false);
});

test('status: a foreign session answers session_not_found and its contact is untouched', async () => {
  const db = new FakeDb();
  assert.deepEqual(await updateDiagnosticContactStatus(FOREIGN, 'closed', db.as()), { status: 'session_not_found' });
  assert.equal(db.tables.diagnostic_contacts.find((c) => c.session_id === FOREIGN)?.status, 'new');
  assert.deepEqual(db.writes, []);
});

test('status: an owned session updates; an owned session with no contact is session_not_found', async () => {
  const db = new FakeDb();
  assert.deepEqual(await updateDiagnosticContactStatus(OWN, 'contacted', db.as()), { status: 'updated' });
  assert.equal(db.tables.diagnostic_contacts.find((c) => c.session_id === OWN)?.status, 'contacted');
  assert.deepEqual(await updateDiagnosticContactStatus(OWN_INCOMPLETE, 'contacted', db.as()), { status: 'session_not_found' });
});

test('brief upsert: a foreign session throws SessionNotOwnedError and writes nothing', async () => {
  const db = new FakeDb();
  await assert.rejects(upsertLeadBrief({ sessionId: FOREIGN, evidenceMd: 'x' }, db.as()), SessionNotOwnedError);
  assert.equal(db.tables.diagnostic_lead_briefs.find((b) => b.session_id === FOREIGN)?.evidence_md, 'foreign');
  assert.deepEqual(db.writes, []);
});

test('brief upsert: an owned session saves a draft', async () => {
  const db = new FakeDb();
  const saved = await upsertLeadBrief({ sessionId: OWN, evidenceMd: 'updated' }, db.as());
  assert.equal(saved.sessionId, OWN);
  assert.equal(db.tables.diagnostic_lead_briefs.find((b) => b.session_id === OWN)?.evidence_md, 'updated');
});

test('brief approve: a foreign session throws SessionNotOwnedError and stays a draft', async () => {
  const db = new FakeDb();
  await assert.rejects(approveLeadBrief(FOREIGN, db.as()), SessionNotOwnedError);
  assert.equal(db.tables.diagnostic_lead_briefs.find((b) => b.session_id === FOREIGN)?.status, 'draft');
  assert.deepEqual(db.writes, []);
});

test('brief approve: an owned draft is approved', async () => {
  const db = new FakeDb();
  const approved = await approveLeadBrief(OWN, db.as());
  assert.equal(approved?.status, 'approved');
});

test('assertOwnedSession accepts owned sessions only', async () => {
  const db = new FakeDb();
  await assertOwnedSession(db.as(), OWN);
  await assert.rejects(assertOwnedSession(db.as(), FOREIGN), SessionNotOwnedError);
  await assert.rejects(assertOwnedSession(db.as(), '99999999-9999-4999-8999-999999999999'), SessionNotOwnedError);
});

// ── public funnel regression: Moriz-owned sessions keep working ─────────────

test('a session the app creates never sends source, relies on the DB default, and stays fully readable', async () => {
  const db = new FakeDb();
  const repository = createDiagnosticSessionMutationRepository(db.as());

  const created = await repository.createDiagnosticSession({ utm_source: 'meta' });
  const testSession = await repository.createTestDiagnosticSession();

  assert.equal(db.inserted.length, 2);
  for (const values of db.inserted) assert.equal('source' in values, false);
  // The DB default made them moriz-owned, so every shared helper still sees them.
  await assertOwnedSession(db.as(), created.sessionId);
  await assertOwnedSession(db.as(), testSession.sessionId);
  assert.deepEqual(await getDiagnosticAnswers(created.sessionId, db.as()), {});
  assert.equal(await getSessionResultSnapshot(created.sessionId, db.as()), null);
});

test('a historical row with the migrated default source is still treated as moriz-owned', async () => {
  const db = new FakeDb();
  // Rows created before the column existed resolve to the NOT NULL DEFAULT 'moriz'.
  assert.equal(db.tables.diagnostic_sessions.find((s) => s.id === OWN)?.source, 'moriz');
  assert.deepEqual(await getSessionResultSnapshot(OWN, db.as()), SNAPSHOT);
  assert.equal((await getDiagnosticLeadBySessionId(OWN, db.as()))?.fullName, 'Own Lead');
});
