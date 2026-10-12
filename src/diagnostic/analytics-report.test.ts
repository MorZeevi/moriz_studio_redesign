import { test } from 'node:test';
import assert from 'node:assert/strict';

import type { EventReq } from './api-types.ts';
import { validateEventPayload } from './validation.ts';
import {
  ALL_SYNTHETIC_EVENTS,
  SCENARIO_A,
  SCENARIO_B,
  SCENARIO_C,
  SCENARIO_D,
  SCENARIO_E_META,
  SCENARIO_E_LINKEDIN,
} from './analytics-fixtures.ts';
import {
  buildFunnelSummary,
  questionAnsweredCounts,
  primarySolutionDistribution,
  leadTierDistribution,
  conversionByUtmSource,
  conversionByUtmCampaign,
} from './analytics-report.ts';

// Proves scenario 1 of the dispatch: every synthetic event is shaped exactly
// like a real event would be after passing through the production ingest
// boundary (app/api/diagnostic/events/route.ts calls this same validator).
test('every synthetic fixture event round-trips through the real event validator', () => {
  for (const event of ALL_SYNTHETIC_EVENTS) {
    const result = validateEventPayload(event);
    assert.equal(result.valid, true, `expected ${event.name} (${event.sessionId}) to validate`);
  }
});

test('every synthetic fixture session id is identifiable as synthetic', () => {
  for (const event of ALL_SYNTHETIC_EVENTS) {
    assert.equal(event.sessionId?.startsWith('facade00-'), true, `unexpected sessionId shape: ${event.sessionId}`);
  }
});

test('buildFunnelSummary on no events never throws and reports all-zero', () => {
  assert.deepEqual(buildFunnelSummary([]), {
    sessionsStarted: 0,
    diagnosticCompletions: 0,
    resultViews: 0,
    completionRate: 0,
    ctaClicks: 0,
    leadSubmissions: 0,
    aiGenerated: 0,
    aiFallback: 0,
  });
});

test('scenario A (full conversion) produces a completionRate of 1 and an AI-generated result', () => {
  assert.deepEqual(buildFunnelSummary(SCENARIO_A), {
    sessionsStarted: 1,
    diagnosticCompletions: 1,
    resultViews: 1,
    completionRate: 1,
    ctaClicks: 1,
    leadSubmissions: 1,
    aiGenerated: 1,
    aiFallback: 0,
  });
});

test('scenario B (dropoff) never completes and stops after 2 answered questions', () => {
  assert.deepEqual(buildFunnelSummary(SCENARIO_B), {
    sessionsStarted: 1,
    diagnosticCompletions: 0,
    resultViews: 0,
    completionRate: 0,
    ctaClicks: 0,
    leadSubmissions: 0,
    aiGenerated: 0,
    aiFallback: 0,
  });
  assert.deepEqual(questionAnsweredCounts(SCENARIO_B), {
    business_description: 1,
    primary_goal: 1,
  });
});

test('scenario C (completed, no CTA) completes and views the result but never clicks through', () => {
  assert.deepEqual(buildFunnelSummary(SCENARIO_C), {
    sessionsStarted: 1,
    diagnosticCompletions: 1,
    resultViews: 1,
    completionRate: 1,
    ctaClicks: 0,
    leadSubmissions: 0,
    aiGenerated: 0,
    aiFallback: 0,
  });
  assert.deepEqual(primarySolutionDistribution(SCENARIO_C), { trust_website: 1 });
  assert.deepEqual(leadTierDistribution(SCENARIO_C), { C: 1 });
});

test('scenario D (AI fallback) is distinguishable from an AI-generated result', () => {
  assert.deepEqual(buildFunnelSummary(SCENARIO_D), {
    sessionsStarted: 1,
    diagnosticCompletions: 1,
    resultViews: 1,
    completionRate: 1,
    ctaClicks: 0,
    leadSubmissions: 0,
    aiGenerated: 0,
    aiFallback: 1,
  });
});

