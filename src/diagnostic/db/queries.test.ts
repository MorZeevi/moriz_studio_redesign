import { test } from 'node:test';
import assert from 'node:assert/strict';

import * as queries from './queries.ts';
import { mapDiagnosticContactRow, mapDiagnosticEventRow, mapLeadBriefRow } from './queries.ts';
import { buildFunnelSummary } from '../analytics-report.ts';
import type { Attribution } from '../attribution.ts';
import type { AnsweredSummary } from '../analytics.ts';

interface Row {
  event_name: string;
  session_id: string | null;
  occurred_at: string;
  attribution: Attribution | null;
  question_id: string | null;
  answer: AnsweredSummary | null;
  primary_solution: string | null;
  lead_tier: string | null;
  ai_fallback_reason: string | null;
}

interface RecordedQuery {
  source: string;
  calls: Array<{ method: string; args: unknown[] }>;
}

interface QueryResult {
  data: unknown[];
  error: Error | null;
  count: number | null;
}

class RecordingQuery implements PromiseLike<QueryResult> {
  readonly calls: RecordedQuery['calls'] = [];
  readonly source: string;
  private readonly result: QueryResult;

  constructor(source: string, result: QueryResult) {
    this.source = source;
    this.result = result;
  }

  select(...args: unknown[]): this {
    this.calls.push({ method: 'select', args });
    return this;
  }

  in(...args: unknown[]): this {
    this.calls.push({ method: 'in', args });
    return this;
  }

  eq(...args: unknown[]): this {
    this.calls.push({ method: 'eq', args });
    return this;
  }

  order(...args: unknown[]): this {
    this.calls.push({ method: 'order', args });
    return this;
  }

  limit(...args: unknown[]): this {
    this.calls.push({ method: 'limit', args });
    return this;
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.result).then(onfulfilled, onrejected);
  }
}

function recordingClient(results: QueryResult[] = []) {
  const recorded: RecordedQuery[] = [];
  return {
    recorded,
    client: {
      from(source: string) {
        const query = new RecordingQuery(
          source,
          results[recorded.length] ?? { data: [], error: null, count: 0 },
        );
        recorded.push(query);
        return query;
      },
    },
  };
}

type QueryRepository = {
  getRecentDiagnosticEvents(limit?: number): Promise<unknown[]>;
  getRecentTestDiagnosticEvents(limit?: number): Promise<unknown[]>;
  getLeadsForQueue(workedLimit?: number, source?: string): Promise<unknown[]>;
  getTestLeadsForQueue(limit?: number, source?: string): Promise<unknown[]>;
};

type QueryModuleWithSeam = typeof queries & {
  CONTACT_COLUMNS: string;
  createDiagnosticQueryRepository(client: unknown): QueryRepository;
};

function repositoryWith(client: unknown): QueryRepository {
  const moduleWithSeam = queries as unknown as QueryModuleWithSeam;
  assert.equal(typeof moduleWithSeam.createDiagnosticQueryRepository, 'function');
  return moduleWithSeam.createDiagnosticQueryRepository(client);
}

function findCall(query: RecordedQuery, method: string) {
  return query.calls.find((call) => call.method === method);
}

function findCalls(query: RecordedQuery, method: string) {
  return query.calls.filter((call) => call.method === method).map((call) => call.args);
}

function emptyRow(eventName: string, occurredAt: string): Row {
  return {
    event_name: eventName,
    session_id: null,
    occurred_at: occurredAt,
    attribution: null,
    question_id: null,
    answer: null,
    primary_solution: null,
    lead_tier: null,
    ai_fallback_reason: null,
  };
}

