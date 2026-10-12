import { test } from 'node:test';
import assert from 'node:assert/strict';

import { FIXTURES } from '../../diagnostic-core/fixtures.ts';
import {
  composeLeadBrief,
  parseLeadBriefOutput,
  resolveLeadBriefRuntime,
  MAX_BRIEF_FIELD_LENGTH,
} from './leadBrief.ts';
import { buildLeadBriefRequest, type LeadBriefPromptInput } from './leadBriefPrompt.ts';
import { calculateDiagnosticResult } from '../../diagnostic-core/scoring.ts';

// ── P8a composer tests (dispatch §F.2–F.5) ──────────────────────────────────
// Same fakeEnv/withFetchStub conventions as personalizeService.test.ts. No
// real network anywhere: fetch is always stubbed, and LEAD_BRIEF_AI_ENABLED
// is only ever 'true' against a fake env + stubbed fetch.

function fakeEnv(values: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  return { ...values } as NodeJS.ProcessEnv;
}

const ENABLED_ENV = fakeEnv({
  LEAD_BRIEF_AI_ENABLED: 'true',
  MOONSHOT_API_KEY: 'unit-test-token',
  MOONSHOT_BASE_URL: 'https://moonshot.invalid/v1',
  MOONSHOT_MODEL: 'test-model',
});

