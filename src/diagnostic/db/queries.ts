import { getSupabaseServerClient } from './client.ts';
import type {
  AnswerValue,
  DiagnosticAnswers,
  DiagnosticResult,
  LeadTier,
  SolutionType,
} from '../../diagnostic-core/types.ts';
import { RESULT_TEMPLATES } from '../../diagnostic-core/resultTemplates.ts';
import type { EventReq, LeadBrief } from '../api-types.ts';
import type { Attribution } from '../attribution.ts';
import type { AnsweredSummary } from '../analytics.ts';
import { OWN_SOURCE, type DiagnosticSource } from '../diagnosticSource.ts';

export async function sessionExists(sessionId: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('diagnostic_sessions')
    .select('id')
    .eq('id', sessionId)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}

// Pinned to this deployment's own sessions (OWN_SOURCE): the shared tables also
// hold Eyal's, and a foreign session id must read as "no answers".
export async function getDiagnosticAnswers(
  sessionId: string,
  supabase: DiagnosticQueryClient = getSupabaseServerClient(),
): Promise<DiagnosticAnswers> {
  const { data, error } = await supabase
    .from('diagnostic_answers')
    .select('question_id, answer_value, diagnostic_sessions!inner(source)')
    .eq('session_id', sessionId)
    .eq('diagnostic_sessions.source', OWN_SOURCE);

  if (error) throw error;

  const answers: DiagnosticAnswers = {};
  for (const row of data ?? []) {
    answers[row.question_id as string] = row.answer_value as AnswerValue;
  }
  return answers;
}

// Raw snake_case shape of a `diagnostic_events` row (no generated DB types
// for this untyped Supabase client, see client.ts).
interface DiagnosticEventRow {
  event_name: string;
  session_id: string | null;
  occurred_at: string;
  attribution: Attribution | null;
  question_id: string | null;
  answer: AnsweredSummary | null;
  primary_solution: string | null;
  lead_tier: string | null;
  ai_fallback_reason: string | null;
}

const EVENT_COLUMNS =
  'event_name, session_id, occurred_at, attribution, question_id, answer, primary_solution, lead_tier, ai_fallback_reason';

type DiagnosticQueryClient = ReturnType<typeof getSupabaseServerClient>;
type DiagnosticEventSource = 'diagnostic_production_events' | 'diagnostic_test_events';

// Inverse of insertDiagnosticEvent's column mapping (mutations.ts). A null
// column must become an omitted field, not an explicit undefined: every
// analytics-report.ts check is `!== undefined`, so leaving nulls in place
// would be read as present values and miscount every funnel metric.
export function mapDiagnosticEventRow(row: DiagnosticEventRow): EventReq {
  const event: EventReq = {
    name: row.event_name as EventReq['name'],
    timestamp: row.occurred_at,
  };
  if (row.session_id !== null) event.sessionId = row.session_id;
  if (row.attribution !== null) event.attribution = row.attribution;
  if (row.question_id !== null) event.questionId = row.question_id;
  if (row.answer !== null) event.answer = row.answer;
  if (row.primary_solution !== null) event.primarySolution = row.primary_solution as EventReq['primarySolution'];
  if (row.lead_tier !== null) event.leadTier = row.lead_tier as EventReq['leadTier'];
  if (row.ai_fallback_reason !== null) event.reason = row.ai_fallback_reason as EventReq['reason'];
  return event;
}