test('mapDiagnosticEventRow maps every non-null snake_case column to its camelCase EventReq field', () => {
  const attribution: Attribution = { landingPath: '/digital-audit', firstSeenAt: '2026-07-01T09:00:00.000Z' };
  const answer: AnsweredSummary = { type: 'single', optionId: 'generate_leads' };
  const row: Row = {
    event_name: 'question_answered',
    session_id: 'facade00-0000-4000-a000-000000000001',
    occurred_at: '2026-07-01T10:00:00.000Z',
    attribution,
    question_id: 'primary_goal',
    answer,
    primary_solution: 'lead_flow_system',
    lead_tier: 'A',
    ai_fallback_reason: 'timeout',
  };

  assert.deepEqual(mapDiagnosticEventRow(row), {
    name: 'question_answered',
    timestamp: '2026-07-01T10:00:00.000Z',
    sessionId: 'facade00-0000-4000-a000-000000000001',
    attribution,
    questionId: 'primary_goal',
    answer,
    primarySolution: 'lead_flow_system',
    leadTier: 'A',
    reason: 'timeout',
  });
});

// DB nulls must become undefined (an omitted key), not null: a key present
// with value null would still satisfy analytics-report.ts's `!== undefined`
// checks and be miscounted as present.
test('mapDiagnosticEventRow omits optional fields entirely when their column is null', () => {
  const mapped = mapDiagnosticEventRow(emptyRow('landing_view', '2026-07-01T10:00:00.000Z'));
  assert.deepEqual(mapped, { name: 'landing_view', timestamp: '2026-07-01T10:00:00.000Z' });
});

// Regression guard for the same null-handling, exercised through the real
// report path: a null session_id must not be counted as a started session.
test('a diagnostic_start row with a null session_id is not counted as a started session', () => {
  const rows = [
    emptyRow('diagnostic_start', '2026-07-01T10:00:00.000Z'),
    { ...emptyRow('diagnostic_start', '2026-07-01T10:01:00.000Z'), session_id: 'facade00-0000-4000-a000-000000000001' },
    { ...emptyRow('diagnostic_start', '2026-07-01T10:02:00.000Z'), session_id: 'facade00-0000-4000-a000-000000000002' },
  ];
  const events = rows.map(mapDiagnosticEventRow);
  assert.equal(buildFunnelSummary(events).sessionsStarted, 2);
});

test('production and test event repositories read their dedicated views', async () => {
  const fake = recordingClient();
  const repository = repositoryWith(fake.client);

  await repository.getRecentDiagnosticEvents(25);
  await repository.getRecentTestDiagnosticEvents(10);

  const productionSource = fake.recorded[0]?.source;
  const testSource = fake.recorded[1]?.source;
  assert.equal(productionSource, 'diagnostic_production_events');
  assert.equal(testSource, 'diagnostic_test_events');
  assert.deepEqual(findCall(fake.recorded[0], 'limit')?.args, [25]);
  assert.deepEqual(findCall(fake.recorded[1], 'limit')?.args, [10]);
});

test('contact selection uses an inner session join containing is_test and source', () => {
  const moduleWithSeam = queries as unknown as QueryModuleWithSeam;
  assert.equal(typeof moduleWithSeam.CONTACT_COLUMNS, 'string');
  assert.match(moduleWithSeam.CONTACT_COLUMNS, /diagnostic_sessions!inner\([^)]*is_test[^)]*source/);
});

test('default queue filters both actionable and worked queries to real, moriz-sourced sessions', async () => {
  const fake = recordingClient();
  const repository = repositoryWith(fake.client);

  await repository.getLeadsForQueue(40);

  assert.equal(fake.recorded.length, 2);
  for (const query of fake.recorded) {
    assert.deepEqual(findCalls(query, 'eq'), [
      ['diagnostic_sessions.is_test', false],
      ['diagnostic_sessions.source', 'moriz'],
    ]);
  }
  assert.deepEqual(findCall(fake.recorded[0], 'in')?.args, ['status', ['new', 'in_review']]);
  assert.deepEqual(findCall(fake.recorded[1], 'in')?.args, ['status', ['contacted', 'closed']]);
  assert.deepEqual(findCall(fake.recorded[1], 'limit')?.args, [40]);
});

