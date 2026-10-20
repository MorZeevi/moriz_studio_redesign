import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createLeadBriefPostHandler } from '../app/digital-audit/api/admin/lead-brief/route.ts';
import { adminPost, authorizerFor, runRejectionCases } from './adminRouteTestSupport.ts';
import type { LeadBriefReq } from './api-types.ts';
import type { LeadBriefOutcome } from './leadBriefService.ts';

const PATH = '/digital-audit/api/admin/lead-brief';
const SESSION_ID = '11111111-2222-4333-8444-555555555555';
const APPROVE = JSON.stringify({ mode: 'approve', sessionId: SESSION_ID });

function harness(outcome: LeadBriefOutcome = { status: 'brief_not_found' }) {
  const calls: LeadBriefReq[] = [];
  const handler = (isAuthorized: (request: Request) => Promise<boolean>) =>
    createLeadBriefPostHandler({
      isAuthorized,
      handleLeadBrief: async (req) => {
        calls.push(req);
        return outcome;
      },
    });
  return { calls, handler };
}

test('lead-brief rejects every unauthorized request with 404 and calls nothing', async () => {
  const { calls, handler } = harness();
  await runRejectionCases(PATH, handler, assert);
  assert.deepEqual(calls, []);
});

test('lead-brief returns 400 for malformed JSON and invalid payloads after a valid guard', async () => {
  const { calls, handler } = harness();
  const post = handler(authorizerFor(true));
  const malformed = await post(adminPost(PATH, '{'));
  assert.equal(malformed.status, 400);
  assert.deepEqual(await malformed.json(), { error: 'invalid_json' });
  const invalid = await post(adminPost(PATH, JSON.stringify({ mode: 'nope', sessionId: SESSION_ID })));
  assert.equal(invalid.status, 400);
  assert.deepEqual(await invalid.json(), { error: 'invalid_mode' });
  assert.deepEqual(calls, []);
});

test('lead-brief maps a foreign or missing session and a missing draft to 404', async () => {
  for (const status of ['session_not_found', 'brief_not_found'] as const) {
    const { handler } = harness({ status });
    const response = await handler(authorizerFor(true))(adminPost(PATH, APPROVE));
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: status });
  }
});

test('lead-brief maps an AI failure to a typed 200 and exceptions to a generic 500', async () => {
  const failed = await harness({ status: 'ai_failed', reason: 'timeout' }).handler(authorizerFor(true))(
    adminPost(PATH, APPROVE),
  );
  assert.equal(failed.status, 200);
  assert.deepEqual(await failed.json(), { ok: false, reason: 'timeout' });

  const originalError = console.error;
  console.error = () => undefined;
  try {
    const post = createLeadBriefPostHandler({
      isAuthorized: authorizerFor(true),
      handleLeadBrief: async () => {
        throw new Error('database secret detail');
      },
    });
    const response = await post(adminPost(PATH, APPROVE));
    assert.equal(response.status, 500);
    const body = await response.json();
    assert.deepEqual(body, { error: 'internal_error' });
    assert.doesNotMatch(JSON.stringify(body), /database secret detail/);
  } finally {
    console.error = originalError;
  }
});
