import { test } from 'node:test';
import assert from 'node:assert/strict';

import { FIXTURES } from '../../diagnostic-core/fixtures.ts';
import { calculateDiagnosticResult } from '../../diagnostic-core/scoring.ts';
import { buildAiPersonalizationInput } from './input.ts';
import { generatePersonalization } from './personalize.ts';
import { buildPersonalizationRequest } from './prompt.ts';
import { resolveAiRuntime } from './provider.ts';

const ENABLED_ENV = {
  AI_PERSONALIZATION_ENABLED: 'true',
  AI_PROVIDER: 'moonshot',
  MOONSHOT_API_KEY: 'unit-test-token',
  MOONSHOT_BASE_URL: 'https://moonshot.invalid/v1',
  MOONSHOT_MODEL: 'integration-model',
} as unknown as NodeJS.ProcessEnv;

const VALID_COPY = {
  insightHe: 'תובנה מותאמת לעסק',
  contextFitHe: 'הסבר מותאם לעסק',
};

function integrationInput() {
  const answers = FIXTURES.operations_crm;
  return buildAiPersonalizationInput(
    'integration-session',
    answers,
    calculateDiagnosticResult(answers)
  );
}

async function withFetchStub<T>(
  stub: typeof globalThis.fetch,
  run: () => Promise<T>
): Promise<T> {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = stub;
  try {
    return await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function providerResponse(content: string): Response {
  return new Response(
    JSON.stringify({ choices: [{ message: { role: 'assistant', content } }] }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

test('offline full chain returns generated metadata for validator-approved JSON', async () => {
  const runtime = resolveAiRuntime(ENABLED_ENV);
  const request = buildPersonalizationRequest(integrationInput());

  const result = await withFetchStub(
    async () => providerResponse(JSON.stringify(VALID_COPY)),
    () => generatePersonalization({ ...runtime, request })
  );

  assert.equal(result.status, 'generated');
  if (result.status !== 'generated') return;
  assert.deepEqual(result.copy, VALID_COPY);
  assert.equal(result.provider, 'moonshot');
  assert.equal(result.model, 'integration-model');
  assert.ok(result.latencyMs >= 0);
});

test('offline full chain proves garbage text is rejected by the P5b validator', async () => {
  const runtime = resolveAiRuntime(ENABLED_ENV);
  const request = buildPersonalizationRequest(integrationInput());

  const result = await withFetchStub(
    async () => providerResponse('not valid json'),
    () => generatePersonalization({ ...runtime, request })
  );

  assert.deepEqual(result, { status: 'fallback', reason: 'invalid_output' });
});

test('offline full chain maps an aborted provider call to timeout fallback', async () => {
  const runtime = resolveAiRuntime(ENABLED_ENV);
  const request = buildPersonalizationRequest(integrationInput(), { timeoutMs: 5 });

  const result = await withFetchStub(
    (_url, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => reject(new DOMException('Aborted', 'AbortError')),
          { once: true }
        );
      }),
    () => generatePersonalization({ ...runtime, request })
  );

  assert.deepEqual(result, { status: 'fallback', reason: 'timeout' });
});
