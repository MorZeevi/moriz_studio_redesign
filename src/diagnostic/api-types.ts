import type { AnswerValue, DiagnosticResult, LeadTier, SolutionType } from '../diagnostic-core/types.ts';
import type { AiFallbackReason, PersonalizedDiagnosticCopy } from './ai/types.ts';
import type { AnsweredSummary, ClientAiFallbackReason, DiagnosticEventName } from './analytics.ts';
import type { Attribution } from './attribution.ts';
import type { LeadStatus } from './leadStatus.ts';

export interface ApiError {
  error: string;
  missing?: string[];
  details?: string;
}

// ponytail: `referrer` from the original design sketch is dropped — no matching
// column in diagnostic_sessions (only `utm jsonb`).
export interface SessionCreateReq {
  utm?: Record<string, string>;
}

export interface SessionCreateRes {
  sessionId: string;
  startedAt: string;
}

export type SessionClassificationAction = 'mark_test' | 'restore_real';

export interface SessionClassificationReq {
  sessionId: string;
  action: SessionClassificationAction;
}

export type SessionClassificationRes = { ok: true; isTest: boolean };

export type AdminTestSessionRes = { sessionId: string; startedAt: string; isTest: true };

// ponytail: `currentStep` accepted for forward-compat with the original design
// sketch but unused server-side — no `current_step` column exists; step
// tracking stays client-side only (session-client.ts).
export interface AnswerReq {
  sessionId: string;
  questionId: string;
  answer: AnswerValue;
  currentStep?: number;
}

export interface AnswerRes {
  ok: true;
}

export interface ResultReq {
  sessionId: string;
}

export interface ResultRes {
  result: DiagnosticResult;
}

export interface ContactReq {
  sessionId: string;
  fullName: string;
  phone: string;
  email?: string;
  businessName?: string;
  link?: string;
  reviewRequest?: string;
  reviewConsent: boolean;
  marketingConsent: boolean;
}

export interface ContactRes {
  ok: true;
  queued: true;
}

export interface PersonalizeReq {
  sessionId: string;
}

export interface PersonalizeRes {
  personalization: PersonalizedDiagnosticCopy | null;
  reason?: AiFallbackReason;
}

// Wire shape of trackDiagnosticEvent's payload (analytics.ts `emit`). All
// fields optional/unioned per event name — validateEventPayload narrows.
export interface EventReq {
  name: DiagnosticEventName;
  sessionId?: string;
  timestamp: string;
  attribution?: Attribution;
  questionId?: string;
  answer?: AnsweredSummary;
  primarySolution?: SolutionType;
  leadTier?: LeadTier;
  reason?: ClientAiFallbackReason;
}

export interface EventRes {
  ok: true;
}

export type LeadBriefStatus = 'draft' | 'approved';

// Camel-case shape of a `diagnostic_lead_briefs` row (P8a). The brief is
// stored admin text only — it never feeds back into any result computation.
export interface LeadBrief {
  sessionId: string;
  evidenceMd: string | null;
  internalBriefMd: string | null;
  clientAuditMd: string | null;
  status: LeadBriefStatus;
  createdAt: string;
  updatedAt: string;
}

export type LeadBriefMode = 'save' | 'approve' | 'generate';

export interface LeadBriefReq {
  mode: LeadBriefMode;
  sessionId: string;
  evidenceMd?: string;
  internalBriefMd?: string;
  clientAuditMd?: string;
}

// Closed enum: AI-path failures are a 200 { ok: false, reason } — never a 5xx,
// never a raw provider body.
export type LeadBriefFailureReason = 'disabled' | 'timeout' | 'provider_error' | 'invalid_output';

export type LeadBriefRes = { ok: true; brief: LeadBrief } | { ok: false; reason: LeadBriefFailureReason };

// P9f: single status transition on an existing contact row.
export interface StatusUpdateReq {
  sessionId: string;
  status: LeadStatus;
}

export type StatusUpdateRes = { ok: true } | { ok: false; error: string };
