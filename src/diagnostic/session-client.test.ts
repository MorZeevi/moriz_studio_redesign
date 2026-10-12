import { test } from 'node:test';
import assert from 'node:assert/strict';

import { QUESTIONS } from '../diagnostic-core/questions.ts';
import type { StoredSession } from './session-client.ts';
import {
  buildFreshStoredSession,
  CURRENT_QUESTIONNAIRE_VERSION,
  clearStoredSession,
  consumeImmediateSessionLaunch,
  loadStoredSession,
  saveStoredSession,
} from './session-client.ts';

const STORAGE_KEY = 'moriz-diagnostic-session';
const VALID_SESSION_ID = '11111111-1111-1111-1111-111111111111';

interface FakeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function fakeLocalStorage(seed: Record<string, string> = {}): FakeStorage {
  const store = new Map(Object.entries(seed));
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
}

function withWindowStub<T>(storage: FakeStorage, run: () => T): T {
  const originalWindow = (globalThis as { window?: unknown }).window;
  (globalThis as unknown as { window: unknown }).window = { localStorage: storage };
  try {
    return run();
  } finally {
    (globalThis as unknown as { window: unknown }).window = originalWindow;
  }
}

function stored(raw: unknown): Record<string, string> {
  return { [STORAGE_KEY]: JSON.stringify(raw) };
}

test('loadStoredSession migrates an unversioned v1 session without remapping changed answers', () => {
  const userActionsIndex = QUESTIONS.findIndex((question) => question.id === 'user_actions');
  const storage = fakeLocalStorage(
    stored({
      sessionId: VALID_SESSION_ID,
      currentStep: QUESTIONS.length - 1,
      answers: {
        business_description: { type: 'text', value: 'A small service business' },
        primary_goal: { type: 'single', optionId: 'generate_leads' },
        biggest_challenge: { type: 'single', optionId: 'site_not_converting' },
        current_asset: { type: 'single', optionId: 'basic_site' },
        user_actions: { type: 'multi', optionIds: ['leave_details', 'simple_site_only'] },
        personalization_need: { type: 'single', optionId: 'by_user_data' },
        urgency: { type: 'single', optionId: 'this_month' },
        desired_process: { type: 'single', optionId: 'short_focused' },
      },
    })
  );

  withWindowStub(storage, () => {
    const session = loadStoredSession();

    assert.deepEqual(session, {
      questionnaireVersion: CURRENT_QUESTIONNAIRE_VERSION,
      sessionId: VALID_SESSION_ID,
      currentStep: userActionsIndex,
      answers: {
        business_description: { type: 'text', value: 'A small service business' },
        primary_goal: { type: 'single', optionId: 'generate_leads' },
        biggest_challenge: { type: 'single', optionId: 'site_not_converting' },
        current_asset: { type: 'single', optionId: 'basic_site' },
        urgency: { type: 'single', optionId: 'this_month' },
        desired_process: { type: 'single', optionId: 'short_focused' },
      },
    });
    assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEY) as string), session);
  });
});

test('loadStoredSession clears an unversioned session with an invalid uuid', () => {
  const storage = fakeLocalStorage(
    stored({
      sessionId: 'not-a-uuid',
      currentStep: 2,
      answers: {},
    })
  );

  withWindowStub(storage, () => {
    assert.equal(loadStoredSession(), null);
    assert.equal(storage.getItem(STORAGE_KEY), null);
  });
});

test('loadStoredSession keeps strict validation for current v2 sessions', () => {
  const storage = fakeLocalStorage(
    stored({
      questionnaireVersion: CURRENT_QUESTIONNAIRE_VERSION,
      sessionId: VALID_SESSION_ID,
      currentStep: 4,
      answers: {
        user_actions: { type: 'multi', optionIds: ['bogus_obsolete_action'] },
      },
    })
  );

  withWindowStub(storage, () => {
    assert.equal(loadStoredSession(), null);
    assert.equal(storage.getItem(STORAGE_KEY), null);
  });
});

test('loadStoredSession clears unsupported future questionnaire versions', () => {
  const storage = fakeLocalStorage(
    stored({
      questionnaireVersion: 3,
      sessionId: VALID_SESSION_ID,
      currentStep: 0,
      answers: {},
    })
  );

  withWindowStub(storage, () => {
    assert.equal(loadStoredSession(), null);
    assert.equal(storage.getItem(STORAGE_KEY), null);
  });
});

test('saveStoredSession writes the current questionnaire version and clear removes it', () => {
  const storage = fakeLocalStorage();
  const session: StoredSession = {
    questionnaireVersion: CURRENT_QUESTIONNAIRE_VERSION,
    sessionId: VALID_SESSION_ID,
    currentStep: 0,
    answers: {},
  };

  withWindowStub(storage, () => {
    saveStoredSession(session);
    assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEY) as string), session);
    clearStoredSession();
    assert.equal(storage.getItem(STORAGE_KEY), null);
  });
});

test('buildFreshStoredSession validates the uuid and creates an empty v2 step-zero session', () => {
  assert.deepEqual(buildFreshStoredSession(VALID_SESSION_ID), {
    questionnaireVersion: CURRENT_QUESTIONNAIRE_VERSION,
    sessionId: VALID_SESSION_ID,
    currentStep: 0,
    answers: {},
  });
  assert.throws(() => buildFreshStoredSession('not-a-uuid'), /invalid_session_id/);
});

test('consumeImmediateSessionLaunch consumes a persisted launch marker exactly once', () => {
  const storage = fakeLocalStorage();
  const session = buildFreshStoredSession(VALID_SESSION_ID, true);

  withWindowStub(storage, () => {
    saveStoredSession(session);
    assert.equal(consumeImmediateSessionLaunch(), VALID_SESSION_ID);
    assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEY) as string), {
      questionnaireVersion: CURRENT_QUESTIONNAIRE_VERSION,
      sessionId: VALID_SESSION_ID,
      currentStep: 0,
      answers: {},
    });
    assert.equal(consumeImmediateSessionLaunch(), null);
    assert.notEqual(storage.getItem(STORAGE_KEY), null);
  });
});

test('consumeImmediateSessionLaunch preserves an ordinary valid stored session', () => {
  const session: StoredSession = {
    questionnaireVersion: CURRENT_QUESTIONNAIRE_VERSION,
    sessionId: VALID_SESSION_ID,
    currentStep: 1,
    answers: {
      business_description: { type: 'text', value: 'A small service business' },
    },
  };
  const storage = fakeLocalStorage(stored(session));

  withWindowStub(storage, () => {
    assert.equal(consumeImmediateSessionLaunch(), null);
    assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEY) as string), session);
  });
});
