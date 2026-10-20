import { test } from 'node:test';
import assert from 'node:assert/strict';

import * as mutations from './db/mutations.ts';
import {
  createAdminTestSession,
  handleSessionClassification,
  validateAdminTestSessionPayload,
  validateSessionClassificationPayload,
  type SessionClassificationServiceDeps,
} from './sessionClassificationService.ts';

const SESSION_ID = '11111111-2222-4333-8444-555555555555';
const STARTED_AT = '2026-07-19T10:00:00.000Z';

function baseDeps(overrides: Partial<SessionClassificationServiceDeps> = {}): SessionClassificationServiceDeps {
  return {
    updateDiagnosticSessionClassification: async (_sessionId, isTest) => ({ isTest }),
    createTestDiagnosticSession: async () => ({ sessionId: SESSION_ID, startedAt: STARTED_AT }),
    ...overrides,
  };
}

test('classification validation rejects non-object bodies', () => {
  for (const body of [null, undefined, 'x', 42, true, []]) {
    assert.deepEqual(validateSessionClassificationPayload(body), { valid: false, error: 'invalid_body' });
  }
});

test('classification validation rejects an unknown action', () => {
  for (const action of [undefined, '', 'test', 'restore', true]) {
    assert.deepEqual(validateSessionClassificationPayload({ sessionId: SESSION_ID, action }), {
      valid: false,
      error: 'invalid_action',
    });
  }
});

test('classification validation rejects a malformed UUID', () => {
  assert.deepEqual(validateSessionClassificationPayload({ sessionId: 'not-a-uuid', action: 'mark_test' }), {
    valid: false,
    error: 'invalid_sessionId_format',
  });
});

test('classification validation reconstructs only whitelisted keys', () => {
  assert.deepEqual(
    validateSessionClassificationPayload({
      sessionId: SESSION_ID,
      action: 'mark_test',
      isTest: false,
      status: 'closed',
      secret: 'do-not-pass-through',
    }),
    { valid: true, value: { sessionId: SESSION_ID, action: 'mark_test' } },
  );
});

test('classification maps mark and restore intents to booleans before delegation', async () => {
  const calls: Array<{ sessionId: string; isTest: boolean }> = [];
  const deps = baseDeps({
    updateDiagnosticSessionClassification: async (sessionId, isTest) => {
      calls.push({ sessionId, isTest });
      return { isTest };
    },
  });

  assert.deepEqual(await handleSessionClassification({ sessionId: SESSION_ID, action: 'mark_test' }, deps), {
    isTest: true,
  });
  assert.deepEqual(await handleSessionClassification({ sessionId: SESSION_ID, action: 'restore_real' }, deps), {
    isTest: false,
  });
  assert.deepEqual(calls, [
    { sessionId: SESSION_ID, isTest: true },
    { sessionId: SESSION_ID, isTest: false },
  ]);
});

test('classification preserves the safe missing-or-incomplete session outcome', async () => {
  const deps = baseDeps({ updateDiagnosticSessionClassification: async () => null });
  assert.equal(await handleSessionClassification({ sessionId: SESSION_ID, action: 'mark_test' }, deps), null);
});

test('test-session validation accepts only an empty object', () => {
  assert.deepEqual(validateAdminTestSessionPayload({}), { valid: true, value: {} });
  for (const body of [null, undefined, '', [], { isTest: true }, { secret: 'x' }]) {
    assert.deepEqual(validateAdminTestSessionPayload(body), { valid: false, error: 'invalid_body' });
  }
});

test('admin test-session creation delegates and adds the canonical test marker', async () => {
  let calls = 0;
  const deps = baseDeps({
    createTestDiagnosticSession: async () => {
      calls += 1;
      return { sessionId: SESSION_ID, startedAt: STARTED_AT };
    },
  });

  assert.deepEqual(await createAdminTestSession(deps), {
    sessionId: SESSION_ID,
    startedAt: STARTED_AT,
    isTest: true,
  });
  assert.equal(calls, 1);
});

interface RecordedQuery {
  source: string;
  calls: Array<{ method: string; args: unknown[] }>;
}

interface QueryResult {
  data: Record<string, unknown> | null;
  error: Error | null;
}

class RecordingMutation implements PromiseLike<QueryResult> {
  readonly calls: RecordedQuery['calls'] = [];
  readonly source: string;
  private readonly result: QueryResult;