test('scenario E (UTM attributed leads) buckets conversion by utm_source and utm_campaign', () => {
  const events = [...SCENARIO_E_META, ...SCENARIO_E_LINKEDIN];
  assert.deepEqual(conversionByUtmSource(events), {
    meta: { sessions: 1, leadSubmissions: 1, conversionRate: 1 },
    linkedin: { sessions: 1, leadSubmissions: 1, conversionRate: 1 },
  });
  assert.deepEqual(conversionByUtmCampaign(events), {
    test_campaign: { sessions: 2, leadSubmissions: 2, conversionRate: 1 },
  });
});

// Regression guard for the dedupe branch (seen.has(dedupeKey)) — a repeat
// answer to the same question in the same session (e.g. user goes back and
// re-answers) must not be double-counted.
test('questionAnsweredCounts collapses a repeated answer to the same question in the same session', () => {
  const sessionId = 'facade00-0000-4000-a000-000000000099';
  const events: EventReq[] = [
    {
      name: 'question_answered',
      sessionId,
      timestamp: '2026-07-01T10:00:00.000Z',
      questionId: 'primary_goal',
      answer: { type: 'single', optionId: 'generate_leads' },
    },
    {
      name: 'question_answered',
      sessionId,
      timestamp: '2026-07-01T10:05:00.000Z',
      questionId: 'primary_goal',
      answer: { type: 'single', optionId: 'not_sure' },
    },
  ];
  assert.deepEqual(questionAnsweredCounts(events), { primary_goal: 1 });
});

test('questionAnsweredCounts still counts historical personalization_need events', () => {
  const sessionId = 'facade00-0000-4000-a000-000000000098';
  const event = validateEventPayload({
    name: 'question_answered',
    sessionId,
    timestamp: '2026-07-01T10:00:00.000Z',
    questionId: 'personalization_need',
    answer: { type: 'single', optionId: 'by_user_data' },
  });
  assert.equal(event.valid, true);

  assert.deepEqual(questionAnsweredCounts(event.valid ? [event.value] : []), {
    personalization_need: 1,
  });
});

test('combined synthetic dataset produces the expected report across every metric', () => {
  assert.deepEqual(buildFunnelSummary(ALL_SYNTHETIC_EVENTS), {
    sessionsStarted: 6,
    diagnosticCompletions: 5,
    resultViews: 5,
    completionRate: 5 / 6,
    ctaClicks: 3,
    leadSubmissions: 3,
    aiGenerated: 3,
    aiFallback: 1,
  });

  assert.deepEqual(questionAnsweredCounts(ALL_SYNTHETIC_EVENTS), {
    business_description: 4,
    primary_goal: 4,
    biggest_challenge: 3,
    current_asset: 3,
    user_actions: 3,
    urgency: 3,
    desired_process: 3,
  });

  assert.deepEqual(primarySolutionDistribution(ALL_SYNTHETIC_EVENTS), {
    lead_flow_system: 1,
    trust_website: 1,
    ai_automation: 1,
    web_app: 1,
    operations_crm: 1,
  });

  assert.deepEqual(leadTierDistribution(ALL_SYNTHETIC_EVENTS), {
    A: 2,
    C: 1,
    B: 2,
  });

  assert.deepEqual(conversionByUtmSource(ALL_SYNTHETIC_EVENTS), {
    direct: { sessions: 4, leadSubmissions: 1, conversionRate: 0.25 },
    meta: { sessions: 1, leadSubmissions: 1, conversionRate: 1 },
    linkedin: { sessions: 1, leadSubmissions: 1, conversionRate: 1 },
  });

  assert.deepEqual(conversionByUtmCampaign(ALL_SYNTHETIC_EVENTS), {
    direct: { sessions: 4, leadSubmissions: 1, conversionRate: 0.25 },
    test_campaign: { sessions: 2, leadSubmissions: 2, conversionRate: 1 },
  });
});
