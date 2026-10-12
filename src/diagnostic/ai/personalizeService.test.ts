import { test } from 'node:test';
import assert from 'node:assert/strict';

import { FIXTURES } from '../../diagnostic-core/fixtures.ts';
import type { DiagnosticAnswers } from '../../diagnostic-core/types.ts';
import { RESULT_TEMPLATES } from '../../diagnostic-core/resultTemplates.ts';
import { personalizeSession, type PersonalizeServiceDeps } from './personalizeService.ts';
import { resolveAiRuntime } from './provider.ts';

// ── P5d service tests (dispatch §F.1, items 1-9) ─────────────────────────
// Mirrors the fakeEnv/withFetchStub conventions already used by
// provider.test.ts / moonshotProvider.test.ts / personalize.integration.test.ts.
// No real network or DB call anywhere: sessionExists/getDiagnosticAnswers are
// always stubbed, and resolveRuntime always wraps a plain fake-env object
// literal (never process.env, never AI_PERSONALIZATION_ENABLED=true against a
// real provider).

function fakeEnv(values: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  return { ...values } as NodeJS.ProcessEnv;
}

const ENABLED_ENV = fakeEnv({
  AI_PERSONALIZATION_ENABLED: 'true',
  AI_PROVIDER: 'moonshot',
  MOONSHOT_API_KEY: 'unit-test-token',
  MOONSHOT_BASE_URL: 'https://moonshot.invalid/v1',
  MOONSHOT_MODEL: 'test-model',
});

const VALID_COPY = {
  insightHe: 'תובנה מותאמת לעסק',
  contextFitHe: 'הסבר מותאם לעסק',
};

