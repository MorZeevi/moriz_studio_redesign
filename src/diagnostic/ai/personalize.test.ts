import { test } from 'node:test';
import assert from 'node:assert/strict';

import { generatePersonalization } from './personalize.ts';
import type { AiProvider, AiProviderRequest, AiProviderResponse } from './types.ts';

const REQUEST: AiProviderRequest = {
  systemPrompt: 'system prompt',
  userPrompt: 'user prompt',
  maxTokens: 500,
  temperature: 0.7,
  timeoutMs: 8000,
};

const VALID_COPY = {
  insightHe: 'Insight text',
  contextFitHe: 'Why this fits text',
};

function providerReturning(response: AiProviderResponse, opts: { throws?: boolean } = {}): AiProvider {
  return {
    name: 'mock-provider',
    model: 'mock-model',
    async generate() {
      if (opts.throws) throw new Error('provider exploded');
      return response;
    },
  };
}

test('enabled:false returns disabled fallback without ever calling getProvider', async () => {
  let calls = 0;
  const outcome = await generatePersonalization({
    enabled: false,
    getProvider: () => {
      calls += 1;
      return providerReturning({ ok: true, text: JSON.stringify(VALID_COPY) });
    },
    request: REQUEST,
  });
  assert.deepEqual(outcome, { status: 'fallback', reason: 'disabled' });
  assert.equal(calls, 0);
});

test('a thrown exception from the provider resolves to provider_error, never escapes', async () => {
  const provider = providerReturning({ ok: true, text: '{}' }, { throws: true });
  const outcome = await generatePersonalization({ enabled: true, getProvider: () => provider, request: REQUEST });
  assert.deepEqual(outcome, { status: 'fallback', reason: 'provider_error' });
});

test('a thrown exception from getProvider itself resolves to provider_error, never escapes', async () => {
  const outcome = await generatePersonalization({
    enabled: true,
    getProvider: () => {
      throw new Error('factory exploded');
    },
    request: REQUEST,
  });
  assert.deepEqual(outcome, { status: 'fallback', reason: 'provider_error' });
});

test('a timeout provider error maps to fallback reason timeout', async () => {
  const provider = providerReturning({ ok: false, error: 'timeout' });
  const outcome = await generatePersonalization({ enabled: true, getProvider: () => provider, request: REQUEST });
  assert.deepEqual(outcome, { status: 'fallback', reason: 'timeout' });
});

for (const error of ['http_error', 'network_error', 'empty_response'] as const) {
  test(`a ${error} provider error maps to fallback reason provider_error`, async () => {
    const provider = providerReturning({ ok: false, error });
    const outcome = await generatePersonalization({ enabled: true, getProvider: () => provider, request: REQUEST });
    assert.deepEqual(outcome, { status: 'fallback', reason: 'provider_error' });
  });
}

test('unparsable provider text maps to fallback reason invalid_output', async () => {
  const provider = providerReturning({ ok: true, text: 'not valid json {' });
  const outcome = await generatePersonalization({ enabled: true, getProvider: () => provider, request: REQUEST });
  assert.deepEqual(outcome, { status: 'fallback', reason: 'invalid_output' });
});

test('a non-string response.text resolves to fallback reason invalid_output, never throws', async () => {
  const provider = providerReturning({ ok: true, text: undefined as unknown as string });
  const outcome = await generatePersonalization({ enabled: true, getProvider: () => provider, request: REQUEST });
  assert.deepEqual(outcome, { status: 'fallback', reason: 'invalid_output' });
});

test('a valid provider response yields status generated with copy, provider, model, and timing', async () => {
  const provider = providerReturning({ ok: true, text: JSON.stringify(VALID_COPY) });
  const before = Date.now();
  const outcome = await generatePersonalization({ enabled: true, getProvider: () => provider, request: REQUEST });
  const after = Date.now();

  assert.equal(outcome.status, 'generated');
  if (outcome.status !== 'generated') return;
  assert.deepEqual(outcome.copy, VALID_COPY);
  assert.equal(outcome.provider, 'mock-provider');
  assert.equal(outcome.model, 'mock-model');
  assert.ok(outcome.latencyMs >= 0);
  const generatedAtMs = new Date(outcome.generatedAt).getTime();
  assert.ok(generatedAtMs >= before && generatedAtMs <= after);
  assert.equal(new Date(outcome.generatedAt).toISOString(), outcome.generatedAt);
});
