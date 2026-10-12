import { test } from 'node:test';
import assert from 'node:assert/strict';

import { FIXTURES } from '../../diagnostic-core/fixtures.ts';
import { RESULT_TEMPLATES } from '../../diagnostic-core/resultTemplates.ts';
import { calculateDiagnosticResult } from '../../diagnostic-core/scoring.ts';
import { buildAiPersonalizationInput } from './input.ts';
import { buildPersonalizationRequest } from './prompt.ts';
import type { AiPersonalizationInput } from './types.ts';

function fixtureInput(name: keyof typeof FIXTURES): AiPersonalizationInput {
  const answers = FIXTURES[name];
  return buildAiPersonalizationInput(
    `session-${name}`,
    answers,
    calculateDiagnosticResult(answers)
  );
}

test('builds a compact operations_crm request with the required facts and taxonomy rule', () => {
  const input = fixtureInput('operations_crm');
  const request = buildPersonalizationRequest(input);

  assert.match(
    request.systemPrompt,
    /אם הפתרון הוא "מערכת תפעולית \/ CRM מותאם": שמרו על מסגור תפעולי/
  );
  assert.match(request.systemPrompt, /אל תציגו את זה כאתר ואל תציגו את זה כאוטומציית AI/);
  assert.ok(request.userPrompt.includes('"id":"operations_crm"'));
  assert.ok(request.userPrompt.includes(RESULT_TEMPLATES.operations_crm.titleHe));
  assert.ok(request.userPrompt.includes(`"leadTier":"${input.leadTier}"`));
  assert.ok(request.userPrompt.includes(input.businessDescription as string));
  assert.ok(request.userPrompt.includes(input.currentAssetHe as string));
  for (const action of input.userActionsHe) assert.ok(request.userPrompt.includes(action));
  for (const reason of input.reasonLabelsHe.slice(0, 3)) {
    assert.ok(request.userPrompt.includes(reason));
  }
  assert.ok(request.userPrompt.includes(input.template.shortDescriptionHe));
  assert.equal(request.userPrompt.includes(input.template.whyHe), false);
  assert.equal(request.userPrompt.includes(input.template.whatNotToBuildNowHe[0] as string), false);
  assert.equal(request.userPrompt.includes(input.template.recommendedNextStepHe), false);
  assert.ok(request.systemPrompt.length + request.userPrompt.length < 2200);
});

test('builds the web_app request without operations_crm result framing', () => {
  const input = fixtureInput('web_app');
  const request = buildPersonalizationRequest(input);

  assert.ok(request.userPrompt.includes('"id":"web_app"'));
  assert.ok(request.userPrompt.includes(RESULT_TEMPLATES.web_app.titleHe));
  assert.equal(request.userPrompt.includes(RESULT_TEMPLATES.operations_crm.titleHe), false);
  assert.equal(request.userPrompt.includes('operations_crm'), false);
});

test('keeps ai_automation distinct without sending its secondary solution', () => {
  const input = fixtureInput('ai_automation');
  const request = buildPersonalizationRequest(input);

  assert.equal(input.secondaryTitleHe, RESULT_TEMPLATES.operations_crm.titleHe);
  assert.ok(request.userPrompt.includes('"id":"ai_automation"'));
  assert.ok(request.userPrompt.includes(RESULT_TEMPLATES.ai_automation.titleHe));
  assert.equal(request.userPrompt.includes(RESULT_TEMPLATES.operations_crm.titleHe), false);
  assert.equal(request.userPrompt.includes('operations_crm'), false);
});

test('builds discovery framing and omits absent optional facts entirely', () => {
  const input: AiPersonalizationInput = {
    ...fixtureInput('discovery'),
    businessDescription: undefined,
    primaryGoalHe: undefined,
    biggestChallengeHe: undefined,
    currentAssetHe: undefined,
    urgencyHe: undefined,
    desiredProcessHe: undefined,
  };
  const request = buildPersonalizationRequest(input);

  assert.match(
    request.systemPrompt,
    /אם הפתרון הוא "שיחת גילוי ראשונית": שקפו בכנות שהצורך עוד לא חד/
  );
  assert.ok(request.userPrompt.includes(RESULT_TEMPLATES.discovery.titleHe));
  assert.equal(request.userPrompt.includes('"businessDescription"'), false);
  assert.equal(request.userPrompt.includes('"primaryGoalHe"'), false);
  assert.equal(request.userPrompt.includes('"biggestChallengeHe"'), false);
  assert.equal(request.userPrompt.includes('"currentAssetHe"'), false);
  assert.equal(request.userPrompt.includes('"urgencyHe"'), false);
  assert.equal(request.userPrompt.includes('"desiredProcessHe"'), false);
  assert.equal(request.userPrompt.includes('undefined'), false);
  assert.equal(request.userPrompt.includes('""'), false);
});

test('sets the compact default output cap, provider-neutral temperature, and timeout', () => {
  const request = buildPersonalizationRequest(fixtureInput('operations_crm'));

  assert.equal(request.maxTokens, 400);
  assert.equal(request.temperature, 0.3);
  assert.equal(request.timeoutMs, 8000);
});

test('honors an explicit timeout override', () => {
  const request = buildPersonalizationRequest(fixtureInput('operations_crm'), { timeoutMs: 2500 });
  assert.equal(request.timeoutMs, 2500);
});

test('honors an explicit max token override', () => {
  const request = buildPersonalizationRequest(fixtureInput('operations_crm'), { maxTokens: 320 });
  assert.equal(request.maxTokens, 320);
});

test('contains no long dash in the Hebrew prompt copy', () => {
  for (const fixtureName of Object.keys(FIXTURES) as Array<keyof typeof FIXTURES>) {
    const request = buildPersonalizationRequest(fixtureInput(fixtureName));
    assert.doesNotMatch(request.systemPrompt, /[–—]/);
    assert.doesNotMatch(request.userPrompt, /[–—]/);
  }
});
