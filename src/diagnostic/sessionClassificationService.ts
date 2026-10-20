import type {
  AdminTestSessionRes,
  SessionClassificationReq,
} from './api-types.ts';
import {
  createTestDiagnosticSession as createTestDiagnosticSessionReal,
  updateDiagnosticSessionClassification as updateDiagnosticSessionClassificationReal,
  type SessionClassificationUpdateResult,
  type SessionCreationResult,
} from './db/mutations.ts';
import { isSessionClassificationAction } from './sessionClassification.ts';
import { isValidUuid, type ValidationResult } from './validation.ts';


export function validateSessionClassificationPayload(
  body: unknown,
): ValidationResult<SessionClassificationReq> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { valid: false, error: 'invalid_body' };
  }

  const { sessionId, action } = body as Record<string, unknown>;
  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    return { valid: false, error: 'invalid_sessionId' };
  }
  if (!isValidUuid(sessionId)) {
    return { valid: false, error: 'invalid_sessionId_format' };
  }
  if (!isSessionClassificationAction(action)) {
    return { valid: false, error: 'invalid_action' };
  }

  return { valid: true, value: { sessionId, action } };
}

export function validateAdminTestSessionPayload(body: unknown): ValidationResult<Record<string, never>> {
  if (
    typeof body !== 'object' ||
    body === null ||
    Array.isArray(body) ||
    Object.keys(body).length !== 0
  ) {
    return { valid: false, error: 'invalid_body' };
  }
  return { valid: true, value: {} };
}

export interface SessionClassificationServiceDeps {
  updateDiagnosticSessionClassification: (
    sessionId: string,
    isTest: boolean,
  ) => Promise<SessionClassificationUpdateResult | null>;
  createTestDiagnosticSession: () => Promise<SessionCreationResult>;
}

const defaultDeps: SessionClassificationServiceDeps = {
  updateDiagnosticSessionClassification: updateDiagnosticSessionClassificationReal,
  createTestDiagnosticSession: createTestDiagnosticSessionReal,
};

export async function handleSessionClassification(
  req: SessionClassificationReq,
  deps: SessionClassificationServiceDeps = defaultDeps,
): Promise<SessionClassificationUpdateResult | null> {
  const isTest = req.action === 'mark_test';
  return deps.updateDiagnosticSessionClassification(req.sessionId, isTest);
}

export async function createAdminTestSession(
  deps: SessionClassificationServiceDeps = defaultDeps,
): Promise<AdminTestSessionRes> {
  const session = await deps.createTestDiagnosticSession();
  return { ...session, isTest: true };
}