// Dev/test-only readback (P6e): most recent events first, capped by `limit`.
// No live route wraps this — see tools/diagnostic/analytics-readback.ts.
async function getRecentEventsFrom(
  supabase: DiagnosticQueryClient,
  source: DiagnosticEventSource,
  limit = 2000,
): Promise<EventReq[]> {
  const { data, error } = await supabase
    .from(source)
    .select(EVENT_COLUMNS)
    .order('occurred_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((row) => mapDiagnosticEventRow(row as unknown as DiagnosticEventRow));
}

// Raw snake_case shape of a `diagnostic_contacts` row joined to its parent
// session (nested select via the existing session_id FK — no migration
// needed to surface primary_solution/lead_tier/utm on a lead).
interface DiagnosticContactRow {
  session_id: string;
  full_name: string;
  phone: string;
  email: string;
  business_name: string | null;
  link: string | null;
  review_request: string | null;
  status: string;
  created_at: string;
  diagnostic_sessions: {
    primary_solution: string | null;
    lead_tier: string | null;
    utm: Record<string, string> | null;
    is_test: boolean;
    source: string;
  } | null;
}

export interface DiagnosticLead {
  sessionId: string;
  createdAt: string;
  status: string;
  fullName: string;
  phone: string;
  email: string;
  businessName: string | null;
  link: string | null;
  message: string | null;
  primarySolution: SolutionType | null;
  resultTitle: string | null;
  leadTier: LeadTier | null;
  utmSource: string | null;
  utmCampaign: string | null;
  isTest: boolean;
  source: DiagnosticSource;
}

// resultTitle is derived, not stored: it's a pure lookup off primary_solution
// (see resultTemplates.ts), so there is nothing to keep in sync.
export function mapDiagnosticContactRow(row: DiagnosticContactRow): DiagnosticLead {
  const primarySolution = (row.diagnostic_sessions?.primary_solution ?? null) as SolutionType | null;
  const utm = row.diagnostic_sessions?.utm ?? null;
  return {
    sessionId: row.session_id,
    createdAt: row.created_at,
    status: row.status,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    businessName: row.business_name,
    link: row.link,
    message: row.review_request,
    primarySolution,
    resultTitle: primarySolution ? (RESULT_TEMPLATES[primarySolution]?.titleHe ?? null) : null,
    leadTier: (row.diagnostic_sessions?.lead_tier ?? null) as LeadTier | null,
    utmSource: utm?.utm_source ?? null,
    utmCampaign: utm?.utm_campaign ?? null,
    isTest: row.diagnostic_sessions?.is_test ?? false,
    source: (row.diagnostic_sessions?.source as DiagnosticSource | undefined) ?? 'moriz',
  };
}

export const CONTACT_COLUMNS =
  'session_id, full_name, phone, email, business_name, link, review_request, status, created_at, diagnostic_sessions!inner(primary_solution, lead_tier, utm, is_test, source)';

// Every admin read here is pinned to OWN_SOURCE (see diagnosticSource.ts): the
// shared project also holds Eyal's leads, which this deployment must never read,
// whatever the URL, body or lead id says. The source is never a request parameter.
// Lead ops readback (P7b, reshaped P9f): actionable leads (new/in_review)
// fetched in full, plus the most-recent `workedLimit` worked leads
// (contacted/closed), both DESC by created_at. Used by the admin lead list
// page — see app/admin/page.tsx, which sorts the union via sortLeadRows().
// A plain `.limit()` over the whole table (the old P7b shape) would silently
// drop an aging actionable lead once 200 newer worked leads piled up on top
// of it — exactly the un-actioned lead this queue exists to surface.
async function getRealLeadsForQueue(
  supabase: DiagnosticQueryClient,
  workedLimit = 200,
): Promise<DiagnosticLead[]> {
  // ponytail: actionable leads are bounded by the project's Supabase max-rows
  // cap (default 1000) — the accepted no-pagination ceiling. A 1000+
  // un-actioned backlog is implausible at this tool's volume; if it is ever
  // hit, raise the project API max-rows (dashboard, zero code) or range-batch
  // — both deferred per the no-pagination scope. `count: 'exact'` + the guard
  // below make any such truncation visible in server logs, not silent.
  const actionableQuery = supabase
    .from('diagnostic_contacts')
    .select(CONTACT_COLUMNS, { count: 'exact' })
    .eq('diagnostic_sessions.source', OWN_SOURCE)
    .eq('diagnostic_sessions.is_test', false)
    .in('status', ['new', 'in_review'])
    .order('created_at', { ascending: false });
  // ponytail: worked leads capped by recency — intentional per the
  // no-pagination scope; the oldest closed/contacted lead beyond the cap
  // is not surfaceable, which is by design.
  const workedQuery = supabase
    .from('diagnostic_contacts')
    .select(CONTACT_COLUMNS)
    .eq('diagnostic_sessions.source', OWN_SOURCE)
    .eq('diagnostic_sessions.is_test', false)
    .in('status', ['contacted', 'closed'])
    .order('created_at', { ascending: false })
    .limit(workedLimit);

  const [actionable, worked] = await Promise.all([actionableQuery, workedQuery]);

  if (actionable.error) throw actionable.error;
  if (worked.error) throw worked.error;

  const actionableRows = actionable.data ?? [];
  if (actionable.count != null && actionable.count > actionableRows.length) {
    // Platform max-rows truncated the actionable queue — surface it (see ceiling note above).
    console.warn(
      `[getLeadsForQueue] actionable leads truncated by Supabase max-rows: ${actionable.count} match, ${actionableRows.length} returned — raise the project API max-rows or range-batch.`,
    );
  }

  const rows = [...actionableRows, ...(worked.data ?? [])];
  return rows.map((row) => mapDiagnosticContactRow(row as unknown as DiagnosticContactRow));
}

async function getTestLeadsFrom(
  supabase: DiagnosticQueryClient,
  limit = 200,
): Promise<DiagnosticLead[]> {
  const { data, error, count } = await supabase
    .from('diagnostic_contacts')
    .select(CONTACT_COLUMNS, { count: 'exact' })
    .eq('diagnostic_sessions.source', OWN_SOURCE)
    .eq('diagnostic_sessions.is_test', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  const rows = data ?? [];
  if (count != null && count > rows.length) {
    console.warn(
      `[getTestLeadsForQueue] test leads truncated: ${count} match, ${rows.length} returned - increase the limit or add pagination.`,
    );
  }

  return rows.map((row) => mapDiagnosticContactRow(row as unknown as DiagnosticContactRow));
}

export interface DiagnosticQueryRepository {
  getRecentDiagnosticEvents(limit?: number): Promise<EventReq[]>;
  getRecentTestDiagnosticEvents(limit?: number): Promise<EventReq[]>;
  getLeadsForQueue(workedLimit?: number): Promise<DiagnosticLead[]>;
  getTestLeadsForQueue(limit?: number): Promise<DiagnosticLead[]>;
}

// Injected-client seam: production uses the server client below, while tests
// can verify the exact PostgREST source and filters without a live database.
export function createDiagnosticQueryRepository(supabase: DiagnosticQueryClient): DiagnosticQueryRepository {
  return {
    getRecentDiagnosticEvents: (limit) =>
      getRecentEventsFrom(supabase, 'diagnostic_production_events', limit),
    getRecentTestDiagnosticEvents: (limit) =>
      getRecentEventsFrom(supabase, 'diagnostic_test_events', limit),
    getLeadsForQueue: (workedLimit) => getRealLeadsForQueue(supabase, workedLimit),
    getTestLeadsForQueue: (limit) => getTestLeadsFrom(supabase, limit),
  };
}

function productionRepository(): DiagnosticQueryRepository {
  return createDiagnosticQueryRepository(getSupabaseServerClient());
}

// Production-safe default readback: its view excludes classified test sessions.
export const getRecentDiagnosticEvents = (limit?: number): Promise<EventReq[]> =>
  productionRepository().getRecentDiagnosticEvents(limit);

// Verification-only readback: callers must opt into test events by name.
export const getRecentTestDiagnosticEvents = (limit?: number): Promise<EventReq[]> =>
  productionRepository().getRecentTestDiagnosticEvents(limit);

export const getLeadsForQueue = (workedLimit?: number): Promise<DiagnosticLead[]> =>
  productionRepository().getLeadsForQueue(workedLimit);

export const getTestLeadsForQueue = (limit?: number): Promise<DiagnosticLead[]> =>
  productionRepository().getTestLeadsForQueue(limit);

// Single-lead readback by session (P7b): feeds the lead-notify email with the
// same joined shape as the admin list, keyed to the session that was just
// inserted — no ordering/limit assumption, so it can't pick up a different
// session's lead under concurrent submits.
export async function getDiagnosticLeadBySessionId(
  sessionId: string,
  supabase: DiagnosticQueryClient = getSupabaseServerClient(),
): Promise<DiagnosticLead | null> {
  const { data, error } = await supabase
    .from('diagnostic_contacts')
    .select(CONTACT_COLUMNS)
    .eq('session_id', sessionId)
    .eq('diagnostic_sessions.source', OWN_SOURCE)
    .maybeSingle();

  if (error) throw error;
  return data ? mapDiagnosticContactRow(data as unknown as DiagnosticContactRow) : null;
}

// Full stored result readback (P8a): CONTACT_COLUMNS deliberately doesn't pull
// result_snapshot (the list page doesn't need it); the admin detail view does.
// Missing/never-completed session → null, never a throw.
export async function getSessionResultSnapshot(
  sessionId: string,
  supabase: DiagnosticQueryClient = getSupabaseServerClient(),
): Promise<DiagnosticResult | null> {
  const { data, error } = await supabase
    .from('diagnostic_sessions')
    .select('result_snapshot')
    .eq('id', sessionId)
    .eq('source', OWN_SOURCE)
    .maybeSingle();

  if (error) throw error;
  return (data?.result_snapshot as DiagnosticResult | null) ?? null;
}

// Raw snake_case shape of a `diagnostic_lead_briefs` row (P8a).
export interface LeadBriefRow {
  session_id: string;
  evidence_md: string | null;
  internal_brief_md: string | null;
  client_audit_md: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export const LEAD_BRIEF_COLUMNS =
  'session_id, evidence_md, internal_brief_md, client_audit_md, status, created_at, updated_at';

export function mapLeadBriefRow(row: LeadBriefRow): LeadBrief {
  return {
    sessionId: row.session_id,
    evidenceMd: row.evidence_md,
    internalBriefMd: row.internal_brief_md,
    clientAuditMd: row.client_audit_md,
    status: row.status as LeadBrief['status'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getLeadBriefBySessionId(
  sessionId: string,
  supabase: DiagnosticQueryClient = getSupabaseServerClient(),
): Promise<LeadBrief | null> {
  const { data, error } = await supabase
    .from('diagnostic_lead_briefs')
    .select(`${LEAD_BRIEF_COLUMNS}, diagnostic_sessions!inner(source)`)
    .eq('session_id', sessionId)
    .eq('diagnostic_sessions.source', OWN_SOURCE)
    .maybeSingle();

  if (error) throw error;
  return data ? mapLeadBriefRow(data as unknown as LeadBriefRow) : null;
}