const VALID_TEXTS = {
  internalBriefMd: 'בריף פנימי לשיחה',
  clientAuditMd: 'תצפיות על הנוכחות הדיגיטלית',
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

function promptInput(overrides: Partial<LeadBriefPromptInput> = {}): LeadBriefPromptInput {
  return {
    sessionId: 'facade00-0000-4000-a000-000000000001',
    fullName: 'Mor Levi',
    businessName: 'Moriz Studio',
    link: 'https://moriz.example',
    answers: FIXTURES.lead_flow_system,
    snapshot: calculateDiagnosticResult(FIXTURES.lead_flow_system),
    evidenceMd: '- אין וואטסאפ בדף הבית\n- אין המלצות',
    ...overrides,
  };
}

// ── §F.2 output validation ───────────────────────────────────────────────────

test('parseLeadBriefOutput accepts valid JSON and trims fields', () => {
  const result = parseLeadBriefOutput(
    JSON.stringify({ internalBriefMd: '  בריף  ', clientAuditMd: 'תצפיות' })
  );
  assert.deepEqual(result, { valid: true, value: { internalBriefMd: 'בריף', clientAuditMd: 'תצפיות' } });
});

test('parseLeadBriefOutput strips a wrapping ```json code fence', () => {
  const fenced = '```json\n' + JSON.stringify(VALID_TEXTS) + '\n```';
  const result = parseLeadBriefOutput(fenced);
  assert.deepEqual(result, { valid: true, value: VALID_TEXTS });
});

test('parseLeadBriefOutput rejects unparsable and non-object payloads', () => {
  assert.deepEqual(parseLeadBriefOutput('not json'), { valid: false, error: 'invalid_json' });
  assert.deepEqual(parseLeadBriefOutput('[1,2]'), { valid: false, error: 'payload_not_object' });
  assert.deepEqual(parseLeadBriefOutput('null'), { valid: false, error: 'payload_not_object' });
});

test('parseLeadBriefOutput rejects missing and extra keys (all-or-nothing)', () => {
  assert.deepEqual(parseLeadBriefOutput(JSON.stringify({ internalBriefMd: 'x' })), {
    valid: false,
    error: 'unexpected_keys',
  });
  assert.deepEqual(parseLeadBriefOutput(JSON.stringify({ ...VALID_TEXTS, extra: 'x' })), {
    valid: false,
    error: 'unexpected_keys',
  });
});

test('parseLeadBriefOutput rejects empty, non-string, and oversize fields', () => {
  assert.deepEqual(parseLeadBriefOutput(JSON.stringify({ internalBriefMd: '  ', clientAuditMd: 'x' })), {
    valid: false,
    error: 'invalid_internalBriefMd',
  });
  assert.deepEqual(parseLeadBriefOutput(JSON.stringify({ internalBriefMd: 42, clientAuditMd: 'x' })), {
    valid: false,
    error: 'invalid_internalBriefMd',
  });
  assert.deepEqual(
    parseLeadBriefOutput(
      JSON.stringify({ internalBriefMd: 'x', clientAuditMd: 'y'.repeat(MAX_BRIEF_FIELD_LENGTH + 1) })
    ),
    { valid: false, error: 'invalid_clientAuditMd' }
  );
});

// ── §F.3 env gate + clamps ───────────────────────────────────────────────────

test('gate off (unset or false) resolves disabled and never calls fetch', async () => {
  for (const env of [fakeEnv({}), fakeEnv({ LEAD_BRIEF_AI_ENABLED: 'false' })]) {
    let fetchCalled = false;
    const result = await withFetchStub(
      async () => {
        fetchCalled = true;
        return providerResponse(JSON.stringify(VALID_TEXTS));
      },
      () => composeLeadBrief(promptInput(), resolveLeadBriefRuntime(env))
    );
    assert.deepEqual(result, { ok: false, reason: 'disabled' });
    assert.equal(fetchCalled, false);
  }
});

test('limits default and clamp to the dispatch bounds', () => {
  const defaults = resolveLeadBriefRuntime(fakeEnv({}));
  assert.equal(defaults.maxTokens, 2500);
  assert.equal(defaults.timeoutMs, 30000);

  const clamped = resolveLeadBriefRuntime(
    fakeEnv({ LEAD_BRIEF_MAX_TOKENS: '999999', LEAD_BRIEF_TIMEOUT_MS: '1' })
  );
  assert.equal(clamped.maxTokens, 4000);
  assert.equal(clamped.timeoutMs, 5000);

  const garbage = resolveLeadBriefRuntime(
    fakeEnv({ LEAD_BRIEF_MAX_TOKENS: 'abc', LEAD_BRIEF_TIMEOUT_MS: '-5' })
  );
  assert.equal(garbage.maxTokens, 2500);
  assert.equal(garbage.timeoutMs, 30000);
});

// ── §F.4 provider failure → typed reason, never a throw ─────────────────────

test('success path returns both briefs from the provider content', async () => {
  const result = await withFetchStub(
    async () => providerResponse(JSON.stringify(VALID_TEXTS)),
    () => composeLeadBrief(promptInput(), resolveLeadBriefRuntime(ENABLED_ENV))
  );
  assert.deepEqual(result, { ok: true, ...VALID_TEXTS });
});

test('rejected fetch resolves provider_error', async () => {
  const result = await withFetchStub(
    async () => {
      throw new Error('connection refused');
    },
    () => composeLeadBrief(promptInput(), resolveLeadBriefRuntime(ENABLED_ENV))
  );
  assert.deepEqual(result, { ok: false, reason: 'provider_error' });
});

test('non-2xx response resolves provider_error', async () => {
  const result = await withFetchStub(
    async () => new Response('overloaded', { status: 503 }),
    () => composeLeadBrief(promptInput(), resolveLeadBriefRuntime(ENABLED_ENV))
  );
  assert.deepEqual(result, { ok: false, reason: 'provider_error' });
});

test('aborted fetch resolves timeout', async () => {
  const result = await withFetchStub(
    async () => {
      throw new DOMException('aborted', 'AbortError');
    },
    () => composeLeadBrief(promptInput(), resolveLeadBriefRuntime(ENABLED_ENV))
  );
  assert.deepEqual(result, { ok: false, reason: 'timeout' });
});

test('missing MOONSHOT_API_KEY resolves provider_error, never throws', async () => {
  let fetchCalled = false;
  const result = await withFetchStub(
    async () => {
      fetchCalled = true;
      return providerResponse(JSON.stringify(VALID_TEXTS));
    },
    () =>
      composeLeadBrief(
        promptInput(),
        resolveLeadBriefRuntime(fakeEnv({ LEAD_BRIEF_AI_ENABLED: 'true' }))
      )
  );
  assert.deepEqual(result, { ok: false, reason: 'provider_error' });
  assert.equal(fetchCalled, false);
});

test('malformed provider content resolves invalid_output', async () => {
  const result = await withFetchStub(
    async () => providerResponse('הטקסט בלי JSON'),
    () => composeLeadBrief(promptInput(), resolveLeadBriefRuntime(ENABLED_ENV))
  );
  assert.deepEqual(result, { ok: false, reason: 'invalid_output' });
});

// ── §F.5 prompt guardrails ───────────────────────────────────────────────────

test('prompt carries the evidence-only, verdict-final, and no-promises guardrails', () => {
  const request = buildLeadBriefRequest(promptInput(), { maxTokens: 2500, timeoutMs: 30000 });
  // evidence-only reality side
  assert.match(request.systemPrompt, /אך ורק בשורות הראיות/);
  assert.match(request.systemPrompt, /אל תמציאו ממצאים/);
  // every gap statement anchored to an evidence line
  assert.match(request.systemPrompt, /שורת ראיה ספציפית/);
  // deterministic verdict is final
  assert.match(request.systemPrompt, /primarySolution\) סופית/);
  // client audit: observations, no prices/timelines/revenue promises
  assert.match(request.systemPrompt, /בלי מחירים, בלי לוחות זמנים, בלי הבטחות הכנסה/);
  assert.equal(request.temperature, 0.3);
  assert.equal(request.maxTokens, 2500);
  assert.equal(request.timeoutMs, 30000);
});

test('prompt payload is built from server-derived answers, verdict, and evidence', () => {
  const input = promptInput();
  const request = buildLeadBriefRequest(input, { maxTokens: 2500, timeoutMs: 30000 });
  // Hebrew answer labels (not raw option ids) reach the prompt
  assert.match(request.userPrompt, /משרד עורכי דין לנדל/);
  // deterministic verdict from the snapshot, unaltered
  assert.match(request.userPrompt, /"primarySolution":"lead_flow_system"/);
  // the admin evidence lines are the only reality side
  assert.match(request.userPrompt, /אין וואטסאפ בדף הבית/);
  assert.match(request.userPrompt, /"fullName":"Mor Levi"/);
});

test('prompt handles a missing snapshot with a null verdict', () => {
  const request = buildLeadBriefRequest(promptInput({ snapshot: null }), {
    maxTokens: 2500,
    timeoutMs: 30000,
  });
  assert.match(request.userPrompt, /"deterministicVerdict":null/);
});
