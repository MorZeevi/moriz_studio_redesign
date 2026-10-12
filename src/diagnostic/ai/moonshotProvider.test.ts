import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MoonshotProvider } from './moonshotProvider.ts';
import type { AiProviderRequest } from './types.ts';

const REQUEST: AiProviderRequest = {
  systemPrompt: 'system prompt',
  userPrompt: 'user prompt',
  maxTokens: 400,
  temperature: 0.3,
  timeoutMs: 50,
};

function provider(
  model = 'test-model',
  options: { thinkingEnabled?: boolean; diagnosticsEnabled?: boolean } = {}
): MoonshotProvider {
  return new MoonshotProvider({
    apiKey: 'unit-test-token',
    baseUrl: 'https://moonshot.invalid/v1',
    model,
    ...options,
  });
}

async function capturedRequestBody(
  model: string,
  options: { thinkingEnabled?: boolean; diagnosticsEnabled?: boolean } = {}
): Promise<Record<string, unknown>> {
  let capturedInit: RequestInit | undefined;
  await withFetchStub(
    async (_url, init) => {
      capturedInit = init;
      return jsonResponse({ choices: [{ message: { content: 'ok' } }] });
    },
    () => provider(model, options).generate(REQUEST)
  );
  return JSON.parse(capturedInit?.body as string);
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

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

test('returns the exact raw message content for a successful response', async () => {
  const text = '{"headlineHe":"raw provider text"}';
  const result = await withFetchStub(
    async () => jsonResponse({ choices: [{ message: { content: text } }] }),
    () => provider().generate(REQUEST)
  );

  assert.deepEqual(result, { ok: true, text });
});

for (const status of [401, 429, 500]) {
  test(`maps HTTP ${status} to http_error without throwing`, async () => {
    const result = await withFetchStub(
      async () => new Response('provider error details', { status }),
      () => provider().generate(REQUEST)
    );

    assert.deepEqual(result, { ok: false, error: 'http_error' });
  });
}

test('maps a rejected fetch to network_error without throwing', async () => {
  const result = await withFetchStub(
    async () => {
      throw new TypeError('connection failed');
    },
    () => provider().generate(REQUEST)
  );

  assert.deepEqual(result, { ok: false, error: 'network_error' });
});

test('maps an AbortController timeout to timeout rather than network_error', async () => {
  const result = await withFetchStub(
    (_url, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => reject(new DOMException('Aborted', 'AbortError')),
          { once: true }
        );
      }),
    () => provider().generate({ ...REQUEST, timeoutMs: 5 })
  );

  assert.deepEqual(result, { ok: false, error: 'timeout' });
});

for (const body of [
  {},
  { choices: [] },
  { choices: [{ message: {} }] },
  { choices: [{ message: { content: '' } }] },
  { choices: [{ message: { content: '   ' } }] },
]) {
  test('maps a successful response with missing or empty content to empty_response', async () => {
    const result = await withFetchStub(
      async () => jsonResponse(body),
      () => provider().generate(REQUEST)
    );

    assert.deepEqual(result, { ok: false, error: 'empty_response' });
  });
}

test('maps malformed JSON in a successful response to empty_response without throwing', async () => {
  const result = await withFetchStub(
    async () => new Response('not json', { status: 200 }),
    () => provider().generate(REQUEST)
  );

  assert.deepEqual(result, { ok: false, error: 'empty_response' });
});

