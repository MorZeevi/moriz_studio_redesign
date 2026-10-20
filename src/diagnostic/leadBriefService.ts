import type { DiagnosticAnswers, DiagnosticResult } from '../diagnostic-core/types.ts';
import { composeLeadBrief as composeLeadBriefReal, type ComposeLeadBriefResult } from './ai/leadBrief.ts';
import type { LeadBriefPromptInput } from './ai/leadBriefPrompt.ts';
import type { LeadBrief, LeadBriefFailureReason, LeadBriefReq } from './api-types.ts';
import {
  approveLeadBrief as approveLeadBriefReal,
  upsertLeadBrief as upsertLeadBriefReal,
  type UpsertLeadBriefInput,
} from './db/mutations.ts';
import {
  getDiagnosticAnswers as getDiagnosticAnswersReal,
  getDiagnosticLeadBySessionId as getDiagnosticLeadBySessionIdReal,
  getSessionResultSnapshot as getSessionResultSnapshotReal,
  type DiagnosticLead,
} from './db/queries.ts';
import { isValidUuid, type ValidationResult } from './validation.ts';

// ── P8a lead brief service ──────────────────────────────────────────────────
// Thin route handler (app/api/admin/lead-brief/route.ts) delegates flow logic
// here. Same DI shape as personalizeService: deps default to the real DB
// functions; tests inject stubs and never touch a live Supabase.

const LEAD_BRIEF_MODES = ['save', 'approve', 'generate'] as const;

// Evidence is pasted admin notes, not a crawl dump; briefs are one-screen
// texts. Caps mirror the AI output cap (§C.4) so a pasted brief can hold
// anything the generator is allowed to produce.
export const MAX_EVIDENCE_LENGTH = 8000;
export const MIN_EVIDENCE_TRIMMED_LENGTH = 10;
export const MAX_BRIEF_TEXT_LENGTH = 12000;

function isLeadBriefMode(value: unknown): value is LeadBriefReq['mode'] {
  return typeof value === 'string' && (LEAD_BRIEF_MODES as readonly string[]).includes(value);
}

// Whitelist reconstruction (house style of validation.ts): unknown keys never
// pass through, and approve carries no text fields at all.
export function validateLeadBriefPayload(body: unknown): ValidationResult<LeadBriefReq> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { valid: false, error: 'invalid_body' };
  }
  const { mode, sessionId, evidenceMd, internalBriefMd, clientAuditMd } = body as Record<string, unknown>;

  if (!isLeadBriefMode(mode)) {
    return { valid: false, error: 'invalid_mode' };
  }
  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    return { valid: false, error: 'invalid_sessionId' };
  }
  if (!isValidUuid(sessionId)) {
    return { valid: false, error: 'invalid_sessionId_format' };
  }

  if (mode === 'approve') {
    return { valid: true, value: { mode, sessionId } };
  }

  if (mode === 'generate') {
    if (typeof evidenceMd !== 'string' || evidenceMd.trim().length < MIN_EVIDENCE_TRIMMED_LENGTH) {
      return { valid: false, error: 'invalid_evidenceMd' };
    }
    if (evidenceMd.length > MAX_EVIDENCE_LENGTH) {
      return { valid: false, error: 'evidence_too_long' };
    }
    return { valid: true, value: { mode, sessionId, evidenceMd } };
  }

  // save: every text field optional; present fields must be strings within cap.
  if (evidenceMd !== undefined && typeof evidenceMd !== 'string') {
    return { valid: false, error: 'invalid_evidenceMd' };
  }
  if (evidenceMd !== undefined && evidenceMd.length > MAX_EVIDENCE_LENGTH) {
    return { valid: false, error: 'evidence_too_long' };
  }
  if (internalBriefMd !== undefined && (typeof internalBriefMd !== 'string' || internalBriefMd.length > MAX_BRIEF_TEXT_LENGTH)) {
    return { valid: false, error: 'invalid_internalBriefMd' };
  }
  if (clientAuditMd !== undefined && (typeof clientAuditMd !== 'string' || clientAuditMd.length > MAX_BRIEF_TEXT_LENGTH)) {
    return { valid: false, error: 'invalid_clientAuditMd' };
  }

  const value: LeadBriefReq = { mode, sessionId };
  if (evidenceMd !== undefined) value.evidenceMd = evidenceMd;
  if (internalBriefMd !== undefined) value.internalBriefMd = internalBriefMd;
  if (clientAuditMd !== undefined) value.clientAuditMd = clientAuditMd;
  return { valid: true, value };
}

