import { QUESTIONS } from '../diagnostic-core/questions.ts';
import { SOLUTION_TYPES } from '../diagnostic-core/types.ts';
import type { AnswerValue, DiagnosticAnswers, LeadTier, Question, SolutionType } from '../diagnostic-core/types.ts';
import type { AnswerReq, ContactReq, EventReq, SessionCreateReq } from './api-types.ts';
import { CLIENT_AI_FALLBACK_REASONS, DIAGNOSTIC_EVENT_NAMES } from './analytics.ts';
import type { AnsweredSummary, ClientAiFallbackReason } from './analytics.ts';
import { isValidAttribution, isValidUtm } from './attribution.ts';
import type { Attribution } from './attribution.ts';

export type ValidationResult<T> = { valid: true; value: T } | { valid: false; error: string };

const QUESTIONS_BY_ID = new Map<string, Question>();
for (const question of QUESTIONS) {
  QUESTIONS_BY_ID.set(question.id, question);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return UUID_RE.test(value);
}

// A stored answer counts only if it carries content: multi needs >= 1 option,
// text needs non-whitespace. Guards direct API clients that save hollow
// answers and then request a result.
function hasAnswerContent(answer: AnswerValue): boolean {
  if (answer.type === 'multi') return answer.optionIds.length > 0;
  if (answer.type === 'text') return answer.value.trim().length > 0;
  return true;
}

export function findMissingRequiredAnswers(answers: DiagnosticAnswers): string[] {
  return QUESTIONS.filter((q) => {
    if (!q.required) return false;
    const answer = answers[q.id];
    if (answer === undefined) return true;
    // Validate shape before inspecting content: a malformed stored answer
    // (e.g. { type: 'multi', optionIds: null }) must read as missing, not throw.
    const result = validateAnswerValue(answer, q);
    return !result.valid || !hasAnswerContent(result.value);
  }).map((q) => q.id);
}

export function validateSessionIdPayload(body: unknown): ValidationResult<{ sessionId: string }> {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, error: 'invalid_body' };
  }
  const { sessionId } = body as Record<string, unknown>;
  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    return { valid: false, error: 'invalid_sessionId' };
  }
  if (!isValidUuid(sessionId)) {
    return { valid: false, error: 'invalid_sessionId_format' };
  }
  return { valid: true, value: { sessionId } };
}

const MAX_TEXT_ANSWER_LENGTH = 2000;

export function validateSessionCreatePayload(body: unknown): ValidationResult<SessionCreateReq> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { valid: false, error: 'invalid_body' };
  }
  const { utm } = body as Record<string, unknown>;
  if (utm === undefined) {
    return { valid: true, value: {} };
  }
  if (!isValidUtm(utm)) {
    return { valid: false, error: 'invalid_utm' };
  }
  return { valid: true, value: { utm } };
}

export function validateAnswerPayload(body: unknown): ValidationResult<AnswerReq> {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, error: 'invalid_body' };
  }
  const { sessionId, questionId, answer } = body as Record<string, unknown>;

  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    return { valid: false, error: 'invalid_sessionId' };
  }
  if (!isValidUuid(sessionId)) {
    return { valid: false, error: 'invalid_sessionId_format' };
  }
  if (typeof questionId !== 'string' || questionId.length === 0) {
    return { valid: false, error: 'invalid_questionId' };
  }

  const question = QUESTIONS_BY_ID.get(questionId);
  if (!question) {
    return { valid: false, error: 'unknown_questionId' };
  }

  const answerResult = validateAnswerValue(answer, question);
  if (!answerResult.valid) return answerResult;

  return { valid: true, value: { sessionId, questionId, answer: answerResult.value } };
}

export function validateAnswerValue(answer: unknown, question: Question): ValidationResult<AnswerValue> {
  if (typeof answer !== 'object' || answer === null) {
    return { valid: false, error: 'invalid_answer' };
  }
  const a = answer as Record<string, unknown>;

  if (question.type === 'single') {
    if (a.type !== 'single' || typeof a.optionId !== 'string') {
      return { valid: false, error: 'invalid_answer_shape' };
    }
    const isValidOption = question.options?.some((o) => o.id === a.optionId) ?? false;
    if (!isValidOption) {
      return { valid: false, error: 'invalid_option' };
    }
    return { valid: true, value: { type: 'single', optionId: a.optionId } };
  }

  if (question.type === 'multi') {
    if (a.type !== 'multi' || !Array.isArray(a.optionIds)) {
      return { valid: false, error: 'invalid_answer_shape' };
    }
    const optionIds: unknown[] = a.optionIds;
    const validIds = new Set(question.options?.map((o) => o.id) ?? []);
    const allValid = optionIds.every((id) => typeof id === 'string' && validIds.has(id));
    if (!allValid) {
      return { valid: false, error: 'invalid_option' };
    }
    if (new Set(optionIds).size !== optionIds.length) {
      return { valid: false, error: 'duplicate_option' };
    }
    if (question.required && optionIds.length === 0) {
      return { valid: false, error: 'empty_answer' };
    }
    if (
      question.exclusiveOptionId !== undefined &&
      optionIds.includes(question.exclusiveOptionId) &&
      optionIds.length > 1
    ) {
      return { valid: false, error: 'conflicting_exclusive_option' };
    }
    return { valid: true, value: { type: 'multi', optionIds: optionIds as string[] } };
  }

  // textarea question -> 'text' answer
  if (a.type !== 'text' || typeof a.value !== 'string') {
    return { valid: false, error: 'invalid_answer_shape' };
  }
  if (a.value.length > MAX_TEXT_ANSWER_LENGTH) {
    return { valid: false, error: 'text_too_long' };
  }
  if (question.minLengthTrimmed !== undefined && a.value.trim().length < question.minLengthTrimmed) {
    return { valid: false, error: 'text_too_short' };
  }
  return { valid: true, value: { type: 'text', value: a.value } };
}

