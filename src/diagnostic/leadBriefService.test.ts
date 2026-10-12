import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  handleLeadBrief,
  isAdminSecretValid,
  validateLeadBriefPayload,
  MAX_BRIEF_TEXT_LENGTH,
  MAX_EVIDENCE_LENGTH,
  type LeadBriefServiceDeps,
} from './leadBriefService.ts';
import type { LeadBrief, LeadBriefReq } from './api-types.ts';
import type { UpsertLeadBriefInput } from './db/mutations.ts';
import type { DiagnosticLead } from './db/queries.ts';
import type { LeadBriefPromptInput } from './ai/leadBriefPrompt.ts';
import { FIXTURES } from '../diagnostic-core/fixtures.ts';
import { calculateDiagnosticResult } from '../diagnostic-core/scoring.ts';

const SESSION_ID = 'facade00-0000-4000-a000-000000000001';

function fakeEnv(values: Record<string, string>): NodeJS.ProcessEnv {
  return values as NodeJS.ProcessEnv;
}

function fakeLead(): DiagnosticLead {
  return {
    sessionId: SESSION_ID,
    createdAt: '2026-07-05T10:00:00.000Z',
    status: 'new',
    fullName: 'Mor Levi',
    phone: '050-1234567',
    email: 'mor@example.com',
    businessName: 'Moriz Studio',
    link: 'https://moriz.example',
    message: null,
    primarySolution: 'lead_flow_system',
    resultTitle: 'מערכת ניהול פניות ולידים',
    leadTier: 'A',
    utmSource: null,
    utmCampaign: null,
    isTest: false,
    source: 'moriz',
  };
}

function fakeBrief(overrides: Partial<LeadBrief> = {}): LeadBrief {
  return {
    sessionId: SESSION_ID,
    evidenceMd: null,
    internalBriefMd: null,
    clientAuditMd: null,
    status: 'draft',
    createdAt: '2026-07-05T10:00:00.000Z',
    updatedAt: '2026-07-05T10:00:00.000Z',
    ...overrides,
  };
}

// Real deterministic snapshot — same pure function the app persists from.
const SNAPSHOT = calculateDiagnosticResult(FIXTURES.lead_flow_system);

// Deps stub that records calls; every test injects it — no real Supabase or
// provider ever. composeLeadBrief succeeds by default; tests override to fail.
function baseDeps(overrides: Partial<LeadBriefServiceDeps> = {}): LeadBriefServiceDeps & {
  upsertCalls: UpsertLeadBriefInput[];
  approveCalls: string[];
  composeCalls: LeadBriefPromptInput[];
} {
  const upsertCalls: UpsertLeadBriefInput[] = [];
  const approveCalls: string[] = [];
  const composeCalls: LeadBriefPromptInput[] = [];
  return {
    upsertCalls,
    approveCalls,
    composeCalls,
    getDiagnosticLeadBySessionId: async () => fakeLead(),
    getDiagnosticAnswers: async () => FIXTURES.lead_flow_system,
    getSessionResultSnapshot: async () => SNAPSHOT,
    upsertLeadBrief: async (input) => {
      upsertCalls.push(input);
      return fakeBrief({
        evidenceMd: input.evidenceMd ?? null,
        internalBriefMd: input.internalBriefMd ?? null,
        clientAuditMd: input.clientAuditMd ?? null,
      });
    },
    approveLeadBrief: async (sessionId) => {
      approveCalls.push(sessionId);
      return fakeBrief({ status: 'approved' });
    },
    composeLeadBrief: async (input) => {
      composeCalls.push(input);
      return { ok: true, internalBriefMd: 'בריף פנימי', clientAuditMd: 'תצפיות ללקוח' };
    },
    ...overrides,
  };
}

// ── §F.7 route auth (service-level: route files can't load under node --test,
// so the guard lives in isAdminSecretValid and the route calls it) ──────────

test('isAdminSecretValid rejects when env secret is unset', () => {
  assert.equal(isAdminSecretValid('anything', fakeEnv({})), false);
});

test('isAdminSecretValid rejects when env secret is empty', () => {
  assert.equal(isAdminSecretValid('', fakeEnv({ ADMIN_ACCESS_SECRET: '' })), false);
  assert.equal(isAdminSecretValid('x', fakeEnv({ ADMIN_ACCESS_SECRET: '' })), false);
});

test('isAdminSecretValid rejects a missing header', () => {
  assert.equal(isAdminSecretValid(null, fakeEnv({ ADMIN_ACCESS_SECRET: 's3cret' })), false);
});

test('isAdminSecretValid rejects a wrong header', () => {
  assert.equal(isAdminSecretValid('wrong', fakeEnv({ ADMIN_ACCESS_SECRET: 's3cret' })), false);
});