  constructor(source: string, result: QueryResult) {
    this.source = source;
    this.result = result;
  }

  insert(...args: unknown[]): this {
    this.calls.push({ method: 'insert', args });
    return this;
  }

  update(...args: unknown[]): this {
    this.calls.push({ method: 'update', args });
    return this;
  }

  select(...args: unknown[]): this {
    this.calls.push({ method: 'select', args });
    return this;
  }

  eq(...args: unknown[]): this {
    this.calls.push({ method: 'eq', args });
    return this;
  }

  not(...args: unknown[]): this {
    this.calls.push({ method: 'not', args });
    return this;
  }

  single(): this {
    this.calls.push({ method: 'single', args: [] });
    return this;
  }

  maybeSingle(): this {
    this.calls.push({ method: 'maybeSingle', args: [] });
    return this;
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.result).then(onfulfilled, onrejected);
  }
}

function recordingClient(results: QueryResult[]) {
  const recorded: RecordingMutation[] = [];
  return {
    recorded,
    client: {
      from(source: string) {
        const query = new RecordingMutation(source, results[recorded.length] ?? { data: null, error: null });
        recorded.push(query);
        return query;
      },
    },
  };
}

type SessionMutationRepository = {
  createDiagnosticSession(utm?: Record<string, string>): Promise<{ sessionId: string; startedAt: string }>;
  createTestDiagnosticSession(): Promise<{ sessionId: string; startedAt: string }>;
  updateDiagnosticSessionClassification(sessionId: string, isTest: boolean): Promise<{ isTest: boolean } | null>;
};

function repositoryWith(client: unknown): SessionMutationRepository {
  const moduleWithSeam = mutations as unknown as {
    createDiagnosticSessionMutationRepository(client: unknown): SessionMutationRepository;
  };
  assert.equal(typeof moduleWithSeam.createDiagnosticSessionMutationRepository, 'function');
  return moduleWithSeam.createDiagnosticSessionMutationRepository(client);
}

function findCall(query: RecordingMutation, method: string) {
  return query.calls.find((call) => call.method === method);
}

test('classification mutation is one completed-session update and never touches contact status', async () => {
  const fake = recordingClient([{ data: { id: SESSION_ID, is_test: true }, error: null }]);
  const repository = repositoryWith(fake.client);

  assert.deepEqual(await repository.updateDiagnosticSessionClassification(SESSION_ID, true), { isTest: true });
  assert.equal(fake.recorded.length, 1);
  assert.equal(fake.recorded[0]?.source, 'diagnostic_sessions');
  assert.deepEqual(findCall(fake.recorded[0], 'update')?.args, [{ is_test: true }]);
  assert.deepEqual(findCall(fake.recorded[0], 'eq')?.args, ['id', SESSION_ID]);
  assert.deepEqual(findCall(fake.recorded[0], 'not')?.args, ['completed_at', 'is', null]);
  assert.deepEqual(findCall(fake.recorded[0], 'select')?.args, ['id, is_test']);
  assert.equal(fake.recorded.some((query) => query.source === 'diagnostic_contacts'), false);
});

test('classification mutation returns null when no completed session matched', async () => {
  const fake = recordingClient([{ data: null, error: null }]);
  const repository = repositoryWith(fake.client);
  assert.equal(await repository.updateDiagnosticSessionClassification(SESSION_ID, false), null);
});

test('test creation explicitly inserts is_test while public creation relies on the database default', async () => {
  const fake = recordingClient([
    { data: { id: SESSION_ID, started_at: STARTED_AT }, error: null },
    { data: { id: SESSION_ID, started_at: STARTED_AT }, error: null },
  ]);
  const repository = repositoryWith(fake.client);

  await repository.createTestDiagnosticSession();
  await repository.createDiagnosticSession({ utm_source: 'newsletter' });

  assert.deepEqual(findCall(fake.recorded[0], 'insert')?.args, [{ utm: null, is_test: true }]);
  assert.deepEqual(findCall(fake.recorded[1], 'insert')?.args, [{ utm: { utm_source: 'newsletter' } }]);
  assert.equal('is_test' in (findCall(fake.recorded[1], 'insert')?.args[0] as Record<string, unknown>), false);
});