const MAX_FULL_NAME_LENGTH = 200;
const MAX_PHONE_LENGTH = 40;
const MAX_EMAIL_LENGTH = 320;
const MAX_BUSINESS_NAME_LENGTH = 200;
const MAX_LINK_LENGTH = 500;
const MAX_REVIEW_REQUEST_LENGTH = 2000;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// An absent optional (undefined) or a value that trims to empty is treated as
// absent and omitted from the normalized payload; anything present must be a
// string within its cap.
function validateOptionalText(
  value: unknown,
  maxLength: number,
  error: string
): ValidationResult<string | undefined> {
  if (value === undefined) return { valid: true, value: undefined };
  if (typeof value !== 'string') return { valid: false, error };
  const trimmed = value.trim();
  if (trimmed.length === 0) return { valid: true, value: undefined };
  if (trimmed.length > maxLength) return { valid: false, error };
  return { valid: true, value: trimmed };
}

// A link must be a real web URL: scheme-less input gets https:// prepended,
// and anything that does not parse to http(s) with a dotted hostname is
// rejected. The normalized form (never the raw input) is what gets stored.
// Shared with the client form so both sides reject the same values.
export function normalizeContactLink(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  if ((url.protocol !== 'http:' && url.protocol !== 'https:') || !url.hostname.includes('.')) {
    return null;
  }
  return withScheme;
}

export function validateContactPayload(body: unknown): ValidationResult<ContactReq> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { valid: false, error: 'invalid_body' };
  }
  const { sessionId, fullName, phone, email, businessName, link, reviewRequest, reviewConsent, marketingConsent } =
    body as Record<string, unknown>;

  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    return { valid: false, error: 'invalid_sessionId' };
  }
  if (!isValidUuid(sessionId)) {
    return { valid: false, error: 'invalid_sessionId_format' };
  }

  if (typeof fullName !== 'string') {
    return { valid: false, error: 'invalid_fullName' };
  }
  const trimmedFullName = fullName.trim();
  if (trimmedFullName.length < 1 || trimmedFullName.length > MAX_FULL_NAME_LENGTH) {
    return { valid: false, error: 'invalid_fullName' };
  }

  if (typeof phone !== 'string') {
    return { valid: false, error: 'invalid_phone' };
  }
  const trimmedPhone = phone.trim();
  if (trimmedPhone.length < 1 || trimmedPhone.length > MAX_PHONE_LENGTH) {
    return { valid: false, error: 'invalid_phone' };
  }

  const emailResult = validateOptionalText(email, MAX_EMAIL_LENGTH, 'invalid_email');
  if (!emailResult.valid) return emailResult;
  if (emailResult.value !== undefined && !EMAIL_RE.test(emailResult.value)) {
    return { valid: false, error: 'invalid_email' };
  }

  const businessNameResult = validateOptionalText(businessName, MAX_BUSINESS_NAME_LENGTH, 'invalid_businessName');
  if (!businessNameResult.valid) return businessNameResult;
  const linkResult = validateOptionalText(link, MAX_LINK_LENGTH, 'invalid_link');
  if (!linkResult.valid) return linkResult;
  let normalizedLink: string | undefined;
  if (linkResult.value !== undefined) {
    const normalized = normalizeContactLink(linkResult.value);
    // cap re-checked on the normalized value: prepending https:// adds length
    if (normalized === null || normalized.length > MAX_LINK_LENGTH) {
      return { valid: false, error: 'invalid_link' };
    }
    normalizedLink = normalized;
  }
  const reviewRequestResult = validateOptionalText(reviewRequest, MAX_REVIEW_REQUEST_LENGTH, 'invalid_reviewRequest');
  if (!reviewRequestResult.valid) return reviewRequestResult;

  if (reviewConsent !== true) {
    return { valid: false, error: 'consent_required' };
  }

  let normalizedMarketingConsent = false;
  if (marketingConsent !== undefined) {
    if (typeof marketingConsent !== 'boolean') {
      return { valid: false, error: 'invalid_marketingConsent' };
    }
    normalizedMarketingConsent = marketingConsent;
  }

  const value: ContactReq = {
    sessionId,
    fullName: trimmedFullName,
    phone: trimmedPhone,
    reviewConsent: true,
    marketingConsent: normalizedMarketingConsent,
  };
  if (emailResult.value !== undefined) value.email = emailResult.value;
  if (businessNameResult.value !== undefined) value.businessName = businessNameResult.value;
  if (normalizedLink !== undefined) value.link = normalizedLink;
  if (reviewRequestResult.value !== undefined) value.reviewRequest = reviewRequestResult.value;

  return { valid: true, value };
}