test('sends the OpenAI-compatible URL, headers, and request body', async () => {
  let capturedUrl: string | URL | Request | undefined;
  let capturedInit: RequestInit | undefined;

  const result = await withFetchStub(
    async (url, init) => {
      capturedUrl = url;
      capturedInit = init;
      return jsonResponse({ choices: [{ message: { content: 'response text' } }] });
    },
    () => provider().generate(REQUEST)
  );

  assert.equal(result.ok, true);
  assert.equal(capturedUrl, 'https://moonshot.invalid/v1/chat/completions');
  assert.equal(capturedInit?.method, 'POST');

  const headers = new Headers(capturedInit?.headers);
  assert.equal(headers.get('Content-Type'), 'application/json');
  assert.equal(headers.has('Authorization'), true);

  assert.equal(typeof capturedInit?.body, 'string');
  const body = JSON.parse(capturedInit?.body as string);
  assert.deepEqual(body, {
    model: 'test-model',
    messages: [
      { role: 'system', content: REQUEST.systemPrompt },
      { role: 'user', content: REQUEST.userPrompt },
    ],
    max_tokens: REQUEST.maxTokens,
    temperature: REQUEST.temperature,
    response_format: { type: 'json_object' },
  });
});

for (const model of ['kimi-k2.5', 'kimi-k2.6']) {
  test(`uses instant mode and temperature 0.6 for ${model}`, async () => {
    const body = await capturedRequestBody(model);
    assert.deepEqual(body.thinking, { type: 'disabled' });
    assert.equal(body.temperature, 0.6);
  });
}

for (const model of ['kimi-k2.5', 'kimi-k2.6']) {
  test(`uses temperature 1 when thinking is intentionally enabled for ${model}`, async () => {
    const body = await capturedRequestBody(model, { thinkingEnabled: true });
    assert.deepEqual(body.thinking, { type: 'enabled' });
    assert.equal(body.temperature, 1);
  });
}

for (const model of ['test-model', 'kimi-k2-0711-preview']) {
  test(`passes the requested temperature through for unsupported instant-mode model ${model}`, async () => {
    const body = await capturedRequestBody(model);
    assert.equal('thinking' in body, false);
    assert.equal(body.temperature, REQUEST.temperature);
  });
}

test('keeps the always-thinking kimi-k2.7 temperature at 1 without an unsupported toggle', async () => {
  const body = await capturedRequestBody('kimi-k2.7');
  assert.equal('thinking' in body, false);
  assert.equal(body.temperature, 1);
});

test('emits only safe request metadata in development diagnostics', async () => {
  const entries: unknown[][] = [];
  const originalInfo = console.info;
  console.info = (...args: unknown[]) => entries.push(args);
  try {
    await withFetchStub(
      async () => jsonResponse({ choices: [{ message: { content: 'ok' } }] }),
      () => provider('kimi-k2.5', { diagnosticsEnabled: true }).generate(REQUEST)
    );
  } finally {
    console.info = originalInfo;
  }

  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.[0], '[diagnostic] moonshot request');
  assert.deepEqual(entries[0]?.[1], {
    model: 'kimi-k2.5',
    timeoutMs: 50,
    maxTokens: 400,
    responseFormat: 'json_object',
    thinking: 'disabled',
    systemPromptChars: REQUEST.systemPrompt.length,
    userPayloadChars: REQUEST.userPrompt.length,
    totalPromptChars: REQUEST.systemPrompt.length + REQUEST.userPrompt.length,
    headersReceived: true,
  });
  const serialized = JSON.stringify(entries);
  assert.equal(serialized.includes('unit-test-token'), false);
  assert.equal(serialized.includes(REQUEST.systemPrompt), false);
  assert.equal(serialized.includes(REQUEST.userPrompt), false);
  assert.equal(serialized.includes('Authorization'), false);
});

test('does not emit request diagnostics when diagnostics are disabled', async () => {
  const entries: unknown[][] = [];
  const originalInfo = console.info;
  console.info = (...args: unknown[]) => entries.push(args);
  try {
    await withFetchStub(
      async () => jsonResponse({ choices: [{ message: { content: 'ok' } }] }),
      () => provider('kimi-k2.5', { diagnosticsEnabled: false }).generate(REQUEST)
    );
  } finally {
    console.info = originalInfo;
  }
  assert.deepEqual(entries, []);
});

test('exposes the injected provider name and model', () => {
  const instance = provider();
  assert.equal(instance.name, 'moonshot');
  assert.equal(instance.model, 'test-model');
});
