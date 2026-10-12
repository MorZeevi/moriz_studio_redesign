import { test } from 'node:test';
import assert from 'node:assert/strict';

import { FIXTURES } from '../diagnostic-core/fixtures.ts';
import { calculateDiagnosticResult } from '../diagnostic-core/scoring.ts';
import type { AnswerValue } from '../diagnostic-core/types.ts';
import { resolveAnswerSave, type AnswerServiceDeps } from './answerService.ts';

const SESSION_ID = '11111111-1111-1111-1111-111111111111';
const ANSWER: AnswerValue = { type: 'text', value: 'valid text' };

function baseDeps(overrides: Partial<AnswerServiceDeps> = {}): AnswerServiceDeps {
  return {
    sessionExists: async () => true,
    getSessionResultSnapshot: async () => null,
    upsertDiagnosticAnswer: async () => undefined,
    ...overrides,
  };
}

test('resolveAnswerSave saves an answer for an in-progress session with no snapshot', async () => {
  let saved: { sessionId: string; questionId: string; answer: AnswerValue } | undefined;

  const outcome = await resolveAnswerSave(
    SESSION_ID,
    'business_description',
    ANSWER,
    baseDeps({
      upsertDiagnosticAnswer: async (sessionId, questionId, answer) => {
        saved = { sessionId, questionId, answer };
      },
    })
  );

  assert.deepEqual(outcome, { status: 'ok' });
  assert.deepEqual(saved, {
    sessionId: SESSION_ID,
    questionId: 'business_description',
    answer: ANSWER,
  });
});

test('resolveAnswerSave rejects a new answer once a result snapshot exists (completed session is immutable)', async () => {
  const snapshot = calculateDiagnosticResult(FIXTURES.web_app);

  const outcome = await resolveAnswerSave(
    SESSION_ID,
    'user_actions',
    ANSWER,
    baseDeps({
      getSessionResultSnapshot: async () => snapshot,
      upsertDiagnosticAnswer: async () => {
        throw new Error('a finalized session must not accept new answers');
      },
    })
  );

  assert.deepEqual(outcome, { status: 'result_finalized' });
});

test('resolveAnswerSave returns not_found without reading the snapshot or writing', async () => {
  const outcome = await resolveAnswerSave(
    SESSION_ID,
    'business_description',
    ANSWER,
    baseDeps({
      sessionExists: async () => false,
      getSessionResultSnapshot: async () => {
        throw new Error('snapshot must not be read for a missing session');
      },
      upsertDiagnosticAnswer: async () => {
        throw new Error('answers must not be written for a missing session');
      },
    })
  );

  assert.deepEqual(outcome, { status: 'not_found' });
});
