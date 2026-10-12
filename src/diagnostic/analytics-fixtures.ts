// P6d — synthetic funnel scenarios for analytics QA. Every event is built as
// a raw wire payload and piped through the real validateEventPayload (the
// same function app/api/diagnostic/events/route.ts calls), so a passing
// fixture proves the production ingest boundary accepts it without needing a
// live Supabase instance. Session ids all share the `facade00-` hex prefix
// so synthetic data can never be mistaken for a real session id.

import { validateEventPayload } from './validation.ts';
import type { EventReq } from './api-types.ts';
import type { Attribution } from './attribution.ts';

function syntheticSessionId(suffix: string): string {
  return `facade00-0000-4000-a000-${suffix.padStart(12, '0')}`;
}

function toEventReq(raw: unknown): EventReq {
  const result = validateEventPayload(raw);
  if (!result.valid) {
    throw new Error(`invalid synthetic fixture event (${result.error}): ${JSON.stringify(raw)}`);
  }
  return result.value;
}

interface ScenarioOptions {
  sessionId: string;
  startIso: string;
  attribution?: Attribution;
}

interface RawEventFields {
  name: string;
  questionId?: string;
  answer?: unknown;
  primarySolution?: string;
  leadTier?: string;
  reason?: string;
}

function withCommon(raw: RawEventFields, opts: ScenarioOptions, minuteOffset: number): unknown {
  const timestamp = new Date(new Date(opts.startIso).getTime() + minuteOffset * 60_000).toISOString();
  return {
    ...raw,
    sessionId: opts.sessionId,
    timestamp,
    attribution: opts.attribution ?? { landingPath: '/digital-audit', firstSeenAt: opts.startIso },
  };
}

// The 7 questions in questions.ts order, each with a real option id — shared
// by every full-conversion scenario (A, E). P9a slice 2: personalization_need
// removed; user_actions reworded to the current-workflow ids.
function fullAnswerEvents(opts: ScenarioOptions, startMinute: number): unknown[] {
  const answers: { questionId: string; answer: unknown }[] = [
    { questionId: 'business_description', answer: { type: 'text' } },
    { questionId: 'primary_goal', answer: { type: 'single', optionId: 'generate_leads' } },
    { questionId: 'biggest_challenge', answer: { type: 'single', optionId: 'site_not_converting' } },
    { questionId: 'current_asset', answer: { type: 'single', optionId: 'basic_site' } },
    { questionId: 'user_actions', answer: { type: 'multi', optionIds: ['contact_or_book', 'understand_fit'] } },
    { questionId: 'urgency', answer: { type: 'single', optionId: 'asap' } },
    { questionId: 'desired_process', answer: { type: 'single', optionId: 'full_process' } },
  ];
  return answers.map((a, i) =>
    withCommon({ name: 'question_answered', questionId: a.questionId, answer: a.answer }, opts, startMinute + i)
  );
}

// Scenario A / E shape: landing -> start -> 7 answers -> completed -> result
// -> AI generated -> CTA -> lead form -> lead submitted.
function fullConversion(opts: ScenarioOptions, primarySolution: string, leadTier: string): EventReq[] {
  const raw: unknown[] = [
    withCommon({ name: 'landing_view' }, opts, 0),
    withCommon({ name: 'diagnostic_start' }, opts, 1),
    ...fullAnswerEvents(opts, 2),
    withCommon({ name: 'diagnostic_completed' }, opts, 10),
    withCommon({ name: 'result_viewed', primarySolution, leadTier }, opts, 11),
    withCommon({ name: 'ai_personalization_generated' }, opts, 12),
    withCommon({ name: 'contact_cta_clicked' }, opts, 13),
    withCommon({ name: 'lead_form_started' }, opts, 14),
    withCommon({ name: 'lead_submitted' }, opts, 15),
  ];
  return raw.map(toEventReq);
}

// A — full conversion, no campaign attribution (organic/direct).
export const SCENARIO_A: EventReq[] = fullConversion(
  { sessionId: syntheticSessionId('a'), startIso: '2026-07-01T10:00:00.000Z' },
  'lead_flow_system',
  'A'
);

// B — dropoff after 2 answered questions, session never completes.
export const SCENARIO_B: EventReq[] = (() => {
  const opts: ScenarioOptions = { sessionId: syntheticSessionId('b'), startIso: '2026-07-01T11:00:00.000Z' };
  const raw: unknown[] = [
    withCommon({ name: 'landing_view' }, opts, 0),
    withCommon({ name: 'diagnostic_start' }, opts, 1),
    withCommon({ name: 'question_answered', questionId: 'business_description', answer: { type: 'text' } }, opts, 2),
    withCommon(
      { name: 'question_answered', questionId: 'primary_goal', answer: { type: 'single', optionId: 'not_sure' } },
      opts,
      3
    ),
  ];
  return raw.map(toEventReq);
})();

// C — completed, result viewed, no CTA click (silent bounce on the result page).
export const SCENARIO_C: EventReq[] = (() => {
  const opts: ScenarioOptions = { sessionId: syntheticSessionId('c'), startIso: '2026-07-01T12:00:00.000Z' };
  const raw: unknown[] = [
    withCommon({ name: 'landing_view' }, opts, 0),
    withCommon({ name: 'diagnostic_start' }, opts, 1),
    withCommon({ name: 'diagnostic_completed' }, opts, 2),
    withCommon({ name: 'result_viewed', primarySolution: 'trust_website', leadTier: 'C' }, opts, 3),
  ];
  return raw.map(toEventReq);
})();

// D — completed, result viewed, AI falls back instead of generating.
export const SCENARIO_D: EventReq[] = (() => {
  const opts: ScenarioOptions = { sessionId: syntheticSessionId('d'), startIso: '2026-07-01T13:00:00.000Z' };
  const raw: unknown[] = [
    withCommon({ name: 'landing_view' }, opts, 0),
    withCommon({ name: 'diagnostic_start' }, opts, 1),
    withCommon({ name: 'diagnostic_completed' }, opts, 2),
    withCommon({ name: 'result_viewed', primarySolution: 'ai_automation', leadTier: 'B' }, opts, 3),
    withCommon({ name: 'ai_personalization_fallback', reason: 'timeout' }, opts, 4),
  ];
  return raw.map(toEventReq);
})();

// E — full conversion with UTM attribution. Two sources sharing one campaign
// so utm_source and utm_campaign grouping can be told apart in the report.
export const SCENARIO_E_META: EventReq[] = fullConversion(
  {
    sessionId: syntheticSessionId('e1'),
    startIso: '2026-07-01T14:00:00.000Z',
    attribution: {
      landingPath: '/digital-audit',
      firstSeenAt: '2026-07-01T14:00:00.000Z',
      utm: { utm_source: 'meta', utm_campaign: 'test_campaign' },
    },
  },
  'web_app',
  'A'
);

export const SCENARIO_E_LINKEDIN: EventReq[] = fullConversion(
  {
    sessionId: syntheticSessionId('e2'),
    startIso: '2026-07-01T15:00:00.000Z',
    attribution: {
      landingPath: '/digital-audit',
      firstSeenAt: '2026-07-01T15:00:00.000Z',
      utm: { utm_source: 'linkedin', utm_campaign: 'test_campaign' },
    },
  },
  'operations_crm',
  'B'
);

export const ALL_SYNTHETIC_EVENTS: EventReq[] = [
  ...SCENARIO_A,
  ...SCENARIO_B,
  ...SCENARIO_C,
  ...SCENARIO_D,
  ...SCENARIO_E_META,
  ...SCENARIO_E_LINKEDIN,
];
