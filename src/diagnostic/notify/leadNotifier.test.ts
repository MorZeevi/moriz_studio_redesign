import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildNewLeadEmail, notifyNewLead } from './leadNotifier.ts';
import type { DiagnosticLead } from '../db/queries.ts';

function fixtureLead(overrides: Partial<DiagnosticLead> = {}): DiagnosticLead {
  return {
    sessionId: 'facade00-0000-4000-a000-000000000001',
    createdAt: '2026-07-01T10:00:00.000Z',
    status: 'new',
    fullName: 'Mor Levi',
    phone: '050-1234567',
    email: 'mor@example.com',
    businessName: 'Moriz Studio',
    link: 'https://moriz.example',
    message: 'תבדקו את הדף',
    primarySolution: 'lead_flow_system',
    resultTitle: 'מערכת ניהול פניות ולידים',
    leadTier: 'A',
    utmSource: 'meta',
    utmCampaign: 'launch',
    isTest: false,
    source: 'moriz',
    ...overrides,
  };
}

function fakeEnv(values: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  return { ...values } as NodeJS.ProcessEnv;
}

// Proves the no-op branches never reach fetch, satisfying the dispatch's
// "no real network calls in tests" rule by construction rather than by claim.
async function withFetchGuard<T>(run: () => Promise<T>): Promise<T> {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error('fetch must not be called for this branch');
  };
  try {
    return await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test('buildNewLeadEmail includes name, contact, solution, tier, and UTM fields', () => {
  const { subject, text } = buildNewLeadEmail(fixtureLead());

  assert.equal(subject, 'New lead: Mor Levi');
  assert.match(text, /New diagnostic lead: Mor Levi/);
  assert.match(text, /Email: mor@example\.com/);
  assert.match(text, /Phone: 050-1234567/);
  assert.match(text, /Primary solution: מערכת ניהול פניות ולידים/);
  assert.match(text, /Lead tier: A/);
  assert.match(text, /UTM source: meta/);
  assert.match(text, /UTM campaign: launch/);
  assert.match(text, /session facade00-0000-4000-a000-000000000001/);
});

test('buildNewLeadEmail falls back to primarySolution and "unknown"/"—" when derived fields are null', () => {
  const { text } = buildNewLeadEmail(
    fixtureLead({ resultTitle: null, leadTier: null, utmSource: null, utmCampaign: null })
  );

  assert.match(text, /Primary solution: lead_flow_system/);
  assert.match(text, /Lead tier: unknown/);
  assert.match(text, /UTM source: —/);
  assert.match(text, /UTM campaign: —/);
});

test('buildNewLeadEmail falls back to "unknown" when both resultTitle and primarySolution are null', () => {
  const { text } = buildNewLeadEmail(fixtureLead({ primarySolution: null, resultTitle: null }));
  assert.match(text, /Primary solution: unknown/);
});

test('notifyNewLead is a no-op when LEAD_NOTIFY_ENABLED is unset', async () => {
  await withFetchGuard(() => notifyNewLead(fixtureLead(), fakeEnv({})));
});

for (const value of ['false', '1', 'TRUE', '']) {
  test(`notifyNewLead is a no-op for LEAD_NOTIFY_ENABLED=${JSON.stringify(value)}`, async () => {
    await withFetchGuard(() => notifyNewLead(fixtureLead(), fakeEnv({ LEAD_NOTIFY_ENABLED: value })));
  });
}

for (const missing of ['RESEND_API_KEY', 'LEAD_NOTIFY_TO_EMAIL', 'LEAD_NOTIFY_FROM_EMAIL']) {
  test(`notifyNewLead is a no-op when enabled but ${missing} is missing`, async () => {
    const env = fakeEnv({
      LEAD_NOTIFY_ENABLED: 'true',
      RESEND_API_KEY: 'key',
      LEAD_NOTIFY_TO_EMAIL: 'to@example.com',
      LEAD_NOTIFY_FROM_EMAIL: 'from@example.com',
    });
    delete env[missing as keyof NodeJS.ProcessEnv];

    const originalError = console.error;
    console.error = () => {};
    try {
      await withFetchGuard(() => notifyNewLead(fixtureLead(), env));
    } finally {
      console.error = originalError;
    }
  });
}
