import { QUESTIONS } from '../diagnostic-core/questions.ts';
import type { DiagnosticAnswers } from '../diagnostic-core/types.ts';
import { isValidUuid, validateAnswerValue } from './validation.ts';

// Convenience cache only, never trusted for scoring. POST /api/diagnostic/result
// returns a stored snapshot first and calculates from persisted answers only
// when no completed snapshot exists.
export const CURRENT_QUESTIONNAIRE_VERSION = 2;

export interface StoredSession {
  questionnaireVersion: 2;
  sessionId: string;
  answers: DiagnosticAnswers;
  currentStep: number;
  launchImmediately?: true;
}

const STORAGE_KEY = 'moriz-diagnostic-session';
export interface SessionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const LEGACY_V1_PRESERVED_QUESTION_IDS = [
  'business_description',
  'primary_goal',
  'biggest_challenge',
  'current_asset',
  'urgency',
  'desired_process',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validatedCurrentAnswer(questionId: string, answer: unknown) {
  const question = QUESTIONS.find((q) => q.id === questionId);
  if (!question) return undefined;
  const result = validateAnswerValue(answer, question);
  return result.valid ? result.value : undefined;
}

function clampStep(step: number, maxStep = QUESTIONS.length - 1): number {
  return Math.min(Math.max(step, 0), maxStep);
}

function userActionsIndex(): number {
  return Math.max(
    QUESTIONS.findIndex((question) => question.id === 'user_actions'),
    0
  );
}

function normalizeStoredSession(
  value: unknown
): { session: StoredSession; shouldPersist: boolean } | null {
  if (!isRecord(value)) return null;
  const { questionnaireVersion, sessionId, answers, currentStep, launchImmediately } = value;

  if (typeof sessionId !== 'string' || !isValidUuid(sessionId)) return null;
  if (typeof currentStep !== 'number' || !Number.isInteger(currentStep)) return null;
  if (!isRecord(answers)) return null;
  if (launchImmediately !== undefined && launchImmediately !== true) return null;

  if (questionnaireVersion === undefined) {
    const migratedAnswers: DiagnosticAnswers = {};
    for (const questionId of LEGACY_V1_PRESERVED_QUESTION_IDS) {
      const answer = validatedCurrentAnswer(questionId, answers[questionId]);
      if (answer !== undefined) migratedAnswers[questionId] = answer;
    }

    return {
      session: {
        questionnaireVersion: CURRENT_QUESTIONNAIRE_VERSION,
        sessionId,
        answers: migratedAnswers,
        currentStep: Math.min(clampStep(currentStep), userActionsIndex()),
      },
      shouldPersist: true,
    };
  }

  if (questionnaireVersion !== CURRENT_QUESTIONNAIRE_VERSION) return null;

  const currentAnswers: DiagnosticAnswers = {};
  for (const [questionId, answer] of Object.entries(answers)) {
    const validAnswer = validatedCurrentAnswer(questionId, answer);
    if (validAnswer === undefined) return null;
    currentAnswers[questionId] = validAnswer;
  }

  return {
    session: {
      questionnaireVersion: CURRENT_QUESTIONNAIRE_VERSION,
      sessionId,
      answers: currentAnswers,
      currentStep: clampStep(currentStep),
      ...(launchImmediately === true ? { launchImmediately: true as const } : {}),
    },
    shouldPersist: false,
  };
}

function resolveStorage(storage?: SessionStorage): SessionStorage | null {
  if (storage) return storage;
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

export function buildFreshStoredSession(
  sessionId: string,
  launchImmediately?: true
): StoredSession {
  if (!isValidUuid(sessionId)) throw new Error('invalid_session_id');
  return {
    questionnaireVersion: CURRENT_QUESTIONNAIRE_VERSION,
    sessionId,
    answers: {},
    currentStep: 0,
    ...(launchImmediately === true ? { launchImmediately: true as const } : {}),
  };
}

export function loadStoredSession(storage?: SessionStorage): StoredSession | null {
  const target = resolveStorage(storage);
  if (!target) return null;
  const raw = target.getItem(STORAGE_KEY);
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    clearStoredSession(target);
    return null;
  }

  const normalized = normalizeStoredSession(parsed);
  if (!normalized) {
    clearStoredSession(target);
    return null;
  }

  if (normalized.shouldPersist) {
    saveStoredSession(normalized.session, target);
  }
  return normalized.session;
}

export function saveStoredSession(session: StoredSession, storage?: SessionStorage): void {
  const target = resolveStorage(storage);
  if (!target) return;
  target.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...session, questionnaireVersion: CURRENT_QUESTIONNAIRE_VERSION })
  );
}

export function clearStoredSession(storage?: SessionStorage): void {
  const target = resolveStorage(storage);
  if (!target) return;
  target.removeItem(STORAGE_KEY);
}

export function consumeImmediateSessionLaunch(storage?: SessionStorage): string | null {
  const session = loadStoredSession(storage);
  if (!session?.launchImmediately) return null;

  const remainingSession = { ...session };
  delete remainingSession.launchImmediately;
  saveStoredSession(remainingSession, storage);
  return session.sessionId;
}
