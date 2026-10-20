import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createLeadStatusPostHandler } from '../app/digital-audit/api/admin/lead-status/route.ts';
import { adminPost, authorizerFor, runRejectionCases } from './adminRouteTestSupport.ts';
import type { StatusUpdateReq } from './api-types.ts';
import type { StatusUpdateOutcome } from './leadStatusService.ts';

const PATH = '/digital-audit/api/admin/lead-status';
const SESSION_ID = '11111111-2222-4333-8444-555555555555';

function harness(outcome: StatusUpdateOutcome = { status: 'updated' }) {
  const updates: StatusUpdateReq[] = [];
  const revalidated: string[] = [];
  const handler = (isAuthorized: (request: Request) => Promise<boolean>) =>
    createLeadStatusPostHandler({
      isAuthorized,
      handleStatusUpdate: async (req) => {
        updates.push(req);
        return outcome;
      },
      revalidate: (path) => revalidated.push(path),
    });
  return { updates, revalidated, handler };
}

test('lead-status rejects every unauthorized request with 404 and writes nothing', async () => {
  const { updates, revalidated, handler } = harness();
  await runRejectionCases(PATH, handler, assert);
  assert.deepEqual(updates, []);
  assert.deepEqual(revalidated, []);
});

test('lead-status returns 400 for malformed JSON and invalid payloads after a valid guard', async () => {
  const { handler } = harness();
  const post = handler(authorizerFor(true));
  const malformed = await post(adminPost(PATH, '{'));
  assert.equal(malformed.status, 400);
  assert.deepEqual(await malformed.json(), { error: 'invalid_json' });
  const invalid = await post(adminPost(PATH, JSON.stringify({ sessionId: SESSION_ID, status: 'nope' })));
  assert.equal(invalid.status, 400);
  assert.deepEqual(await invalid.json(), { error: 'invalid_status' });
});

test('lead-status updates an owned session and revalidates the queue', async () => {
  const { updates, revalidated, handler } = harness();
  const response = await handler(authorizerFor(true))(
    adminPost(PATH, JSON.stringify({ sessionId: SESSION_ID, status: 'contacted' })),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.deepEqual(updates, [{ sessionId: SESSION_ID, status: 'contacted' }]);
  assert.deepEqual(revalidated, ['/digital-audit/admin']);
});

test('lead-status answers 404 session_not_found for a foreign or missing session', async () => {
  const { revalidated, handler } = harness({ status: 'session_not_found' });
  const response = await handler(authorizerFor(true))(
    adminPost(PATH, JSON.stringify({ sessionId: SESSION_ID, status: 'contacted' })),
  );
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'session_not_found' });
  assert.deepEqual(revalidated, []);
});

test('lead-status maps dependency exceptions to a generic 500', async () => {
  const originalError = console.error;
  console.error = () => undefined;
  try {
    const post = createLeadStatusPostHandler({
      isAuthorized: authorizerFor(true),
      handleStatusUpdate: async () => {
        throw new Error('database secret detail');
      },
      revalidate: () => undefined,
    });
    const response = await post(
      adminPost(PATH, JSON.stringify({ sessionId: SESSION_ID, status: 'contacted' })),
    );
    assert.equal(response.status, 500);
    const body = await response.json();
    assert.deepEqual(body, { error: 'internal_error' });
    assert.doesNotMatch(JSON.stringify(body), /database secret detail/);
  } finally {
    console.error = originalError;
  }
});
