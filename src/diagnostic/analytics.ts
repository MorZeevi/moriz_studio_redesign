// P6a — typed funnel event foundation. P6c adds the real destination: see
// `emit` below, which posts to /api/diagnostic/events (server persists it).

import type { AnswerValue, LeadTier, SolutionType } from '../diagnostic-core/types.ts';
import type { AiFallbackReason } from './ai/types.ts';
import { getAttribution } from './attribution.ts';
import { withBasePath } from './basePath.ts';

export const DIAGNOSTIC_EVENT_NAMES = [
  'landing_view',
  'diagnostic_start',
  'question_answered',
  'diagnostic_completed',
  'result_viewed',
  'ai_personalization_started',
  'ai_personalization_generated',
  'ai_personalization_fallback',
  'contact_cta_clicked',
  'lead_form_started',
  'lead_submitted',
] as const;

export type DiagnosticEventName = (typeof DIAGNOSTIC_EVENT_NAMES)[number];

// Strips free-text content before it ever reaches an event payload — text
// answers carry only their type, never the value (payload safety rule).
export type AnsweredSummary =
  | { type: 'single'; optionId: string }
  | { type: 'multi'; optionIds: string[] }
  | { type: 'text' };

export function toAnsweredSummary(answer: AnswerValue): AnsweredSummary {
  if (answer.type === 'single') return { type: 'single', optionId: answer.optionId };
  if (answer.type === 'multi') return { type: 'multi', optionIds: answer.optionIds };
  return { type: 'text' };
}

// ai/types.ts's AiFallbackReason is pinned to server-decided outcomes only.
// Client-observed network/parse failures aren't in that enum — events use
// this local superset instead of widening the AI schema.
export const CLIENT_AI_FALLBACK_REASONS = [
  'disabled',
  'timeout',
  'provider_error',
  'invalid_output',
  'rate_limited',
  'fetch_failed',
] as const satisfies readonly (AiFallbackReason | 'fetch_failed')[];

export type ClientAiFallbackReason = (typeof CLIENT_AI_FALLBACK_REASONS)[number];

interface BaseEvent {
  sessionId?: string;
}

export type DiagnosticEvent =
  | ({ name: 'landing_view' } & BaseEvent)
  | ({ name: 'diagnostic_start' } & BaseEvent)
  | ({ name: 'question_answered'; questionId: string; answer: AnsweredSummary } & BaseEvent)
  | ({ name: 'diagnostic_completed' } & BaseEvent)
  | ({ name: 'result_viewed'; primarySolution: SolutionType; leadTier: LeadTier } & BaseEvent)
  | ({ name: 'ai_personalization_started' } & BaseEvent)
  | ({ name: 'ai_personalization_generated' } & BaseEvent)
  | ({ name: 'ai_personalization_fallback'; reason: ClientAiFallbackReason } & BaseEvent)
  | ({ name: 'contact_cta_clicked' } & BaseEvent)
  | ({ name: 'lead_form_started' } & BaseEvent)
  | ({ name: 'lead_submitted' } & BaseEvent);

// P6c: dev-console sink kept as-is; real destination is the fetch below,
// which always fires (including production — that's the whole point of
// collecting funnel data). Fire-and-forget: analytics must never throw back
// into a click handler or block the diagnostic flow, so errors are swallowed.
// keepalive lets a click-then-navigate event (e.g. lead_submitted) survive.
// SSR-guarded: trackDiagnosticEvent can run before a DOM exists, and a
// relative-URL fetch has no base outside a browser.
function emit(record: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[diagnostic:event]', record);
  }
  if (typeof window === 'undefined') return;
  fetch(withBasePath('/api/diagnostic/events'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
    keepalive: true,
  }).catch(() => {});
}

export function trackDiagnosticEvent(event: DiagnosticEvent): void {
  emit({ ...event, timestamp: new Date().toISOString(), attribution: getAttribution() ?? undefined });
}