test('an explicit eyal queue request filters sessions to eyal instead', async () => {
  const fake = recordingClient();
  const repository = repositoryWith(fake.client);

  await repository.getLeadsForQueue(40, 'eyal');

  for (const query of fake.recorded) {
    assert.deepEqual(findCalls(query, 'eq'), [
      ['diagnostic_sessions.is_test', false],
      ['diagnostic_sessions.source', 'eyal'],
    ]);
  }
});

test('an "all" queue request omits the source filter entirely', async () => {
  const fake = recordingClient();
  const repository = repositoryWith(fake.client);

  await repository.getLeadsForQueue(40, 'all');

  for (const query of fake.recorded) {
    assert.deepEqual(findCalls(query, 'eq'), [['diagnostic_sessions.is_test', false]]);
  }
});

test('test queue performs one all-status query filtered to test, moriz-sourced sessions', async () => {
  const fake = recordingClient();
  const repository = repositoryWith(fake.client);

  await repository.getTestLeadsForQueue(30);

  assert.equal(fake.recorded.length, 1);
  assert.deepEqual(findCalls(fake.recorded[0], 'eq'), [
    ['diagnostic_sessions.is_test', true],
    ['diagnostic_sessions.source', 'moriz'],
  ]);
  assert.equal(findCall(fake.recorded[0], 'in'), undefined);
  assert.deepEqual(findCall(fake.recorded[0], 'limit')?.args, [30]);
  assert.deepEqual(findCall(fake.recorded[0], 'select')?.args[1], { count: 'exact' });
});

test('test queue with source "all" omits the source filter', async () => {
  const fake = recordingClient();
  const repository = repositoryWith(fake.client);

  await repository.getTestLeadsForQueue(30, 'all');

  assert.deepEqual(findCalls(fake.recorded[0], 'eq'), [['diagnostic_sessions.is_test', true]]);
});

test('test queue warns when the exact count exceeds returned rows', async () => {
  const fake = recordingClient([{ data: [], error: null, count: 3 }]);
  const repository = repositoryWith(fake.client);
  const warnings: unknown[][] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => warnings.push(args);

  try {
    await repository.getTestLeadsForQueue(2);
  } finally {
    console.warn = originalWarn;
  }

  assert.equal(warnings.length, 1);
  assert.match(String(warnings[0]?.[0]), /\[getTestLeadsForQueue\].*3 match, 0 returned/);
});

test('mapDiagnosticContactRow maps a full row, deriving resultTitle from primary_solution and utm from the joined session', () => {
  const row = {
    session_id: 'facade00-0000-4000-a000-000000000001',
    full_name: 'Mor Levi',
    phone: '050-1234567',
    email: 'mor@example.com',
    business_name: 'Moriz Studio',
    link: 'https://moriz.example',
    review_request: 'תבדקו את הדף',
    status: 'new',
    created_at: '2026-07-01T10:00:00.000Z',
    diagnostic_sessions: {
      primary_solution: 'lead_flow_system',
      lead_tier: 'A',
      utm: { utm_source: 'meta', utm_campaign: 'launch' },
      is_test: false,
      source: 'moriz',
    },
  };

  assert.deepEqual(mapDiagnosticContactRow(row), {
    sessionId: 'facade00-0000-4000-a000-000000000001',
    createdAt: '2026-07-01T10:00:00.000Z',
    status: 'new',
    fullName: 'Mor Levi',
    phone: '050-1234567',
    email: 'mor@example.com',
    businessName: 'Moriz Studio',
    link: 'https://moriz.example',
    message: 'תבדקו את הדף',
    primarySolution: 'lead_flow_system',
    resultTitle: 'מערכת ניהול פניות ולידים',
    leadTier: 'A',
    utmSource: 'meta',
    utmCampaign: 'launch',
    isTest: false,
    source: 'moriz',
  });
});

