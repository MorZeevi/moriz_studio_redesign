import { getSupabaseServerClient } from './client.ts';
import { LEAD_BRIEF_COLUMNS, mapLeadBriefRow, type LeadBriefRow } from './queries.ts';
import type { AnswerValue, DiagnosticResult } from '../../diagnostic-core/types.ts';
import type { ContactReq, EventReq, LeadBrief } from '../api-types.ts';
import { OWN_SOURCE } from '../diagnosticSource.ts';
import { isLeadStatus, type LeadStatus } from '../leadStatus.ts';

type DiagnosticMutationClient = ReturnType<typeof getSupabaseServerClient>;

export type SessionCreationResult = { sessionId: string; startedAt: string };
export type SessionClassificationUpdateResult = { isTest: boolean };

export interface DiagnosticSessionMutationRepository {
  createDiagnosticSession(utm?: Record<string, string>): Promise<SessionCreationResult>;
  createTestDiagnosticSession(): Promise<SessionCreationResult>;
  updateDiagnosticSessionClassification(
    sessionId: string,
    isTest: boolean,
  ): Promise<SessionClassificationUpdateResult | null>;
}

// DO NOT add a `source` field to the values this function inserts. The new
// `source` column (see supabase/migrations/20261008190000_diagnostic_session_source.sql)
// defaults to 'moriz' specifically so this app's own insert path never needs
// to change — that default IS what correctly labels every row this app
// writes. Eyal-protfolio's sibling transplant repo hardcodes 'eyal' in its
// own copy of this function; copying that pattern here would mislabel every
// real session this app creates. If you ever need this app to write a
// different source, that is a product decision, not a code change — raise
// it rather than editing this function.
async function insertDiagnosticSession(
  supabase: DiagnosticMutationClient,
  values: { utm: Record<string, string> | null; is_test?: true },
): Promise<SessionCreationResult> {
  const { data, error } = await supabase
    .from('diagnostic_sessions')
    .insert(values)
    .select('id, started_at')
    .single();

  if (error) throw error;
  return { sessionId: data.id as string, startedAt: data.started_at as string };
}

export function createDiagnosticSessionMutationRepository(
  supabase: DiagnosticMutationClient,
): DiagnosticSessionMutationRepository {
  return {
    createDiagnosticSession: (utm) => insertDiagnosticSession(supabase, { utm: utm ?? null }),
    createTestDiagnosticSession: () => insertDiagnosticSession(supabase, { utm: null, is_test: true }),
    updateDiagnosticSessionClassification: async (sessionId, isTest) => {
      const { data, error } = await supabase
        .from('diagnostic_sessions')
        .update({ is_test: isTest })
        .eq('id', sessionId)
        .eq('source', OWN_SOURCE)
        .not('completed_at', 'is', null)
        .select('id, is_test')
        .maybeSingle();

      if (error) throw error;
      return data ? { isTest: data.is_test as boolean } : null;
    },
  };
}

function diagnosticSessionMutationRepository(): DiagnosticSessionMutationRepository {
  return createDiagnosticSessionMutationRepository(getSupabaseServerClient());
}

export async function createDiagnosticSession(
  utm?: Record<string, string>
): Promise<SessionCreationResult> {
  return diagnosticSessionMutationRepository().createDiagnosticSession(utm);
}

export async function createTestDiagnosticSession(): Promise<SessionCreationResult> {
  return diagnosticSessionMutationRepository().createTestDiagnosticSession();
}

export async function updateDiagnosticSessionClassification(
  sessionId: string,
  isTest: boolean,
): Promise<SessionClassificationUpdateResult | null> {
  return diagnosticSessionMutationRepository().updateDiagnosticSessionClassification(sessionId, isTest);
}

// Write guard for admin child rows (briefs, contacts) keyed by session id: the
// session must be this deployment's own. The shared tables also hold Eyal's
// sessions, which a forged or guessed id must not reach.
export async function assertOwnedSession(
  supabase: DiagnosticMutationClient,
  sessionId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from('diagnostic_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('source', OWN_SOURCE)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new SessionNotOwnedError();
}

export class SessionNotOwnedError extends Error {
  constructor() {
    super('session not found');
    this.name = 'SessionNotOwnedError';
  }
}

export async function upsertDiagnosticAnswer(
  sessionId: string,
  questionId: string,
  answer: AnswerValue
): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from('diagnostic_answers')
    .upsert(
      { session_id: sessionId, question_id: questionId, answer_value: answer },
      { onConflict: 'session_id,question_id' }
    );

  if (error) throw error;
}