const MAX_QUESTION_ID_LENGTH = 100;
const MAX_ANSWER_OPTION_ID_LENGTH = 100;
const MAX_ANSWER_OPTION_IDS = 20;

const LEAD_TIERS = ['A', 'B', 'C'] as const satisfies readonly LeadTier[];

function isOneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (values as readonly string[]).includes(value);
}

function isValidAnswerOptionId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0 && id.length <= MAX_ANSWER_OPTION_ID_LENGTH;
}

function isValidAnsweredSummary(value: unknown): value is AnsweredSummary {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.type === 'single') return isValidAnswerOptionId(v.optionId);
  if (v.type === 'multi') {
    return (
      Array.isArray(v.optionIds) && v.optionIds.length <= MAX_ANSWER_OPTION_IDS && v.optionIds.every(isValidAnswerOptionId)
    );
  }
  return v.type === 'text';
}

// Analytics ingest, not the answer-of-record path: questionId/answer are
// checked for shape only, not cross-referenced against QUESTIONS_BY_ID or a
// question's real option list (unlike validateAnswerValue above). Over-
// validating a label field would silently drop real funnel events if a
// question is later renamed or removed.
export function validateEventPayload(body: unknown): ValidationResult<EventReq> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { valid: false, error: 'invalid_body' };
  }
  const { name, sessionId, timestamp, attribution, questionId, answer, primarySolution, leadTier, reason } =
    body as Record<string, unknown>;

  if (!isOneOf(DIAGNOSTIC_EVENT_NAMES, name)) {
    return { valid: false, error: 'invalid_name' };
  }
  if (typeof timestamp !== 'string' || Number.isNaN(Date.parse(timestamp))) {
    return { valid: false, error: 'invalid_timestamp' };
  }
  if (sessionId !== undefined && (typeof sessionId !== 'string' || !isValidUuid(sessionId))) {
    return { valid: false, error: 'invalid_sessionId_format' };
  }
  if (attribution !== undefined && !isValidAttribution(attribution)) {
    return { valid: false, error: 'invalid_attribution' };
  }
  if (
    questionId !== undefined &&
    (typeof questionId !== 'string' || questionId.length === 0 || questionId.length > MAX_QUESTION_ID_LENGTH)
  ) {
    return { valid: false, error: 'invalid_questionId' };
  }
  if (answer !== undefined && !isValidAnsweredSummary(answer)) {
    return { valid: false, error: 'invalid_answer' };
  }
  if (primarySolution !== undefined && !isOneOf(SOLUTION_TYPES, primarySolution)) {
    return { valid: false, error: 'invalid_primarySolution' };
  }
  if (leadTier !== undefined && !isOneOf(LEAD_TIERS, leadTier)) {
    return { valid: false, error: 'invalid_leadTier' };
  }
  if (reason !== undefined && !isOneOf(CLIENT_AI_FALLBACK_REASONS, reason)) {
    return { valid: false, error: 'invalid_reason' };
  }

  // new Date(...).toISOString() normalizes to a strict format; safe because
  // the parse guard above already rejected anything Date.parse can't read.
  const value: EventReq = { name, timestamp: new Date(timestamp).toISOString() };
  if (sessionId !== undefined) value.sessionId = sessionId as string;
  // Defense-in-depth: POST /api/diagnostic/events is a public boundary, not
  // just trackDiagnosticEvent's client path. Rebuild attribution/answer from
  // whitelisted keys here too (rather than assigning the validated object
  // through by reference), so a stray extra key — e.g. free text riding
  // along on a single/multi answer, or a PII field bolted onto attribution —
  // can never reach storage even if the client-side builders are bypassed.
  if (attribution !== undefined) {
    const attr = attribution as Attribution;
    const safeAttribution: Attribution = { landingPath: attr.landingPath, firstSeenAt: attr.firstSeenAt };
    if (attr.utm !== undefined) safeAttribution.utm = attr.utm;
    if (attr.referrer !== undefined) safeAttribution.referrer = attr.referrer;
    value.attribution = safeAttribution;
  }
  if (questionId !== undefined) value.questionId = questionId as string;
  if (answer !== undefined) {
    const a = answer as AnsweredSummary;
    if (a.type === 'single') value.answer = { type: 'single', optionId: a.optionId };
    else if (a.type === 'multi') value.answer = { type: 'multi', optionIds: a.optionIds };
    else value.answer = { type: 'text' };
  }
  if (primarySolution !== undefined) value.primarySolution = primarySolution as SolutionType;
  if (leadTier !== undefined) value.leadTier = leadTier as LeadTier;
  if (reason !== undefined) value.reason = reason as ClientAiFallbackReason;

  return { valid: true, value };
}
