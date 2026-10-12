import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createTestSessionPostHandler } from '../app/digital-audit/api/admin/test-session/route.ts';
import type { AdminTestSessionRes } from './api-types.ts';

const SESSION_ID = '11111111-2222-4333-8444-555555555555';
const STARTED_AT = '2026-07-19T10:00:00.000Z';
const CREATED: AdminTestSessionRes = { sessionId: SESSION_ID, startedAt: STARTED_AT, isTest: true };

function request(body: string, secret = 'secret'): Request {
  return new Request('http://localhost/api/admin/test-session', {
    method: 'POST',
    headers: { 'x-admin-secret': secret },
    body,
  });
}

function handlerWith(createAdminTestSession: () => Promise<AdminTestSessionRes> = async () => CREATED) {
  return createTestSessionPostHandler({
    isAdminSecretValid: (header) => header === 'secret',
    createAdminTestSession,
  });
}

test('test-session route returns 404 for missing or invalid secret before reading the body', async () => {
  const handler = handlerWith();

  for (const header of [null, 'wrong']) {
    let bodyRead = false;
    const guardedRequest = {
      headers: new Headers(header === null ? {} : { 'x-admin-secret': header }),
      text: async () => {
        bodyRead = true;
        throw new Error('body must not be read');
      },
    } as unknown as Request;

    const response = await handler(guardedRequest);
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'not_found' });
    assert.equal(bodyRead, false);
  }
});

test('test-session route returns 400 for malformed JSON after a valid guard', async () => {
  const response = await handlerWith()(request('{'));
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'invalid_json' });
});

test('test-session route returns 400 for an unexpected non-empty body', async () => {
  const response = await handlerWith()(request(JSON.stringify({ isTest: true })));
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'invalid_body' });
});

test('test-session route returns the canonical created session on success', async () => {
  let calls = 0;
  const handler = handlerWith(async () => {
    calls += 1;
    return CREATED;
  });

  const response = await handler(request(''));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), CREATED);
  assert.equal(calls, 1);
});

test('test-session route maps dependency exceptions to a generic 500', async () => {
  const originalError = console.error;
  console.error = () => undefined;
  try {
    const response = await handlerWith(async () => {
      throw new Error('database secret detail');
    })(request(''));

    assert.equal(response.status, 500);
    const body = await response.json();
    assert.deepEqual(body, { error: 'internal_error' });
    assert.doesNotMatch(JSON.stringify(body), /database secret detail/);
  } finally {
    console.error = originalError;
  }
});