test('isAdminSecretValid accepts an exact match', () => {
  assert.equal(isAdminSecretValid('s3cret', fakeEnv({ ADMIN_ACCESS_SECRET: 's3cret' })), true);
});

// ── payload validation (whitelist reconstruction) ───────────────────────────

test('validateLeadBriefPayload rejects non-object bodies', () => {
  for (const body of [null, 'x', 42, [], undefined]) {
    assert.deepEqual(validateLeadBriefPayload(body), { valid: false, error: 'invalid_body' });
  }
});

test('validateLeadBriefPayload rejects an unknown mode', () => {
  assert.deepEqual(validateLeadBriefPayload({ mode: 'delete', sessionId: SESSION_ID }), {
    valid: false,
    error: 'invalid_mode',
  });
});

test('validateLeadBriefPayload rejects missing and malformed sessionId', () => {
  assert.deepEqual(validateLeadBriefPayload({ mode: 'save' }), { valid: false, error: 'invalid_sessionId' });
  assert.deepEqual(validateLeadBriefPayload({ mode: 'save', sessionId: 'not-a-uuid' }), {
    valid: false,
    error: 'invalid_sessionId_format',
  });
});

test('validateLeadBriefPayload approve strips text fields entirely', () => {
  const result = validateLeadBriefPayload({
    mode: 'approve',
    sessionId: SESSION_ID,
    evidenceMd: 'ignored',
    internalBriefMd: 'ignored',
    unknownKey: 'ignored',
  });
  assert.deepEqual(result, { valid: true, value: { mode: 'approve', sessionId: SESSION_ID } });
});

test('validateLeadBriefPayload save passes only whitelisted keys through', () => {
  const result = validateLeadBriefPayload({
    mode: 'save',
    sessionId: SESSION_ID,
    evidenceMd: '- אין וואטסאפ בדף',
    internalBriefMd: 'internal',
    clientAuditMd: 'client',
    injected: 'nope',
  });
  assert.deepEqual(result, {
    valid: true,
    value: {
      mode: 'save',
      sessionId: SESSION_ID,
      evidenceMd: '- אין וואטסאפ בדף',
      internalBriefMd: 'internal',
      clientAuditMd: 'client',
    },
  });
});

test('validateLeadBriefPayload save keeps absent text fields absent', () => {
  const result = validateLeadBriefPayload({ mode: 'save', sessionId: SESSION_ID, evidenceMd: 'evidence only' });
  assert.deepEqual(result, {
    valid: true,
    value: { mode: 'save', sessionId: SESSION_ID, evidenceMd: 'evidence only' },
  });
});

test('validateLeadBriefPayload save rejects non-string and oversize text fields', () => {
  const base = { mode: 'save', sessionId: SESSION_ID };
  assert.deepEqual(validateLeadBriefPayload({ ...base, evidenceMd: 42 }), {
    valid: false,
    error: 'invalid_evidenceMd',
  });
  assert.deepEqual(validateLeadBriefPayload({ ...base, evidenceMd: 'x'.repeat(MAX_EVIDENCE_LENGTH + 1) }), {
    valid: false,
    error: 'evidence_too_long',
  });
  assert.deepEqual(validateLeadBriefPayload({ ...base, internalBriefMd: 'x'.repeat(MAX_BRIEF_TEXT_LENGTH + 1) }), {
    valid: false,
    error: 'invalid_internalBriefMd',
  });
  assert.deepEqual(validateLeadBriefPayload({ ...base, clientAuditMd: 'x'.repeat(MAX_BRIEF_TEXT_LENGTH + 1) }), {
    valid: false,
    error: 'invalid_clientAuditMd',
  });
});

test('validateLeadBriefPayload generate requires meaningful evidence', () => {
  const base = { mode: 'generate', sessionId: SESSION_ID };
  assert.deepEqual(validateLeadBriefPayload(base), { valid: false, error: 'invalid_evidenceMd' });
  assert.deepEqual(validateLeadBriefPayload({ ...base, evidenceMd: '   short   ' }), {
    valid: false,
    error: 'invalid_evidenceMd',
  });
  assert.deepEqual(validateLeadBriefPayload({ ...base, evidenceMd: 'x'.repeat(MAX_EVIDENCE_LENGTH + 1) }), {
    valid: false,
    error: 'evidence_too_long',
  });
  assert.deepEqual(validateLeadBriefPayload({ ...base, evidenceMd: '- אין וואטסאפ בדף הבית' }), {
    valid: true,
    value: { mode: 'generate', sessionId: SESSION_ID, evidenceMd: '- אין וואטסאפ בדף הבית' },
  });
});