async function withFetchStub<T>(stub: typeof globalThis.fetch, run: () => Promise<T>): Promise<T> {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = stub;
  try {
    return await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function providerResponse(content: string): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function baseDeps(overrides: Partial<PersonalizeServiceDeps> = {}): PersonalizeServiceDeps {
  return {
    sessionExists: async () => true,
    getDiagnosticAnswers: async () => FIXTURES.operations_crm,
    resolveRuntime: () => resolveAiRuntime(ENABLED_ENV),
    ...overrides,
  };
}

// 1. session_not_found (404 at the route)
test('resolves to session_not_found and never fetches answers when the session does not exist', async () => {
  let answersCalled = false;
  const outcome = await personalizeSession(
    '11111111-1111-1111-1111-111111111111',
    baseDeps({
      sessionExists: async () => false,
      getDiagnosticAnswers: async () => {
        answersCalled = true;
        return FIXTURES.operations_crm;
      },
    })
  );

  assert.deepEqual(outcome, { status: 'session_not_found' });
  assert.equal(answersCalled, false);
});

// 2. missing_required_answers (409 at the route)
test('resolves to missing_required_answers with the missing question ids', async () => {
  const incomplete: DiagnosticAnswers = { ...FIXTURES.trust_website };
  delete incomplete.business_description;

  const outcome = await personalizeSession(
    '11111111-1111-1111-1111-111111111111',
    baseDeps({ getDiagnosticAnswers: async () => incomplete })
  );

  assert.equal(outcome.status, 'missing_required_answers');
  if (outcome.status !== 'missing_required_answers') return;
  assert.ok(outcome.missing.includes('business_description'));
});

// 3. disabled runtime -> fallback, never touches fetch
test('resolves to a disabled fallback without ever calling fetch when the runtime is disabled', async () => {
  const outcome = await withFetchStub(
    async () => {
      throw new Error('fetch must not be called when personalization is disabled');
    },
    () =>
      personalizeSession(
        '11111111-1111-1111-1111-111111111111',
        baseDeps({ resolveRuntime: () => resolveAiRuntime(fakeEnv({})) })
      )
  );

  assert.deepEqual(outcome, { status: 'fallback', reason: 'disabled' });
});

// 4. generated (200, personalization present)
test('resolves to generated with the validator-approved copy on a healthy provider response', async () => {
  const outcome = await withFetchStub(
    async () => providerResponse(JSON.stringify(VALID_COPY)),
    () => personalizeSession('11111111-1111-1111-1111-111111111111', baseDeps())
  );

  assert.deepEqual(outcome, { status: 'generated', copy: VALID_COPY });
});

// 5. invalid_output fallback (200, personalization: null)
test('resolves to an invalid_output fallback when the provider text fails validation', async () => {
  const outcome = await withFetchStub(
    async () => providerResponse('not valid json'),
    () => personalizeSession('11111111-1111-1111-1111-111111111111', baseDeps())
  );

  assert.deepEqual(outcome, { status: 'fallback', reason: 'invalid_output' });
});

// 6. timeout fallback (abort), never throws
test('resolves to a timeout fallback rather than throwing when the provider call is aborted', async () => {
  const outcome = await withFetchStub(
    async () => {
      throw new DOMException('Aborted', 'AbortError');
    },
    () => personalizeSession('11111111-1111-1111-1111-111111111111', baseDeps())
  );

  assert.deepEqual(outcome, { status: 'fallback', reason: 'timeout' });
});

// 7. provider_error fallback when the provider factory itself throws
test('resolves to a provider_error fallback rather than throwing when getProvider throws', async () => {
  const outcome = await personalizeSession(
    '11111111-1111-1111-1111-111111111111',
    baseDeps({
      resolveRuntime: () => ({
        enabled: true,
        timeoutMs: 8000,
        maxTokens: 400,
        getProvider: () => {
          throw new Error('boom');
        },
      }),
    })
  );

  assert.deepEqual(outcome, { status: 'fallback', reason: 'provider_error' });
});

// 8. never throws on a rejected (non-abort) fetch either — always a typed fallback
test('resolves to a fallback with a valid reason rather than throwing on a rejected fetch', async () => {
  const outcome = await withFetchStub(
    async () => {
      throw new TypeError('connection failed');
    },
    () => personalizeSession('11111111-1111-1111-1111-111111111111', baseDeps())
  );

  assert.equal(outcome.status, 'fallback');
  if (outcome.status !== 'fallback') return;
  const validReasons = ['disabled', 'timeout', 'provider_error', 'invalid_output', 'rate_limited'];
  assert.ok(validReasons.includes(outcome.reason));
});

// 9. server recomputes the result + input from stored answers — sessionId is the
// only client-trusted input, everything else is rebuilt, never accepted from a caller.
test('derives the provider request from the recomputed result for the given answers, not from any client input', async () => {
  let capturedUserPrompt = '';
  await withFetchStub(
    async (_url, init) => {
      const body = JSON.parse((init?.body as string) ?? '{}') as {
        messages: Array<{ role: string; content: string }>;
      };
      capturedUserPrompt = body.messages.find((m) => m.role === 'user')?.content ?? '';
      return providerResponse(JSON.stringify(VALID_COPY));
    },
    () =>
      personalizeSession(
        '11111111-1111-1111-1111-111111111111',
        baseDeps({ getDiagnosticAnswers: async () => FIXTURES.web_app })
      )
  );

  assert.ok(capturedUserPrompt.includes('חברת ניהול נכסים עם עשרות בעלי דירות'));
  assert.ok(capturedUserPrompt.includes(RESULT_TEMPLATES.web_app.titleHe));
});

test('threads configured max tokens into the Moonshot request', async () => {
  let capturedMaxTokens: unknown;
  await withFetchStub(
    async (_url, init) => {
      capturedMaxTokens = JSON.parse((init?.body as string) ?? '{}').max_tokens;
      return providerResponse(JSON.stringify(VALID_COPY));
    },
    () =>
      personalizeSession(
        '11111111-1111-1111-1111-111111111111',
        baseDeps({
          resolveRuntime: () => resolveAiRuntime({ ...ENABLED_ENV, AI_MAX_TOKENS: '320' }),
        })
      )
  );

  assert.equal(capturedMaxTokens, 320);
});
