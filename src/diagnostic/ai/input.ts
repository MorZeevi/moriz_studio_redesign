import { buildPersonalizationContext } from '../../diagnostic-core/personalizationContext.ts';
import { RESULT_TEMPLATES } from '../../diagnostic-core/resultTemplates.ts';
import type { DiagnosticAnswers, DiagnosticResult } from '../../diagnostic-core/types.ts';
import type { AiPersonalizationInput } from './types.ts';

// Pure: wraps the already-decided result + personalization context into the
// AI input shape. No DB, no env, no network.
export function buildAiPersonalizationInput(
  sessionId: string,
  answers: DiagnosticAnswers,
  result: DiagnosticResult
): AiPersonalizationInput {
  const context = buildPersonalizationContext(answers, result);
  const template = result.resultTemplate;

  return {
    sessionId,
    businessDescription: context.businessDescription,
    primaryGoalHe: context.primaryGoalHe,
    biggestChallengeHe: context.biggestChallengeHe,
    currentAssetHe: context.currentAssetHe,
    userActionsHe: context.userActionsHe,
    urgencyHe: context.urgencyHe,
    desiredProcessHe: context.desiredProcessHe,
    primarySolution: context.primarySolution,
    secondarySolution: context.secondarySolution,
    secondaryTitleHe: context.secondarySolution
      ? RESULT_TEMPLATES[context.secondarySolution].titleHe
      : undefined,
    leadTier: context.leadTier,
    painScore: context.painScore,
    reasonLabelsHe: context.reasonLabelsHe,
    template: {
      titleHe: template.titleHe,
      shortDescriptionHe: template.shortDescriptionHe,
      whyHe: template.whyHe,
      whatToIncludeHe: [...template.whatToIncludeHe],
      whatNotToBuildNowHe: [...template.whatNotToBuildNowHe],
      recommendedNextStepHe: template.recommendedNextStepHe,
    },
  };
}
