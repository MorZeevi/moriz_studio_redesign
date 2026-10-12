import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildAiPersonalizationInput } from './input.ts';
import { generatePersonalization } from './personalize.ts';
import type { AiProvider, PersonalizedDiagnosticCopy } from './types.ts';
import { FIXTURES } from '../../diagnostic-core/fixtures.ts';
import { buildPersonalizationContext } from '../../diagnostic-core/personalizationContext.ts';
import { QUESTIONS } from '../../diagnostic-core/questions.ts';
import { RESULT_TEMPLATES } from '../../diagnostic-core/resultTemplates.ts';
import { calculateDiagnosticResult } from '../../diagnostic-core/scoring.ts';
import type { DiagnosticAnswers } from '../../diagnostic-core/types.ts';

function optionLabel(questionId: string, optionId: string | undefined): string | undefined {
  if (!optionId) return undefined;
  const question = QUESTIONS.find((q) => q.id === questionId);
  return question?.options?.find((o) => o.id === optionId)?.labelHe;
}

function assertWiredCorrectly(sessionId: string, answers: DiagnosticAnswers) {
  const result = calculateDiagnosticResult(answers);
  const context = buildPersonalizationContext(answers, result);
  const input = buildAiPersonalizationInput(sessionId, answers, result);

  assert.equal(input.sessionId, sessionId);
  assert.equal(input.businessDescription, context.businessDescription);
  assert.equal(input.primaryGoalHe, context.primaryGoalHe);
  assert.equal(input.biggestChallengeHe, context.biggestChallengeHe);
  assert.equal(input.currentAssetHe, context.currentAssetHe);
  assert.deepEqual(input.userActionsHe, context.userActionsHe);
  assert.equal(input.urgencyHe, context.urgencyHe);
  assert.equal(input.desiredProcessHe, context.desiredProcessHe);
  assert.equal(input.primarySolution, context.primarySolution);
  assert.equal(input.secondarySolution, context.secondarySolution);
  assert.equal(input.leadTier, context.leadTier);
  assert.equal(input.painScore, context.painScore);
  assert.deepEqual(input.reasonLabelsHe, context.reasonLabelsHe);

  const expectedSecondaryTitleHe = context.secondarySolution
    ? RESULT_TEMPLATES[context.secondarySolution].titleHe
    : undefined;
  assert.equal(input.secondaryTitleHe, expectedSecondaryTitleHe);

  const template = RESULT_TEMPLATES[context.primarySolution];
  assert.deepEqual(input.template, {
    titleHe: template.titleHe,
    shortDescriptionHe: template.shortDescriptionHe,
    whyHe: template.whyHe,
    whatToIncludeHe: template.whatToIncludeHe,
    whatNotToBuildNowHe: template.whatNotToBuildNowHe,
    recommendedNextStepHe: template.recommendedNextStepHe,
  });

  return { result, context, input };
}

// ── §E.1 Input builder per fixture ────────────────────────────────────────────

test('buildAiPersonalizationInput wires operations_crm fixture end to end', () => {
  const { input } = assertWiredCorrectly('session-operations-crm', FIXTURES.operations_crm);
  assert.equal(input.template.titleHe, RESULT_TEMPLATES.operations_crm.titleHe);
  assert.equal(input.currentAssetHe, optionLabel('current_asset', 'manual_process_to_digitize'));
  assert.ok(input.businessDescription);
  // P9a slice 2: track_work + the automation goal tie ops/ai at 8, so ai_automation
  // surfaces as the close secondary (gap 0 <= SECONDARY_SOLUTION_MAX_GAP).
  assert.equal(input.secondarySolution, 'ai_automation');
  assert.equal(input.secondaryTitleHe, RESULT_TEMPLATES.ai_automation.titleHe);
});

test('buildAiPersonalizationInput wires web_app fixture with no operations_crm framing', () => {
  const { input } = assertWiredCorrectly('session-web-app', FIXTURES.web_app);
  assert.equal(input.primarySolution, 'web_app');
  assert.equal(input.template.titleHe, RESULT_TEMPLATES.web_app.titleHe);
  assert.notEqual(input.template.titleHe, RESULT_TEMPLATES.operations_crm.titleHe);
  assert.equal(input.secondarySolution, undefined);
  assert.equal(input.secondaryTitleHe, undefined);
});

test('buildAiPersonalizationInput wires ai_automation fixture with operations_crm as secondary', () => {
  const { input } = assertWiredCorrectly('session-ai-automation', FIXTURES.ai_automation);
  assert.equal(input.template.titleHe, RESULT_TEMPLATES.ai_automation.titleHe);
  assert.equal(input.secondarySolution, 'operations_crm');
  assert.equal(input.secondaryTitleHe, RESULT_TEMPLATES.operations_crm.titleHe);
});

test('buildAiPersonalizationInput wires discovery fixture with its empty whatToIncludeHe carried faithfully', () => {
  const { input } = assertWiredCorrectly('session-discovery', FIXTURES.discovery);
  assert.equal(input.primarySolution, 'discovery');
  assert.deepEqual(input.template.whatToIncludeHe, RESULT_TEMPLATES.discovery.whatToIncludeHe);
  assert.equal(input.template.whatToIncludeHe.length, 0);
  assert.equal(input.secondarySolution, undefined);
});

test('buildAiPersonalizationInput omits absent optional facts instead of using empty strings', () => {
  const { input } = assertWiredCorrectly('session-empty', {});
  assert.equal(input.primarySolution, 'discovery');
  assert.equal(input.businessDescription, undefined);
  assert.equal(input.primaryGoalHe, undefined);
  assert.equal(input.biggestChallengeHe, undefined);
  assert.equal(input.currentAssetHe, undefined);
  assert.deepEqual(input.userActionsHe, []);
  assert.equal(input.urgencyHe, undefined);
  assert.equal(input.desiredProcessHe, undefined);
  assert.deepEqual(input.reasonLabelsHe, []);
  assert.equal(input.secondarySolution, undefined);
  assert.equal(input.secondaryTitleHe, undefined);
});

// ── §E.5a Compile-time guardrail: no decision fields on the AI output type ───

test('PersonalizedDiagnosticCopy has none of the decision fields (compile-time)', () => {
  type ForbiddenCopyKeys =
    | 'primarySolution'
    | 'secondarySolution'
    | 'leadTier'
    | 'solutionScores'
    | 'painScore'
    | 'leadQualityScore'
    | 'matchedSignals';
  type LeakedKeys = Extract<keyof PersonalizedDiagnosticCopy, ForbiddenCopyKeys>;
  const check: LeakedKeys extends never ? true : false = true;
  assert.equal(check, true);
});

// ── §E.5b Runtime immutability: the pipeline never mutates the DiagnosticResult ──

test('the AI personalization pipeline does not mutate the DiagnosticResult it is given', async () => {
  const answers = FIXTURES.operations_crm;
  const result = calculateDiagnosticResult(answers);
  const snapshot = structuredClone(result);

  buildAiPersonalizationInput('session-immutability', answers, result);

  const mockProvider: AiProvider = {
    name: 'mock-provider',
    model: 'mock-model',
    async generate() {
      return {
        ok: true,
        text: JSON.stringify({
          insightHe: 'Insight text',
          contextFitHe: 'Why this fits text',
        }),
      };
    },
  };

  const outcome = await generatePersonalization({
    enabled: true,
    getProvider: () => mockProvider,
    request: { systemPrompt: 'system', userPrompt: 'user', maxTokens: 100, temperature: 0.5, timeoutMs: 1000 },
  });

  assert.equal(outcome.status, 'generated');
  assert.deepEqual(result, snapshot);
});
