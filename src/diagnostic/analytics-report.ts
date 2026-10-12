// P6d — pure query/report functions over diagnostic events. No DB access:
// takes an EventReq[] (real rows or synthetic fixtures) and computes funnel
// metrics. Same functions will run over a real Supabase readback later —
// only the source of the array changes, not this module.

import type { EventReq } from './api-types.ts';
import type { DiagnosticEventName } from './analytics.ts';

function distinctSessionIds(events: EventReq[], name: DiagnosticEventName): Set<string> {
  const ids = new Set<string>();
  for (const e of events) {
    if (e.name === name && e.sessionId !== undefined) ids.add(e.sessionId);
  }
  return ids;
}

function tally(
  events: EventReq[],
  name: DiagnosticEventName,
  pick: (e: EventReq) => string | undefined
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of events) {
    if (e.name !== name) continue;
    const key = pick(e);
    if (key === undefined) continue;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export interface FunnelSummary {
  sessionsStarted: number;
  diagnosticCompletions: number;
  resultViews: number;
  completionRate: number;
  ctaClicks: number;
  leadSubmissions: number;
  aiGenerated: number;
  aiFallback: number;
}

export function buildFunnelSummary(events: EventReq[]): FunnelSummary {
  const sessionsStarted = distinctSessionIds(events, 'diagnostic_start').size;
  const diagnosticCompletions = distinctSessionIds(events, 'diagnostic_completed').size;
  const resultViews = distinctSessionIds(events, 'result_viewed').size;
  const ctaClicks = distinctSessionIds(events, 'contact_cta_clicked').size;
  const leadSubmissions = distinctSessionIds(events, 'lead_submitted').size;
  const aiGenerated = distinctSessionIds(events, 'ai_personalization_generated').size;
  const aiFallback = distinctSessionIds(events, 'ai_personalization_fallback').size;

  return {
    sessionsStarted,
    diagnosticCompletions,
    resultViews,
    completionRate: sessionsStarted === 0 ? 0 : diagnosticCompletions / sessionsStarted,
    ctaClicks,
    leadSubmissions,
    aiGenerated,
    aiFallback,
  };
}

// Distinct sessions per questionId — shows where the funnel thins out
// question-by-question (e.g. scenario B stops after `primary_goal`).
export function questionAnsweredCounts(events: EventReq[]): Record<string, number> {
  const seen = new Set<string>();
  const counts: Record<string, number> = {};
  for (const e of events) {
    if (e.name !== 'question_answered' || e.sessionId === undefined || e.questionId === undefined) continue;
    const dedupeKey = `${e.sessionId}::${e.questionId}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    counts[e.questionId] = (counts[e.questionId] ?? 0) + 1;
  }
  return counts;
}

// Known deferred issue (see process/codex-review-debt.md, P6d row): these
// two count per-event, not per-session like the rest of this module — will
// diverge once result_viewed fires more than once per session.
export function primarySolutionDistribution(events: EventReq[]): Record<string, number> {
  return tally(events, 'result_viewed', (e) => e.primarySolution);
}

export function leadTierDistribution(events: EventReq[]): Record<string, number> {
  return tally(events, 'result_viewed', (e) => e.leadTier);
}

const DIRECT_BUCKET = 'direct';

export interface UtmConversion {
  sessions: number;
  leadSubmissions: number;
  conversionRate: number;
}

// Buckets each session by its first-seen attribution (attribution is
// first-touch and identical across every event in a session, see
// attribution.ts's getAttribution) — falls back to "direct" when no utm
// value is present for the given key.
function conversionByUtmKey(events: EventReq[], key: 'utm_source' | 'utm_campaign'): Record<string, UtmConversion> {
  const bucketOf = new Map<string, string>();
  for (const e of events) {
    if (e.sessionId === undefined || bucketOf.has(e.sessionId)) continue;
    bucketOf.set(e.sessionId, e.attribution?.utm?.[key] ?? DIRECT_BUCKET);
  }

  const leadSessions = distinctSessionIds(events, 'lead_submitted');

  const result: Record<string, UtmConversion> = {};
  for (const [sessionId, bucket] of bucketOf) {
    // biome-ignore lint/suspicious/noAssignInExpressions: get-or-create bucket, kept verbatim from the standalone app
    const entry = (result[bucket] ??= { sessions: 0, leadSubmissions: 0, conversionRate: 0 });
    entry.sessions += 1;
    if (leadSessions.has(sessionId)) entry.leadSubmissions += 1;
  }
  for (const entry of Object.values(result)) {
    entry.conversionRate = entry.sessions === 0 ? 0 : entry.leadSubmissions / entry.sessions;
  }
  return result;
}

export function conversionByUtmSource(events: EventReq[]): Record<string, UtmConversion> {
  return conversionByUtmKey(events, 'utm_source');
}

export function conversionByUtmCampaign(events: EventReq[]): Record<string, UtmConversion> {
  return conversionByUtmKey(events, 'utm_campaign');
}
