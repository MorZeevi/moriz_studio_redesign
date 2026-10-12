import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  handleStatusUpdate,
  validateStatusUpdatePayload,
  type StatusUpdateServiceDeps,
} from './leadStatusService.ts';
import type { UpdateContactStatusOutcome } from './db/mutations.ts';

const VALID_UUID = '11111111-2222-3333-4444-555555555555';

// ── validateStatusUpdatePayload ──────────────────────────────────────────────

test('validateStatusUpdatePayload rejects non-object bodies', () => {
  for (const body of [null, undefined, 'x', 42, ['new'], true]) {
    const result = validateStatusUpdatePayload(body);
    assert.equal(result.valid, false);
    if (!result.valid) assert.equal(result.error, 'invalid_body');
  }
});

test('validateStatusUpdatePayload rejects a missing, non-string, or empty sessionId', () => {
  for (const sessionId of [undefined, 42, '', null]) {
    const result = validateStatusUpdatePayload({ sessionId, status: 'new' });
    assert.equal(result.valid, false);
    if (!result.valid) assert.equal(result.error, 'invalid_sessionId');
  }
});

test('validateStatusUpdatePayload rejects a malformed (non-uuid) sessionId', () => {
  const result = validateStatusUpdatePayload({ sessionId: 'not-a-uuid', status: 'new' });
  assert.equal(result.valid, false);
  if (!result.valid) assert.equal(result.error, 'invalid_sessionId_format');
});

test('validateStatusUpdatePayload rejects a missing or unknown status', () => {
  for (const status of [undefined, 'done', '', 'New', 42]) {
    const result = validateStatusUpdatePayload({ sessionId: VALID_UUID, status });
    assert.equal(result.valid, false);
    if (!result.valid) assert.equal(result.error, 'invalid_status');
  }
});

test('validateStatusUpdatePayload accepts a well-formed payload and reconstructs only the known keys', () => {
  const result = validateStatusUpdatePayload({
    sessionId: VALID_UUID,
    status: 'in_review',
    extraField: 'should be dropped',
  });
  assert.equal(result.valid, true);
  if (result.valid) {
    assert.deepEqual(result.value, { sessionId: VALID_UUID, status: 'in_review' });
    assert.equal((result.value as unknown as Record<string, unknown>).extraField, undefined);
  }
});

// ── handleStatusUpdate ───────────────────────────────────────────────────────

function stubDeps(outcome: UpdateContactStatusOutcome): {
  deps: StatusUpdateServiceDeps;
  calls: Array<{ sessionId: string; status: string }>;
} {
  const calls: Array<{ sessionId: string; status: string }> = [];
  return {
    calls,
    deps: {
      updateDiagnosticContactStatus: async (sessionId, status) => {
        calls.push({ sessionId, status });
        return outcome;
      },
    },
  };
}

test('handleStatusUpdate delegates to the injected dep and returns its outcome', async () => {
  const { deps, calls } = stubDeps({ status: 'updated' });
  const outcome = await handleStatusUpdate({ sessionId: VALID_UUID, status: 'contacted' }, deps);
  assert.deepEqual(outcome, { status: 'updated' });
  assert.deepEqual(calls, [{ sessionId: VALID_UUID, status: 'contacted' }]);
});

test('handleStatusUpdate surfaces a session_not_found outcome unchanged', async () => {
  const { deps } = stubDeps({ status: 'session_not_found' });
  const outcome = await handleStatusUpdate({ sessionId: VALID_UUID, status: 'closed' }, deps);
  assert.deepEqual(outcome, { status: 'session_not_found' });
});