export type LeadBriefOutcome =
  | { status: 'session_not_found' }
  | { status: 'brief_not_found' }
  | { status: 'saved'; brief: LeadBrief }
  | { status: 'ai_failed'; reason: LeadBriefFailureReason };

export interface LeadBriefServiceDeps {
  getDiagnosticLeadBySessionId: (sessionId: string) => Promise<DiagnosticLead | null>;
  getDiagnosticAnswers: (sessionId: string) => Promise<DiagnosticAnswers>;
  getSessionResultSnapshot: (sessionId: string) => Promise<DiagnosticResult | null>;
  upsertLeadBrief: (input: UpsertLeadBriefInput) => Promise<LeadBrief>;
  approveLeadBrief: (sessionId: string) => Promise<LeadBrief | null>;
  composeLeadBrief: (input: LeadBriefPromptInput) => Promise<ComposeLeadBriefResult>;
}

const defaultDeps: LeadBriefServiceDeps = {
  getDiagnosticLeadBySessionId: getDiagnosticLeadBySessionIdReal,
  getDiagnosticAnswers: getDiagnosticAnswersReal,
  getSessionResultSnapshot: getSessionResultSnapshotReal,
  upsertLeadBrief: upsertLeadBriefReal,
  approveLeadBrief: approveLeadBriefReal,
  composeLeadBrief: composeLeadBriefReal,
};

export async function handleLeadBrief(
  req: LeadBriefReq,
  deps: LeadBriefServiceDeps = defaultDeps
): Promise<LeadBriefOutcome> {
  if (req.mode === 'approve') {
    // Approve never creates: no draft row -> typed error, the route answers 404.
    const brief = await deps.approveLeadBrief(req.sessionId);
    return brief ? { status: 'saved', brief } : { status: 'brief_not_found' };
  }

  // save/generate anchor on the contact row, not the bare session: a brief
  // only makes sense for a lead that actually exists in the admin list.
  const lead = await deps.getDiagnosticLeadBySessionId(req.sessionId);
  if (!lead) {
    return { status: 'session_not_found' };
  }

  if (req.mode === 'save') {
    const input: UpsertLeadBriefInput = { sessionId: req.sessionId };
    if (req.evidenceMd !== undefined) input.evidenceMd = req.evidenceMd;
    if (req.internalBriefMd !== undefined) input.internalBriefMd = req.internalBriefMd;
    if (req.clientAuditMd !== undefined) input.clientAuditMd = req.clientAuditMd;
    return { status: 'saved', brief: await deps.upsertLeadBrief(input) };
  }

  // generate: answers + snapshot come from DB readback only — the server never
  // trusts client-sent claim data, and the deterministic verdict stays canon.
  const [answers, snapshot] = await Promise.all([
    deps.getDiagnosticAnswers(req.sessionId),
    deps.getSessionResultSnapshot(req.sessionId),
  ]);
  const evidenceMd = req.evidenceMd ?? '';
  const composed = await deps.composeLeadBrief({
    sessionId: req.sessionId,
    fullName: lead.fullName,
    businessName: lead.businessName,
    link: lead.link,
    answers,
    snapshot,
    evidenceMd,
  });
  if (!composed.ok) {
    return { status: 'ai_failed', reason: composed.reason };
  }

  const brief = await deps.upsertLeadBrief({
    sessionId: req.sessionId,
    evidenceMd,
    internalBriefMd: composed.internalBriefMd,
    clientAuditMd: composed.clientAuditMd,
  });
  return { status: 'saved', brief };
}
