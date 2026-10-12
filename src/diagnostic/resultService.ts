import { calculateDiagnosticResult as calculateDiagnosticResultDefault } from '../diagnostic-core/scoring.ts';
import type { DiagnosticAnswers, DiagnosticResult } from '../diagnostic-core/types.ts';
import { getDiagnosticAnswers, getSessionResultSnapshot, sessionExists } from './db/queries.ts';
import { saveDiagnosticResultSnapshot } from './db/mutations.ts';
import { findMissingRequiredAnswers } from './validation.ts';

export interface ResultServiceDeps {
  sessionExists: (sessionId: string) => Promise<boolean>;
  getSessionResultSnapshot: (sessionId: string) => Promise<DiagnosticResult | null>;
  getDiagnosticAnswers: (sessionId: string) => Promise<DiagnosticAnswers>;
  calculateDiagnosticResult: (answers: DiagnosticAnswers) => DiagnosticResult;
  saveDiagnosticResultSnapshot: (sessionId: string, result: DiagnosticResult) => Promise<void>;
}

export type ResolveDiagnosticResultOutcome =
  | { status: 'not_found' }
  | { status: 'incomplete'; missing: string[] }
  | { status: 'ok'; result: DiagnosticResult; source: 'snapshot' | 'calculated' };

const defaultDeps: ResultServiceDeps = {
  sessionExists,
  getSessionResultSnapshot,
  getDiagnosticAnswers,
  calculateDiagnosticResult: calculateDiagnosticResultDefault,
  saveDiagnosticResultSnapshot,
};

export async function resolveDiagnosticResult(
  sessionId: string,
  deps: ResultServiceDeps = defaultDeps
): Promise<ResolveDiagnosticResultOutcome> {
  const exists = await deps.sessionExists(sessionId);
  if (!exists) return { status: 'not_found' };

  const snapshot = await deps.getSessionResultSnapshot(sessionId);
  if (snapshot) {
    return { status: 'ok', result: snapshot, source: 'snapshot' };
  }

  const answers = await deps.getDiagnosticAnswers(sessionId);
  const missing = findMissingRequiredAnswers(answers);
  if (missing.length > 0) {
    return { status: 'incomplete', missing };
  }

  const result = deps.calculateDiagnosticResult(answers);
  await deps.saveDiagnosticResultSnapshot(sessionId, result);
  return { status: 'ok', result, source: 'calculated' };
}
