import type { AnswerValue, DiagnosticResult } from '../diagnostic-core/types.ts';
import { getSessionResultSnapshot, sessionExists } from './db/queries.ts';
import { upsertDiagnosticAnswer } from './db/mutations.ts';

export interface AnswerServiceDeps {
  sessionExists: (sessionId: string) => Promise<boolean>;
  getSessionResultSnapshot: (sessionId: string) => Promise<DiagnosticResult | null>;
  upsertDiagnosticAnswer: (sessionId: string, questionId: string, answer: AnswerValue) => Promise<void>;
}

export type ResolveAnswerSaveOutcome =
  | { status: 'not_found' }
  | { status: 'result_finalized' }
  | { status: 'ok' };

const defaultDeps: AnswerServiceDeps = {
  sessionExists,
  getSessionResultSnapshot,
  upsertDiagnosticAnswer,
};

export async function resolveAnswerSave(
  sessionId: string,
  questionId: string,
  answer: AnswerValue,
  deps: AnswerServiceDeps = defaultDeps
): Promise<ResolveAnswerSaveOutcome> {
  const exists = await deps.sessionExists(sessionId);
  if (!exists) return { status: 'not_found' };

  // A computed result is immutable: resolveDiagnosticResult returns the stored
  // snapshot first, so once one exists the session is closed to new answers.
  // Without this guard the stored answers can drift from the returned result —
  // e.g. a returning pre-slice visitor rewound to user_actions re-answers, the
  // answer is saved, but /result still returns the old snapshot. Send them back
  // to their finalized result instead of silently discarding the edit.
  const snapshot = await deps.getSessionResultSnapshot(sessionId);
  if (snapshot) return { status: 'result_finalized' };

  await deps.upsertDiagnosticAnswer(sessionId, questionId, answer);
  return { status: 'ok' };
}
