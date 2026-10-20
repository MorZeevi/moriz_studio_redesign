import type { StatusUpdateReq } from './api-types.ts';
import {
  updateDiagnosticContactStatus as updateDiagnosticContactStatusReal,
  type UpdateContactStatusOutcome,
} from './db/mutations.ts';
import { isLeadStatus, type LeadStatus } from './leadStatus.ts';
import { isValidUuid, type ValidationResult } from './validation.ts';

// ── P9f lead status service ──────────────────────────────────────────────────
// Thin route handler (app/api/admin/lead-status/route.ts) delegates flow
// logic here. Same DI shape as leadBriefService: deps default to the real DB
// functions; tests inject stubs and never touch a live Supabase.


// Whitelist reconstruction (house style of validation.ts): unknown keys never
// pass through.
export function validateStatusUpdatePayload(body: unknown): ValidationResult<StatusUpdateReq> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { valid: false, error: 'invalid_body' };
  }
  const { sessionId, status } = body as Record<string, unknown>;

  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    return { valid: false, error: 'invalid_sessionId' };
  }
  if (!isValidUuid(sessionId)) {
    return { valid: false, error: 'invalid_sessionId_format' };
  }
  if (!isLeadStatus(status)) {
    return { valid: false, error: 'invalid_status' };
  }

  return { valid: true, value: { sessionId, status } };
}

export type StatusUpdateOutcome = UpdateContactStatusOutcome;

export interface StatusUpdateServiceDeps {
  updateDiagnosticContactStatus: (sessionId: string, status: LeadStatus) => Promise<UpdateContactStatusOutcome>;
}

const defaultDeps: StatusUpdateServiceDeps = {
  updateDiagnosticContactStatus: updateDiagnosticContactStatusReal,
};

export async function handleStatusUpdate(
  req: StatusUpdateReq,
  deps: StatusUpdateServiceDeps = defaultDeps
): Promise<StatusUpdateOutcome> {
  return deps.updateDiagnosticContactStatus(req.sessionId, req.status);
}
