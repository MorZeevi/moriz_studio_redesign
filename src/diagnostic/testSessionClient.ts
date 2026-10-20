import type {
  AdminTestSessionRes,
  SessionClassificationAction,
  SessionClassificationRes,
} from './api-types.ts';
import { withBasePath } from './basePath.ts';
import {
  buildFreshStoredSession,
  loadStoredSession,
  saveStoredSession,
  type SessionStorage,
} from './session-client.ts';
import { isValidUuid } from './validation.ts';

type FetchClient = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface ClassifySessionFromAdminInput {
  sessionId: string;
  action: SessionClassificationAction;
}

export interface ClassificationClientDependencies {
  fetch: FetchClient;
  confirm: (message: string) => boolean;
  refresh: () => void;
}

export interface TestSessionClientDependencies {
  fetch: FetchClient;
  confirm: (message: string) => boolean;
  storage: SessionStorage;
  // Must perform a hard location replacement (for example,
  // window.location.replace(url)), removing the admin entry from browser
  // history while entering the public diagnostic.
  replaceLocation: (url: string) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new Error('invalid_response');
  }
}

function isClassificationResponse(value: unknown): value is SessionClassificationRes {
  return isRecord(value) && value.ok === true && typeof value.isTest === 'boolean';
}

function isAdminTestSessionResponse(value: unknown): value is AdminTestSessionRes {
  return (
    isRecord(value) &&
    typeof value.sessionId === 'string' &&
    isValidUuid(value.sessionId) &&
    typeof value.startedAt === 'string' &&
    value.isTest === true
  );
}

export async function classifySessionFromAdmin(
  input: ClassifySessionFromAdminInput,
  deps: ClassificationClientDependencies
): Promise<boolean | null> {
  if (!isValidUuid(input.sessionId)) throw new Error('invalid_session_id');
  if (
    input.action === 'mark_test' &&
    !deps.confirm('לסמן את כל מסע הלקוח כנתוני בדיקה? הוא יוסר מכל ניתוחי הייצור.')
  ) {
    return null;
  }

  const response = await deps.fetch(withBasePath('/api/admin/session-classification'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: input.sessionId, action: input.action }),
  });
  const body = await readJson(response);
  if (!response.ok) throw new Error('request_failed');
  if (!isClassificationResponse(body)) throw new Error('invalid_response');

  deps.refresh();
  return body.isTest;
}

export async function createAdminTestSession(
  deps: TestSessionClientDependencies
): Promise<AdminTestSessionRes | null> {
  if (
    loadStoredSession(deps.storage) &&
    !deps.confirm('קיימת בדפדפן בדיקה פעילה. להחליף אותה בבדיקת ניסיון חדשה?')
  ) {
    return null;
  }

  const response = await deps.fetch(withBasePath('/api/admin/test-session'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  const body = await readJson(response);
  if (!response.ok) throw new Error('request_failed');
  if (!isAdminTestSessionResponse(body)) throw new Error('invalid_response');

  saveStoredSession(buildFreshStoredSession(body.sessionId, true), deps.storage);
  deps.replaceLocation(withBasePath('/'));
  return body;
}