// ── §F.6 save/approve semantics ─────────────────────────────────────────────

test('save for an unknown lead returns session_not_found and never writes', async () => {
  const deps = baseDeps({ getDiagnosticLeadBySessionId: async () => null });
  const outcome = await handleLeadBrief({ mode: 'save', sessionId: SESSION_ID, evidenceMd: 'e' }, deps);
  assert.deepEqual(outcome, { status: 'session_not_found' });
  assert.equal(deps.upsertCalls.length, 0);
});

test('save for a known lead upserts only the provided fields and returns a draft brief', async () => {
  const deps = baseDeps();
  const outcome = await handleLeadBrief(
    { mode: 'save', sessionId: SESSION_ID, evidenceMd: '- אין וואטסאפ', clientAuditMd: 'טיוטה ללקוח' },
    deps
  );
  assert.deepEqual(deps.upsertCalls, [
    { sessionId: SESSION_ID, evidenceMd: '- אין וואטסאפ', clientAuditMd: 'טיוטה ללקוח' },
  ]);
  assert.equal(outcome.status, 'saved');
  if (outcome.status === 'saved') {
    assert.equal(outcome.brief.status, 'draft');
    assert.equal(outcome.brief.evidenceMd, '- אין וואטסאפ');
    assert.equal(outcome.brief.internalBriefMd, null);
  }
});

test('approve with an existing draft returns the approved brief', async () => {
  const deps = baseDeps();
  const outcome = await handleLeadBrief({ mode: 'approve', sessionId: SESSION_ID }, deps);
  assert.deepEqual(deps.approveCalls, [SESSION_ID]);
  assert.equal(outcome.status, 'saved');
  if (outcome.status === 'saved') {
    assert.equal(outcome.brief.status, 'approved');
  }
});

test('approve without an existing row returns brief_not_found and never creates one', async () => {
  const deps = baseDeps({ approveLeadBrief: async () => null });
  const outcome = await handleLeadBrief({ mode: 'approve', sessionId: SESSION_ID }, deps);
  assert.deepEqual(outcome, { status: 'brief_not_found' });
  assert.equal(deps.upsertCalls.length, 0);
});

// ── generate: readback → compose → upsert draft ─────────────────────────────

const GENERATE_REQ: LeadBriefReq = { mode: 'generate', sessionId: SESSION_ID, evidenceMd: '- אין וואטסאפ בדף' };

test('generate for an unknown lead returns session_not_found and never composes', async () => {
  const deps = baseDeps({ getDiagnosticLeadBySessionId: async () => null });
  assert.deepEqual(await handleLeadBrief(GENERATE_REQ, deps), { status: 'session_not_found' });
  assert.equal(deps.composeCalls.length, 0);
  assert.equal(deps.upsertCalls.length, 0);
});

test('generate feeds the composer DB-derived answers and snapshot, never client data', async () => {
  const deps = baseDeps();
  await handleLeadBrief(GENERATE_REQ, deps);
  assert.equal(deps.composeCalls.length, 1);
  const input = deps.composeCalls[0];
  // exactly what the readback stubs returned — the request body carries none of it
  assert.equal(input.answers, FIXTURES.lead_flow_system);
  assert.equal(input.snapshot, SNAPSHOT);
  assert.equal(input.fullName, 'Mor Levi');
  assert.equal(input.businessName, 'Moriz Studio');
  assert.equal(input.link, 'https://moriz.example');
  assert.equal(input.evidenceMd, '- אין וואטסאפ בדף');
});

test('generate success upserts a draft with evidence and both briefs', async () => {
  const deps = baseDeps();
  const outcome = await handleLeadBrief(GENERATE_REQ, deps);
  assert.deepEqual(deps.upsertCalls, [
    {
      sessionId: SESSION_ID,
      evidenceMd: '- אין וואטסאפ בדף',
      internalBriefMd: 'בריף פנימי',
      clientAuditMd: 'תצפיות ללקוח',
    },
  ]);
  assert.equal(outcome.status, 'saved');
  if (outcome.status === 'saved') {
    assert.equal(outcome.brief.status, 'draft');
    assert.equal(outcome.brief.internalBriefMd, 'בריף פנימי');
  }
});

test('generate failure surfaces the typed reason and writes nothing', async () => {
  for (const reason of ['disabled', 'timeout', 'provider_error', 'invalid_output'] as const) {
    const deps = baseDeps({ composeLeadBrief: async () => ({ ok: false, reason }) });
    assert.deepEqual(await handleLeadBrief(GENERATE_REQ, deps), { status: 'ai_failed', reason });
    assert.equal(deps.upsertCalls.length, 0);
  }
});
