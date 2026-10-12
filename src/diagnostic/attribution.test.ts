import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildAttribution, getAttribution, parseUtmParams, type Attribution } from './attribution.ts';

interface FakeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function fakeLocalStorage(seed: Record<string, string> = {}): FakeStorage {
  const store = new Map(Object.entries(seed));
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
  };
}

function throwingStorage(): FakeStorage {
  return {
    getItem(): string {
      throw new Error('SecurityError');
    },
    setItem(): void {
      throw new Error('QuotaExceededError');
    },
  };
}

interface WindowStubOptions {
  search?: string;
  storedAttribution?: Attribution;
  storageOverride?: FakeStorage;
}

// Mirrors the withFetchStub pattern in ai/moonshotProvider.test.ts: stub a
// global, run the assertion, always restore — so getAttribution's storage
// branch is testable without a real DOM.
function withWindowStub<T>(options: WindowStubOptions, run: () => T): T {
  const seed: Record<string, string> = options.storedAttribution
    ? { 'moriz-diagnostic-attribution': JSON.stringify(options.storedAttribution) }
    : {};
  const fakeWindow = {
    location: { search: options.search ?? '', pathname: '/digital-audit', origin: 'https://moriz.example' },
    localStorage: options.storageOverride ?? fakeLocalStorage(seed),
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

test('parseUtmParams keeps only known utm_ keys', () => {
  const result = parseUtmParams('?utm_source=meta&utm_medium=cpc&other=x');
  assert.deepEqual(result, { utm_source: 'meta', utm_medium: 'cpc' });
});

test('parseUtmParams returns undefined when no utm params are present', () => {
  assert.equal(parseUtmParams('?other=x'), undefined);
  assert.equal(parseUtmParams(''), undefined);
});

test('buildAttribution captures utm, landing path, and timestamp', () => {
  const result = buildAttribution({
    search: '?utm_source=meta&utm_campaign=launch',
    pathname: '/digital-audit',
    referrer: '',
    origin: 'https://moriz.example',
    now: '2026-07-04T10:00:00.000Z',
  });
  assert.deepEqual(result, {
    utm: { utm_source: 'meta', utm_campaign: 'launch' },
    landingPath: '/digital-audit',
    firstSeenAt: '2026-07-04T10:00:00.000Z',
  });
});

test('buildAttribution omits utm when none are present', () => {
  const result = buildAttribution({
    search: '',
    pathname: '/digital-audit',
    referrer: '',
    origin: 'https://moriz.example',
    now: '2026-07-04T10:00:00.000Z',
  });
  assert.equal('utm' in result, false);
});

test('buildAttribution keeps a cross-origin referrer', () => {
  const result = buildAttribution({
    search: '',
    pathname: '/digital-audit',
    referrer: 'https://www.facebook.com/',
    origin: 'https://moriz.example',
    now: '2026-07-04T10:00:00.000Z',
  });
  assert.equal(result.referrer, 'https://www.facebook.com/');
});

test('buildAttribution drops a same-origin referrer', () => {
  const result = buildAttribution({
    search: '',
    pathname: '/digital-audit',
    referrer: 'https://moriz.example/some-other-page',
    origin: 'https://moriz.example',
    now: '2026-07-04T10:00:00.000Z',
  });
  assert.equal('referrer' in result, false);
});

test('buildAttribution omits referrer when empty', () => {
  const result = buildAttribution({
    search: '',
    pathname: '/digital-audit',
    referrer: '',
    origin: 'https://moriz.example',
    now: '2026-07-04T10:00:00.000Z',
  });
  assert.equal('referrer' in result, false);
});

test('getAttribution returns null outside a browser environment', () => {
  assert.equal(getAttribution(), null);
});

test('getAttribution captures first-touch attribution once and persists it across calls', () => {
  withWindowStub({ search: '?utm_source=meta&utm_campaign=launch' }, () => {
    const first = getAttribution();
    assert.ok(first);
    assert.deepEqual(first?.utm, { utm_source: 'meta', utm_campaign: 'launch' });
    assert.equal(first?.landingPath, '/digital-audit');

    const second = getAttribution();
    assert.deepEqual(second, first);
  });
});

test('getAttribution does not overwrite an already-stored first-touch attribution', () => {
  const stored: Attribution = {
    utm: { utm_source: 'original' },
    landingPath: '/digital-audit',
    firstSeenAt: '2026-01-01T00:00:00.000Z',
  };
  withWindowStub({ search: '?utm_source=different&utm_campaign=later-visit', storedAttribution: stored }, () => {
    assert.deepEqual(getAttribution(), stored);
  });
});

test('getAttribution upgrades a stored no-utm (direct) attribution when a later visit carries a real utm', () => {
  const stored: Attribution = {
    landingPath: '/digital-audit',
    firstSeenAt: '2026-01-01T00:00:00.000Z',
  };
  withWindowStub({ search: '?utm_source=test&utm_campaign=qa_test', storedAttribution: stored }, () => {
    const result = getAttribution();
    assert.deepEqual(result?.utm, { utm_source: 'test', utm_campaign: 'qa_test' });
  });
});

test('getAttribution keeps an existing real-utm attribution when a later visit is direct (no utm)', () => {
  const stored: Attribution = {
    utm: { utm_source: 'original', utm_campaign: 'first-campaign' },
    landingPath: '/digital-audit',
    firstSeenAt: '2026-01-01T00:00:00.000Z',
  };
  withWindowStub({ search: '', storedAttribution: stored }, () => {
    assert.deepEqual(getAttribution(), stored);
  });
});

test('getAttribution degrades gracefully when localStorage throws', () => {
  withWindowStub({ search: '?utm_source=meta', storageOverride: throwingStorage() }, () => {
    const result = getAttribution();
    assert.ok(result);
    assert.deepEqual(result?.utm, { utm_source: 'meta' });
  });
});
