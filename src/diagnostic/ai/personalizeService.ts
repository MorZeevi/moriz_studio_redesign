import { calculateDiagnosticResult } from '../../diagnostic-core/scoring.ts';
import type { DiagnosticAnswers } from '../../diagnostic-core/types.ts';
import { getDiagnosticAnswers as getDiagnosticAnswersReal, sessionExists as sessionExistsReal } from '../db/queries.ts';
import { findMissingRequiredAnswers } from '../validation.ts';
import { buildAiPersonalizationInput } from './input.ts';
import { generatePersonalization } from './personalize.ts';
import { buildPersonalizationRequest } from './prompt.ts';
import { resolveAiRuntime, type AiRuntime } from './provider.ts';
import type { AiFallbackReason, PersonalizedDiagnosticCopy } from './types.ts';

// ── P5d service ───────────────────────────────────────────────────────────
// Thin route handler (app/api/diagnostic/personalize/route.ts) delegates all
// flow logic here. sessionId is the ONLY client-trusted input — everything
// else (answers, the deterministic result, the AI facts) is rebuilt
// server-side on every call. Never trust a client-submitted result.
//
// DI note: dependencies default to the real implementations so production
// callers can invoke personalizeSession(sessionId) with no second argument.
// Tests inject stubbed DB functions and a resolveRuntime that wraps a fake
// env (never process.env). This file never reads process.env itself — that
// stays the sole responsibility of provider.ts's resolveAiRuntime default.

export type PersonalizeOutcome =
  | { status: 'session_not_found' }
  | { status: 'missing_required_answers'; missing: string[] }
  | { status: 'generated'; copy: PersonalizedDiagnosticCopy }
  | { status: 'fallback'; reason: AiFallbackReason };

export interface PersonalizeServiceDeps {
  sessionExists: (sessionId: string) => Promise<boolean>;
  getDiagnosticAnswers: (sessionId: string) => Promise<DiagnosticAnswers>;
  resolveRuntime: () => AiRuntime;
}

const defaultDeps: PersonalizeServiceDeps = {
  sessionExists: sessionExistsReal,
  getDiagnosticAnswers: getDiagnosticAnswersReal,
  resolveRuntime: () => resolveAiRuntime(),
};

function logPersonalizeAttempt(
  sessionId: string,
  aiResult: Awaited<ReturnType<typeof generatePersonalization>>,
  latencyMs: number
): void {
  // Log hygiene (plan §6.11/§9): one line, no API key, no prompt, no raw
  // provider body — only the closed-enum status/reason + timing/model.
  if (aiResult.status === 'generated') {
    console.log('[diagnostic] personalize', {
      sessionId,
      status: aiResult.status,
      model: aiResult.model,
      latencyMs,
    });
    return;
  }
  console.log('[diagnostic] personalize', {
    sessionId,
    status: aiResult.status,
    reason: aiResult.reason,
    latencyMs,
  });
}

export async function personalizeSession(
  sessionId: string,
  deps: PersonalizeServiceDeps = defaultDeps
): Promise<PersonalizeOutcome> {
  const exists = await deps.sessionExists(sessionId);
  if (!exists) {
    return { status: 'session_not_found' };
  }

  const answers = await deps.getDiagnosticAnswers(sessionId);
  const missing = findMissingRequiredAnswers(answers);
  if (missing.length > 0) {
    return { status: 'missing_required_answers', missing };
  }

  // Recompute the canonical result server-side. Never trust any
  // client-submitted result — the caller only ever supplies sessionId.
  const result = calculateDiagnosticResult(answers);
  const input = buildAiPersonalizationInput(sessionId, answers, result);
  const runtime = deps.resolveRuntime();
  const request = buildPersonalizationRequest(input, {
    timeoutMs: runtime.timeoutMs,
    maxTokens: runtime.maxTokens,
  });

  const startedAt = Date.now();
  const aiResult = await generatePersonalization({
    enabled: runtime.enabled,
    getProvider: runtime.getProvider,
    request,
  });
  const latencyMs = aiResult.status === 'generated' ? aiResult.latencyMs : Date.now() - startedAt;
  logPersonalizeAttempt(sessionId, aiResult, latencyMs);

  if (aiResult.status === 'generated') {
    return { status: 'generated', copy: aiResult.copy };
  }
  return { status: 'fallback', reason: aiResult.reason };
}
