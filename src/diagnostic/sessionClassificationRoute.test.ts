import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createSessionClassificationPostHandler } from '../app/digital-audit/api/admin/session-classification/route.ts';
import type { SessionClassificationReq } from './api-types.ts';

const SESSION_ID = '11111111-2222-4333-8444-555555555555';

function request(body: string, secret = 'secret'): Request {
  return new Request('http://localhost/api/admin/session-classification', {
    method: 'POST',
    headers: { 'x-admin-secret': secret },
    body,
  });
}

function handlerWith(
  handleSessionClassification: (
    req: SessionClassificationReq,
  ) => Promise<{ isTest: boolean } | null> = async () => ({ isTest: true }),
) {
  return createSessionClassificationPostHandler({
    isAdminSecretValid: (header) => header === 'secret',
    handleSessionClassification,
  });
}

test('classification route returns 404 for missing or invalid secret before reading the body', async () => {
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

test('classification route returns 400 for malformed JSON after a valid guard', async () => {
  const response = await handlerWith()(request('{'));
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'invalid_json' });
});

test('classification route returns 400 for an invalid validated body', async () => {
  const response = await handlerWith()(request(JSON.stringify({ sessionId: SESSION_ID, action: 'test' })));
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'invalid_action' });
});

test('classification route returns the canonical service classification on success', async () => {
  const calls: SessionClassificationReq[] = [];
  const handler = handlerWith(async (req) => {
    calls.push(req);
    return { isTest: false };
  });

  const response = await handler(request(JSON.stringify({ sessionId: SESSION_ID, action: 'mark_test' })));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, isTest: false });
  assert.deepEqual(calls, [{ sessionId: SESSION_ID, action: 'mark_test' }]);
});

test('classification route maps a missing or incomplete session to 404', async () => {
  const response = await handlerWith(async () => null)(
    request(JSON.stringify({ sessionId: SESSION_ID, action: 'restore_real' })),
  );
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'session_not_found' });
});

test('classification route maps dependency exceptions to a generic 500', async () => {
  const originalError = console.error;
  console.error = () => undefined;
  try {
    const response = await handlerWith(async () => {
      throw new Error('database secret detail');
    })(request(JSON.stringify({ sessionId: SESSION_ID, action: 'mark_test' })));

    assert.equal(response.status, 500);
    const body = await response.json();
    assert.deepEqual(body, { error: 'internal_error' });
    assert.doesNotMatch(JSON.stringify(body), /database secret detail/);
  } finally {
    console.error = originalError;
  }
});
