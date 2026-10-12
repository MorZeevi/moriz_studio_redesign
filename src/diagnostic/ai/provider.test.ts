import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MoonshotProvider } from './moonshotProvider.ts';
import { resolveAiRuntime } from './provider.ts';

function fakeEnv(values: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  return { ...values } as NodeJS.ProcessEnv;
}

for (const value of [undefined, 'false', '1', 'TRUE', '']) {
  test(`keeps personalization disabled for ${String(value)}`, () => {
    const runtime = resolveAiRuntime(fakeEnv({ AI_PERSONALIZATION_ENABLED: value }));
    assert.equal(runtime.enabled, false);
  });
}

test('constructs Moonshot lazily when the exact enable flag and key are present', () => {
  const runtime = resolveAiRuntime(
    fakeEnv({
      AI_PERSONALIZATION_ENABLED: 'true',
      AI_PROVIDER: 'moonshot',
      MOONSHOT_API_KEY: 'unit-test-token',
      MOONSHOT_BASE_URL: 'https://moonshot.example/v1',
      MOONSHOT_MODEL: 'custom-model',
    })
  );

  assert.equal(runtime.enabled, true);
  const provider = runtime.getProvider();
  assert.ok(provider instanceof MoonshotProvider);
  assert.equal(provider.name, 'moonshot');
  assert.equal(provider.model, 'custom-model');
});

test('uses the documented Moonshot base URL and model defaults', () => {
  const runtime = resolveAiRuntime(
    fakeEnv({
      AI_PERSONALIZATION_ENABLED: 'true',
      AI_PROVIDER: 'moonshot',
      MOONSHOT_API_KEY: 'unit-test-token',
    })
  );

  const provider = runtime.getProvider();
  assert.equal(provider.name, 'moonshot');
  assert.equal(provider.model, 'kimi-k2-0711-preview');
});

test('recognizes openai but throws the P5c not-implemented error lazily', () => {
  const runtime = resolveAiRuntime(
    fakeEnv({ AI_PERSONALIZATION_ENABLED: 'true', AI_PROVIDER: 'openai' })
  );

  assert.equal(runtime.enabled, true);
  assert.throws(
    () => runtime.getProvider(),
    new Error('AI_PROVIDER "openai" not implemented in P5c')
  );
});

test('throws safely and before network construction when the Moonshot key is missing', () => {
  const runtime = resolveAiRuntime(
    fakeEnv({ AI_PERSONALIZATION_ENABLED: 'true', AI_PROVIDER: 'moonshot' })
  );

  assert.equal(runtime.enabled, true);
  assert.throws(() => runtime.getProvider(), /MOONSHOT_API_KEY is required/);
});

test('defaults the timeout to 8000ms when AI_TIMEOUT_MS is unset', () => {
  assert.equal(resolveAiRuntime(fakeEnv({})).timeoutMs, 8000);
});

test('honors a valid in-range AI_TIMEOUT_MS (25000 for local smoke)', () => {
  assert.equal(resolveAiRuntime(fakeEnv({ AI_TIMEOUT_MS: '25000' })).timeoutMs, 25000);
});

for (const invalid of ['', 'abc', '25s', '0', '-5', 'NaN']) {
  test(`falls back to 8000ms for invalid AI_TIMEOUT_MS ${JSON.stringify(invalid)}`, () => {
    assert.equal(resolveAiRuntime(fakeEnv({ AI_TIMEOUT_MS: invalid })).timeoutMs, 8000);
  });
}

test('clamps AI_TIMEOUT_MS into the safe [1000, 60000] range', () => {
  assert.equal(resolveAiRuntime(fakeEnv({ AI_TIMEOUT_MS: '500' })).timeoutMs, 1000);
  assert.equal(resolveAiRuntime(fakeEnv({ AI_TIMEOUT_MS: '999999' })).timeoutMs, 60000);
});

test('defaults AI_MAX_TOKENS to 400', () => {
  assert.equal(resolveAiRuntime(fakeEnv({})).maxTokens, 400);
});

test('honors a valid AI_MAX_TOKENS value', () => {
  assert.equal(resolveAiRuntime(fakeEnv({ AI_MAX_TOKENS: '350' })).maxTokens, 350);
});

for (const invalid of ['', 'abc', '400tokens', '0', '-5', 'NaN']) {
  test(`falls back to 400 for invalid AI_MAX_TOKENS ${JSON.stringify(invalid)}`, () => {
    assert.equal(resolveAiRuntime(fakeEnv({ AI_MAX_TOKENS: invalid })).maxTokens, 400);
  });
}

test('clamps AI_MAX_TOKENS into the safe [100, 800] range', () => {
  assert.equal(resolveAiRuntime(fakeEnv({ AI_MAX_TOKENS: '50' })).maxTokens, 100);
  assert.equal(resolveAiRuntime(fakeEnv({ AI_MAX_TOKENS: '9999' })).maxTokens, 800);
});

test('throws a clear error for an unknown or unset enabled provider', () => {
  for (const providerName of [undefined, 'other']) {
    const runtime = resolveAiRuntime(
      fakeEnv({ AI_PERSONALIZATION_ENABLED: 'true', AI_PROVIDER: providerName })
    );
    assert.throws(() => runtime.getProvider(), /Unknown or missing AI_PROVIDER/);
  }
});
