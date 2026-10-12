import { test } from 'node:test';
import assert from 'node:assert/strict';

import { toAnsweredSummary, trackDiagnosticEvent } from './analytics.ts';

test('toAnsweredSummary strips the free-text value from text answers', () => {
  const summary = toAnsweredSummary({ type: 'text', value: 'sensitive free text' });
  assert.deepEqual(summary, { type: 'text' });
  assert.equal('value' in summary, false);
});

test('toAnsweredSummary preserves option ids for single/multi answers', () => {
  assert.deepEqual(toAnsweredSummary({ type: 'single', optionId: 'a1' }), {
    type: 'single',
    optionId: 'a1',
  });
  assert.deepEqual(toAnsweredSummary({ type: 'multi', optionIds: ['a1', 'a2'] }), {
    type: 'multi',
    optionIds: ['a1', 'a2'],
  });
});

interface FakeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function fakeLocalStorage(): FakeStorage {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
  };
}

// Mirrors the withWindowStub pattern in attribution.test.ts: stub globals so
// getAttribution's browser branch runs for real inside trackDiagnosticEvent,
// instead of short-circuiting to null outside a DOM.
function withBrowserGlobals<T>(search: string, run: () => T): T {
  const fakeWindow = {
    location: { search, pathname: '/digital-audit/result', origin: 'https://moriz.example' },
    localStorage: fakeLocalStorage(),
  };
  const fakeDocument = { referrer: '' };

  const originalWindow = (globalThis as { window?: unknown }).window;
  const originalDocument = (globalThis as { document?: unknown }).document;
  (globalThis as unknown as { window: unknown }).window = fakeWindow;
  (globalThis as unknown as { document: unknown }).document = fakeDocument;
  try {
    return run();
  } finally {
    (globalThis as unknown as { window: unknown }).window = originalWindow;
    (globalThis as unknown as { document: unknown }).document = originalDocument;
  }
}

// trackDiagnosticEvent's only observable output is the console.debug sink
// inside `emit` (ponytail: single dev-console sink, see analytics.ts) — the
// only seam available to inspect an emitted payload without changing
// production code.
function withConsoleDebugCapture(run: () => void): unknown[][] {
  const calls: unknown[][] = [];
  const original = console.debug;
  console.debug = (...args: Parameters<typeof console.debug>) => {
    calls.push(args);
  };
  try {
    run();
    return calls;
  } finally {
    console.debug = original;
  }
}

function attributionUtmFrom(calls: unknown[][]): unknown {
  const record = calls[0]?.[1] as unknown as { attribution?: { utm?: unknown } } | undefined;
  return record?.attribution?.utm;
}

// P6c: emit's real destination is fetch('/api/diagnostic/events', ...) — stub
// the global to inspect the posted payload without making a real network call.
function withFetchCapture(run: () => void): { url: string; init: { method?: string; body?: string } }[] {
  const calls: { url: string; init: { method?: string; body?: string } }[] = [];
  const original = globalThis.fetch;
  (globalThis as unknown as { fetch: unknown }).fetch = (
    url: unknown,
    init: { method?: string; body?: string }
  ) => {
    calls.push({ url: url as string, init });
    return Promise.resolve({ ok: true } as Response);
  };
  try {
    run();
    return calls;
  } finally {
    (globalThis as unknown as { fetch: unknown }).fetch = original;
  }
}

test('trackDiagnosticEvent attaches attribution to an ai_personalization_fallback event', () => {
  withBrowserGlobals('?utm_source=meta&utm_campaign=launch', () => {
    const calls = withConsoleDebugCapture(() => {
      trackDiagnosticEvent({ name: 'ai_personalization_fallback', sessionId: 's1', reason: 'fetch_failed' });
    });
    assert.equal(calls.length, 1);
    assert.deepEqual(attributionUtmFrom(calls), { utm_source: 'meta', utm_campaign: 'launch' });
  });
});

test('trackDiagnosticEvent attaches attribution to a non-AI event (landing_view)', () => {
  withBrowserGlobals('?utm_source=meta', () => {
    const calls = withConsoleDebugCapture(() => {
      trackDiagnosticEvent({ name: 'landing_view' });
    });
    assert.equal(calls.length, 1);
    assert.deepEqual(attributionUtmFrom(calls), { utm_source: 'meta' });
  });
});

test('trackDiagnosticEvent posts a safe payload to /api/diagnostic/events for a text-answer question_answered event', () => {
  withBrowserGlobals('', () => {
    const calls = withFetchCapture(() => {
      trackDiagnosticEvent({
        name: 'question_answered',
        sessionId: 's1',
        questionId: 'q1',
        answer: toAnsweredSummary({ type: 'text', value: 'sensitive free text' }),
      });
    });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, '/digital-audit/api/diagnostic/events');
    assert.equal(calls[0].init.method, 'POST');

    const body = JSON.parse(calls[0].init.body as string);
    assert.deepEqual(body.answer, { type: 'text' });
    assert.equal('value' in body.answer, false);
    assert.equal(JSON.stringify(body).includes('sensitive free text'), false);
  });
});

// Acceptance criterion: analytics failure must never break the diagnostic
// flow. emit()'s fetch(...).catch(() => {}) is the guarantee; this proves a
// rejected fetch never surfaces as an unhandled rejection.
test('trackDiagnosticEvent swallows a rejected fetch instead of leaking an unhandled rejection', async () => {
  await withBrowserGlobals('', async () => {
    let fetchCalled = false;
    const original = globalThis.fetch;
    (globalThis as unknown as { fetch: unknown }).fetch = () => {
      fetchCalled = true;
      return Promise.reject(new Error('network down'));
    };

    let unhandled: unknown;
    const onUnhandledRejection = (reason: unknown) => {
      unhandled = reason;
    };
    process.once('unhandledRejection', onUnhandledRejection);

    try {
      trackDiagnosticEvent({ name: 'landing_view' });
      // Flush microtasks so the rejected promise settles and emit's
      // .catch(() => {}) runs (or fails to) before asserting.
      await new Promise((resolve) => setImmediate(resolve));
      assert.equal(fetchCalled, true);
      assert.equal(unhandled, undefined);
    } finally {
      process.removeListener('unhandledRejection', onUnhandledRejection);
      (globalThis as unknown as { fetch: unknown }).fetch = original;
    }
  });
});
