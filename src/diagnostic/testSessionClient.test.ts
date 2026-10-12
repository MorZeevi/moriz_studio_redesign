import { test } from 'node:test';
import assert from 'node:assert/strict';

import { withBasePath } from './basePath.ts';
import { loadStoredSession, type SessionStorage } from './session-client.ts';
import {
  classifySessionFromAdmin,
  createAdminTestSession,
} from './testSessionClient.ts';

const SESSION_ID = '11111111-1111-4111-8111-111111111111';
const SECOND_SESSION_ID = '22222222-2222-4222-8222-222222222222';
const SECRET = 'admin-secret-value';
const MARK_TEST_CONFIRMATION_HE =
  'לסמן את כל מסע הלקוח כנתוני בדיקה? הוא יוסר מכל ניתוחי הייצור.';
const REPLACE_SESSION_CONFIRMATION_HE =
  'קיימת בדפדפן בדיקה פעילה. להחליף אותה בבדיקת ניסיון חדשה?';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function fakeStorage(seed: Record<string, string> = {}): SessionStorage & { dump(): string } {
  const values = new Map(Object.entries(seed));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    dump: () => JSON.stringify(Object.fromEntries(values)),
  };
}

test('marking a session as test confirms before requesting and returns the canonical value', async () => {
  const order: string[] = [];
  const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];

  const result = await classifySessionFromAdmin(
    { sessionId: SESSION_ID, action: 'mark_test', secret: SECRET },
    {
      confirm: (message) => {
        assert.equal(message, MARK_TEST_CONFIRMATION_HE);
        order.push('confirm');
        return true;
      },
      fetch: async (input, init) => {
        order.push('fetch');
        requests.push({ input, init });
        return jsonResponse({ ok: true, isTest: true });
      },
      refresh: () => order.push('refresh'),
    }
  );

  assert.equal(result, true);
  assert.deepEqual(order, ['confirm', 'fetch', 'refresh']);
  assert.equal(requests[0]?.input, withBasePath('/api/admin/session-classification'));
  assert.deepEqual(JSON.parse(String(requests[0]?.init?.body)), {
    sessionId: SESSION_ID,
    action: 'mark_test',
  });
  assert.equal(new Headers(requests[0]?.init?.headers).get('x-admin-secret'), SECRET);
  assert.doesNotMatch(String(requests[0]?.init?.body), new RegExp(SECRET));
});

test('cancelling mark-test confirmation makes no request', async () => {
  let requests = 0;
  let refreshes = 0;

  const result = await classifySessionFromAdmin(
    { sessionId: SESSION_ID, action: 'mark_test', secret: SECRET },
    {
      confirm: () => false,
      fetch: async () => {
        requests += 1;
        return jsonResponse({ ok: true, isTest: true });
      },
      refresh: () => {
        refreshes += 1;
      },
    }
  );

  assert.equal(result, null);
  assert.equal(requests, 0);
  assert.equal(refreshes, 0);
});

test('restoring a real session skips confirmation and trusts the canonical response', async () => {
  let confirmations = 0;

  const result = await classifySessionFromAdmin(
    { sessionId: SESSION_ID, action: 'restore_real', secret: SECRET },
    {
      confirm: () => {
        confirmations += 1;
        return false;
      },
      fetch: async () => jsonResponse({ ok: true, isTest: false }),
      refresh: () => {},
    }
  );

  assert.equal(result, false);
  assert.equal(confirmations, 0);
});

test('classification rejects a non-canonical response', async () => {
  await assert.rejects(
    classifySessionFromAdmin(
      { sessionId: SESSION_ID, action: 'restore_real', secret: SECRET },
      {
        confirm: () => true,
        fetch: async () => jsonResponse({ ok: true, isTest: 'false' }),
        refresh: () => {},
      }
    ),
    /invalid_response/
  );
});

test('test-session creation stages a one-shot session before hard-replacing the secret-bearing admin entry', async () => {
  const storageState = fakeStorage();
  const order: string[] = [];
  const storage: SessionStorage & { dump(): string } = {
    ...storageState,
    setItem: (key, value) => {
      order.push('persist');
      storageState.setItem(key, value);
    },
  };
  const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
  const replacements: string[] = [];

  const result = await createAdminTestSession(SECRET, {
    storage,
    confirm: () => {
      throw new Error('no existing session should require confirmation');
    },
    fetch: async (input, init) => {
      order.push('fetch');
      requests.push({ input, init });
      return jsonResponse({
        sessionId: SESSION_ID,
        startedAt: '2026-07-19T12:00:00.000Z',
        isTest: true,
      });
    },
    replaceLocation: (url) => {
      order.push('replaceLocation');
      assert.equal(loadStoredSession(storage)?.launchImmediately, true);
      replacements.push(url);
    },
  });

  assert.deepEqual(result, {
    sessionId: SESSION_ID,
    startedAt: '2026-07-19T12:00:00.000Z',
    isTest: true,
  });
  assert.deepEqual(loadStoredSession(storage), {
    questionnaireVersion: 2,
    sessionId: SESSION_ID,
    answers: {},
    currentStep: 0,
    launchImmediately: true,
  });
  assert.equal(requests[0]?.input, withBasePath('/api/admin/test-session'));
  assert.equal(requests[0]?.init?.body, undefined);
  assert.equal(new Headers(requests[0]?.init?.headers).get('x-admin-secret'), SECRET);
  assert.deepEqual(order, ['fetch', 'persist', 'replaceLocation']);
  assert.deepEqual(replacements, [withBasePath('/')]);
  assert.doesNotMatch(storage.dump(), new RegExp(SECRET));
  assert.doesNotMatch(String(requests[0]?.init?.body), new RegExp(SECRET));
  assert.doesNotMatch(JSON.stringify(replacements), new RegExp(SECRET));
});

test('a valid existing cache requires confirmation before test-session creation', async () => {
  const storage = fakeStorage({
    'moriz-diagnostic-session': JSON.stringify({
      questionnaireVersion: 2,
      sessionId: SESSION_ID,
      answers: {},
      currentStep: 0,
    }),
  });
  let requests = 0;
  let confirmation = '';

  const result = await createAdminTestSession(SECRET, {
    storage,
    confirm: (message) => {
      confirmation = message;
      return false;
    },
    fetch: async () => {
      requests += 1;
      return jsonResponse({ sessionId: SECOND_SESSION_ID, startedAt: 'now', isTest: true });
    },
    replaceLocation: () => {},
  });

  assert.equal(result, null);
  assert.equal(requests, 0);
  assert.equal(confirmation, REPLACE_SESSION_CONFIRMATION_HE);
  assert.equal(loadStoredSession(storage)?.sessionId, SESSION_ID);
});

test('test-session creation rejects invalid UUID or classification responses before storage or location replacement', async () => {
  for (const responseBody of [
    { sessionId: 'not-a-uuid', startedAt: 'now', isTest: true },
    { sessionId: SESSION_ID, startedAt: 'now', isTest: false },
  ]) {
    const storage = fakeStorage();
    let navigations = 0;

    await assert.rejects(
      createAdminTestSession(SECRET, {
        storage,
        confirm: () => true,
        fetch: async () => jsonResponse(responseBody),
        replaceLocation: () => {
          navigations += 1;
        },
      }),
      /invalid_response/
    );

    assert.equal(loadStoredSession(storage), null);
    assert.equal(navigations, 0);
  }
});
