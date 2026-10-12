import { test } from 'node:test';
import assert from 'node:assert/strict';

import { FIXTURES } from '../diagnostic-core/fixtures.ts';
import { calculateDiagnosticResult } from '../diagnostic-core/scoring.ts';
import type { DiagnosticAnswers, DiagnosticResult } from '../diagnostic-core/types.ts';
import { resolveDiagnosticResult, type ResultServiceDeps } from './resultService.ts';

const SESSION_ID = '11111111-1111-1111-1111-111111111111';

function baseDeps(overrides: Partial<ResultServiceDeps> = {}): ResultServiceDeps {
  return {
    sessionExists: async () => true,
    getSessionResultSnapshot: async () => null,
    getDiagnosticAnswers: async () => FIXTURES.trust_website,
    calculateDiagnosticResult,
    saveDiagnosticResultSnapshot: async () => undefined,
    ...overrides,
  };
}

test('resolveDiagnosticResult returns a stored snapshot without recalculating or persisting', async () => {
  const snapshot = calculateDiagnosticResult(FIXTURES.web_app);
  let snapshotReads = 0;

  const result = await resolveDiagnosticResult(
    SESSION_ID,
    baseDeps({
      getSessionResultSnapshot: async () => {
        snapshotReads += 1;
        return snapshot;
      },
      getDiagnosticAnswers: async () => {
        throw new Error('answers must not be read when a snapshot exists');
      },
      calculateDiagnosticResult: () => {
        throw new Error('result must not be recalculated when a snapshot exists');
      },
      saveDiagnosticResultSnapshot: async () => {
        throw new Error('snapshot must not be persisted again');
      },
    })
  );

  assert.equal(snapshotReads, 1);
  assert.deepEqual(result, { status: 'ok', result: snapshot, source: 'snapshot' });
});

test('resolveDiagnosticResult returns not_found without reading snapshot or answers', async () => {
  const result = await resolveDiagnosticResult(
    SESSION_ID,
    baseDeps({
      sessionExists: async () => false,
      getSessionResultSnapshot: async () => {
        throw new Error('snapshot must not be read for a missing session');
      },
      getDiagnosticAnswers: async () => {
        throw new Error('answers must not be read for a missing session');
      },
    })
  );

  assert.deepEqual(result, { status: 'not_found' });
});

test('resolveDiagnosticResult reports missing current required answers without calculating', async () => {
  const incomplete: DiagnosticAnswers = {
    business_description: { type: 'text', value: 'valid text' },
  };

  const result = await resolveDiagnosticResult(
    SESSION_ID,
    baseDeps({
      getDiagnosticAnswers: async () => incomplete,
      calculateDiagnosticResult: () => {
        throw new Error('incomplete answers must not be scored');
      },
    })
  );

  assert.equal(result.status, 'incomplete');
  assert.deepEqual(
    result.status === 'incomplete' ? result.missing : [],
    ['primary_goal', 'biggest_challenge', 'current_asset', 'user_actions', 'urgency', 'desired_process']
  );
});

test('resolveDiagnosticResult calculates and persists exactly once when no snapshot exists', async () => {
  const calculated = calculateDiagnosticResult(FIXTURES.trust_website);
  let calculateCalls = 0;
  let saved: { sessionId: string; result: DiagnosticResult } | undefined;

  const result = await resolveDiagnosticResult(
    SESSION_ID,
    baseDeps({
      calculateDiagnosticResult: (answers) => {
        calculateCalls += 1;
        assert.deepEqual(answers, FIXTURES.trust_website);
        return calculated;
      },
      saveDiagnosticResultSnapshot: async (sessionId, resultToSave) => {
        saved = { sessionId, result: resultToSave };
      },
    })
  );

  assert.equal(calculateCalls, 1);
  assert.deepEqual(saved, { sessionId: SESSION_ID, result: calculated });
  assert.deepEqual(result, { status: 'ok', result: calculated, source: 'calculated' });
});