// Idempotent: one contact row per session. A repeat submit for the same session
// is ignored rather than overwriting the first (ignoreDuplicates on session_id).
// Returns whether this call actually inserted a new row (false = duplicate
// ignored) so the caller can skip firing a lead-notify email on resubmit.
export async function insertDiagnosticContact(input: ContactReq): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('diagnostic_contacts')
    .upsert(
      {
        session_id: input.sessionId,
        full_name: input.fullName,
        phone: input.phone,
        // The legacy schema keeps this column NOT NULL. Empty means the
        // shortened public form did not request an email address.
        email: input.email ?? '',
        business_name: input.businessName ?? null,
        link: input.link ?? null,
        review_request: input.reviewRequest ?? null,
        review_consent: input.reviewConsent,
        marketing_consent: input.marketingConsent,
      },
      { onConflict: 'session_id', ignoreDuplicates: true }
    )
    .select('session_id');

  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function saveDiagnosticResultSnapshot(
  sessionId: string,
  result: DiagnosticResult
): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from('diagnostic_sessions')
    .update({
      completed_at: new Date().toISOString(),
      result_snapshot: result,
      lead_tier: result.leadTier,
      primary_solution: result.primarySolution,
      scores: {
        solutionScores: result.solutionScores,
        painScore: result.painScore,
        leadQualityScore: result.leadQualityScore,
      },
    })
    .eq('id', sessionId);

  if (error) throw error;
}

export interface UpsertLeadBriefInput {
  sessionId: string;
  evidenceMd?: string;
  internalBriefMd?: string;
  clientAuditMd?: string;
}

// Save/generate path (P8a): any write puts the brief back in 'draft' — edited
// content always needs a fresh approve. Absent fields are left untouched on an
// existing row (partial upsert), so saving evidence alone can't wipe a stored
// brief. updated_at set from code — no DB trigger (kept DDL minimal).
export async function upsertLeadBrief(
  input: UpsertLeadBriefInput,
  supabase: DiagnosticMutationClient = getSupabaseServerClient(),
): Promise<LeadBrief> {
  await assertOwnedSession(supabase, input.sessionId);
  const row: Record<string, unknown> = {
    session_id: input.sessionId,
    status: 'draft',
    updated_at: new Date().toISOString(),
  };
  if (input.evidenceMd !== undefined) row.evidence_md = input.evidenceMd;
  if (input.internalBriefMd !== undefined) row.internal_brief_md = input.internalBriefMd;
  if (input.clientAuditMd !== undefined) row.client_audit_md = input.clientAuditMd;

  const { data, error } = await supabase
    .from('diagnostic_lead_briefs')
    .upsert(row, { onConflict: 'session_id' })
    .select(LEAD_BRIEF_COLUMNS)
    .single();

  if (error) throw error;
  return mapLeadBriefRow(data as unknown as LeadBriefRow);
}

// Approve requires an existing row: null return (no row matched) lets the
// route answer with a typed error instead of silently creating an empty
// approved brief.
export async function approveLeadBrief(
  sessionId: string,
  supabase: DiagnosticMutationClient = getSupabaseServerClient(),
): Promise<LeadBrief | null> {
  await assertOwnedSession(supabase, sessionId);
  const { data, error } = await supabase
    .from('diagnostic_lead_briefs')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('session_id', sessionId)
    .select(LEAD_BRIEF_COLUMNS)
    .maybeSingle();

  if (error) throw error;
  return data ? mapLeadBriefRow(data as unknown as LeadBriefRow) : null;
}

export type UpdateContactStatusOutcome = { status: 'session_not_found' } | { status: 'updated' };

// P9f: status transitions on an existing contact row only — no upsert, no
// row creation. `isLeadStatus` guard is defense-in-depth (the type already
// restricts `status` at compile time, but this fails closed against a bad
// runtime caller too).
export async function updateDiagnosticContactStatus(
  sessionId: string,
  status: LeadStatus,
  supabase: DiagnosticMutationClient = getSupabaseServerClient(),
): Promise<UpdateContactStatusOutcome> {
  if (!isLeadStatus(status)) {
    throw new Error(`invalid lead status: ${status}`);
  }
  try {
    await assertOwnedSession(supabase, sessionId);
  } catch (err) {
    if (err instanceof SessionNotOwnedError) return { status: 'session_not_found' };
    throw err;
  }
  const { data, error } = await supabase
    .from('diagnostic_contacts')
    .update({ status })
    .eq('session_id', sessionId)
    .select('session_id');

  if (error) throw error;
  return (data?.length ?? 0) > 0 ? { status: 'updated' } : { status: 'session_not_found' };
}

// No session existence check: landing_view (and other early events) can fire
// before a session row exists, so session_id is stored as a plain nullable
// column, not a foreign key.
export async function insertDiagnosticEvent(input: EventReq): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from('diagnostic_events').insert({
    event_name: input.name,
    session_id: input.sessionId ?? null,
    occurred_at: input.timestamp,
    attribution: input.attribution ?? null,
    question_id: input.questionId ?? null,
    answer: input.answer ?? null,
    primary_solution: input.primarySolution ?? null,
    lead_tier: input.leadTier ?? null,
    ai_fallback_reason: input.reason ?? null,
  });

  if (error) throw error;
}
