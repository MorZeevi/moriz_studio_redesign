import { QUESTIONS } from './questions.ts';
import { getMultiAnswers, getSingleAnswer, getTextAnswer } from './scoring.ts';
import type {
  DiagnosticAnswers,
  DiagnosticResult,
  LeadTier,
  MatchedSignal,
  SolutionType,
} from './types.ts';

// ── P5 AI contract ───────────────────────────────────────────────────────────
// This context object is the ONLY input a future AI personalization layer may
// consume. The deterministic result is already decided before this is built.
// The AI layer must:
//   1. NOT decide or change the primary solution.
//   2. NOT change the lead tier or any score.
//   3. NOT recommend a different solution than primarySolution.
// It may only reword/personalize the already-decided result (e.g. open with
// the visitor's own business description, echo their words). If the AI layer
// is down or slow, the result page renders fully without it.
// This module stays pure: no framework, no network, no browser APIs.

const MAX_FREE_TEXT_LENGTH = 2000; // mirrors the validation layer's text cap

export interface PersonalizationContext {
  // Free text, verbatim from the user (trimmed, capped).
  businessDescription?: string;
  // Selected-answer labels in Hebrew, for natural phrasing.
  primaryGoalHe?: string;
  biggestChallengeHe?: string;
  currentAssetHe?: string;
  userActionsHe: string[];
  urgencyHe?: string;
  desiredProcessHe?: string;
  // The already-decided outcome. Read-only facts for the AI layer.
  primarySolution: SolutionType;
  secondarySolution?: SolutionType;
  resultTitleHe: string;
  leadTier: LeadTier;
  painScore: number;
  // Why the winning bucket won: its scoring trace + human-readable labels.
  winningSignals: MatchedSignal[];
  reasonLabelsHe: string[];
}

function optionLabel(questionId: string, optionId: string | undefined): string | undefined {
  if (!optionId) return undefined;
  const question = QUESTIONS.find((q) => q.id === questionId);
  return question?.options?.find((o) => o.id === optionId)?.labelHe;
}

function boundedText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, MAX_FREE_TEXT_LENGTH);
}

export function buildPersonalizationContext(
  answers: DiagnosticAnswers,
  result: DiagnosticResult
): PersonalizationContext {
  const winningSignals = result.matchedSignals[result.primarySolution] ?? [];

  // Reason labels come ONLY from the winning bucket's matched signals: either
  // the rule's own reasonHe or the selected option's label. Deduped, ordered
  // by signal order (strongest-first ordering is the scorer's concern).
  const reasonLabelsHe = [
    ...new Set(
      winningSignals
        .map((signal) => signal.reasonHe ?? optionLabel(signal.questionId, signal.optionId))
        .filter((label): label is string => Boolean(label))
    ),
  ];

  return {
    businessDescription: boundedText(getTextAnswer(answers, 'business_description')),
    primaryGoalHe: optionLabel('primary_goal', getSingleAnswer(answers, 'primary_goal')),
    biggestChallengeHe: optionLabel(
      'biggest_challenge',
      getSingleAnswer(answers, 'biggest_challenge')
    ),
    currentAssetHe: optionLabel('current_asset', getSingleAnswer(answers, 'current_asset')),
    userActionsHe: getMultiAnswers(answers, 'user_actions')
      .map((optionId) => optionLabel('user_actions', optionId))
      .filter((label): label is string => Boolean(label)),
    urgencyHe: optionLabel('urgency', getSingleAnswer(answers, 'urgency')),
    desiredProcessHe: optionLabel('desired_process', getSingleAnswer(answers, 'desired_process')),
    primarySolution: result.primarySolution,
    secondarySolution: result.secondarySolution,
    resultTitleHe: result.resultTemplate.titleHe,
    leadTier: result.leadTier,
    painScore: result.painScore,
    winningSignals,
    reasonLabelsHe,
  };
}