test('mapDiagnosticContactRow maps the session test classification to a required boolean', () => {
  const baseRow = {
    session_id: 'facade00-0000-4000-a000-000000000003',
    full_name: 'Mor',
    phone: '0501234567',
    email: 'mor@example.com',
    business_name: null,
    link: null,
    review_request: null,
    status: 'new',
    created_at: '2026-07-01T10:05:00.000Z',
    diagnostic_sessions: {
      primary_solution: null,
      lead_tier: null,
      utm: null,
      is_test: false,
      source: 'moriz',
    },
  };

  assert.equal(mapDiagnosticContactRow(baseRow).isTest, false);
  assert.equal(
    mapDiagnosticContactRow({
      ...baseRow,
      diagnostic_sessions: { ...baseRow.diagnostic_sessions, is_test: true },
    }).isTest,
    true,
  );
});

// A lead can be inserted before the session's result snapshot lands, or the
// join can simply miss (deleted session) — every derived field must fall
// back to null rather than throw.
test('mapLeadBriefRow maps a full row to camelCase', () => {
  const row = {
    session_id: 'facade00-0000-4000-a000-000000000001',
    evidence_md: '- אין וואטסאפ בדף',
    internal_brief_md: 'internal brief text',
    client_audit_md: 'טקסט אבחון ללקוח',
    status: 'approved',
    created_at: '2026-07-05T10:00:00.000Z',
    updated_at: '2026-07-05T11:00:00.000Z',
  };

  assert.deepEqual(mapLeadBriefRow(row), {
    sessionId: 'facade00-0000-4000-a000-000000000001',
    evidenceMd: '- אין וואטסאפ בדף',
    internalBriefMd: 'internal brief text',
    clientAuditMd: 'טקסט אבחון ללקוח',
    status: 'approved',
    createdAt: '2026-07-05T10:00:00.000Z',
    updatedAt: '2026-07-05T11:00:00.000Z',
  });
});

// A brief row can exist with evidence only (paste-evidence-first flow) — the
// generated/pasted text columns stay null and must map through as null.
test('mapLeadBriefRow keeps null text columns as null', () => {
  const row = {
    session_id: 'facade00-0000-4000-a000-000000000002',
    evidence_md: null,
    internal_brief_md: null,
    client_audit_md: null,
    status: 'draft',
    created_at: '2026-07-05T10:00:00.000Z',
    updated_at: '2026-07-05T10:00:00.000Z',
  };

  assert.deepEqual(mapLeadBriefRow(row), {
    sessionId: 'facade00-0000-4000-a000-000000000002',
    evidenceMd: null,
    internalBriefMd: null,
    clientAuditMd: null,
    status: 'draft',
    createdAt: '2026-07-05T10:00:00.000Z',
    updatedAt: '2026-07-05T10:00:00.000Z',
  });
});

test('mapDiagnosticContactRow falls back to source "moriz" and isTest false for a missing session join', () => {
  const row = {
    session_id: 'facade00-0000-4000-a000-000000000002',
    full_name: 'Mor',
    phone: '0501234567',
    email: 'mor@example.com',
    business_name: null,
    link: null,
    review_request: null,
    status: 'new',
    created_at: '2026-07-01T10:05:00.000Z',
    diagnostic_sessions: null,
  };

  assert.deepEqual(mapDiagnosticContactRow(row), {
    sessionId: 'facade00-0000-4000-a000-000000000002',
    createdAt: '2026-07-01T10:05:00.000Z',
    status: 'new',
    fullName: 'Mor',
    phone: '0501234567',
    email: 'mor@example.com',
    businessName: null,
    link: null,
    message: null,
    primarySolution: null,
    resultTitle: null,
    leadTier: null,
    utmSource: null,
    utmCampaign: null,
    isTest: false,
    source: 'moriz',
  });
});
