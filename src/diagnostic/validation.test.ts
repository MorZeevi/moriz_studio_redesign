import { test } from 'node:test';
import assert from 'node:assert/strict';

import { FIXTURES } from '../diagnostic-core/fixtures.ts';
import type { DiagnosticAnswers, Question } from '../diagnostic-core/types.ts';
import {
  findMissingRequiredAnswers,
  normalizeContactLink,
  validateAnswerPayload,
  validateAnswerValue,
  validateContactPayload,
  validateEventPayload,
  validateSessionCreatePayload,
  validateSessionIdPayload,
} from './validation.ts';

const VALID_SESSION_ID = '11111111-1111-1111-1111-111111111111';
const VALID_TIMESTAMP = '2026-07-04T12:00:00.000Z';
const VALID_ATTRIBUTION = {
  utm: { utm_source: 'meta' },
  landingPath: '/digital-audit',
  firstSeenAt: '2026-07-04T11:00:00.000Z',
};

test('findMissingRequiredAnswers returns empty for a complete fixture', () => {
  const missing = findMissingRequiredAnswers(FIXTURES.trust_website);
  assert.deepEqual(missing, []);
});

test('findMissingRequiredAnswers reports a removed required answer', () => {
  const rest: DiagnosticAnswers = {};
  for (const [key, value] of Object.entries(FIXTURES.trust_website)) {
    if (key !== 'current_asset') rest[key] = value;
  }
  const missing = findMissingRequiredAnswers(rest);
  assert.deepEqual(missing, ['current_asset']);
});

test('findMissingRequiredAnswers flags hollow answers (empty multi, whitespace text)', () => {
  const answers: DiagnosticAnswers = {
    ...FIXTURES.trust_website,
    business_description: { type: 'text', value: '   ' },
    user_actions: { type: 'multi', optionIds: [] },
  };
  const missing = findMissingRequiredAnswers(answers);
  assert.deepEqual(missing, ['business_description', 'user_actions']);
});

test('findMissingRequiredAnswers treats obsolete stored option ids as missing', () => {
  const answers: DiagnosticAnswers = {
    ...FIXTURES.trust_website,
    user_actions: { type: 'multi', optionIds: ['bogus_obsolete_action'] },
  };
  const missing = findMissingRequiredAnswers(answers);
  assert.deepEqual(missing, ['user_actions']);
});

test('validateSessionIdPayload accepts a valid sessionId', () => {
  const result = validateSessionIdPayload({ sessionId: VALID_SESSION_ID });
  assert.equal(result.valid, true);
});

test('validateSessionIdPayload rejects a missing sessionId', () => {
  const result = validateSessionIdPayload({});
  assert.equal(result.valid, false);
});

test('validateSessionIdPayload rejects a non-object body', () => {
  const result = validateSessionIdPayload(null);
  assert.equal(result.valid, false);
});

test('validateSessionIdPayload rejects a non-UUID sessionId', () => {
  const result = validateSessionIdPayload({ sessionId: 'abc-123' });
  assert.deepEqual(result, { valid: false, error: 'invalid_sessionId_format' });
});

test('validateAnswerPayload accepts a valid single answer', () => {
  const result = validateAnswerPayload({
    sessionId: VALID_SESSION_ID,
    questionId: 'current_asset',
    answer: { type: 'single', optionId: 'nothing' },
  });
  assert.equal(result.valid, true);
});

test('validateAnswerPayload rejects an unknown option for a single question', () => {
  const result = validateAnswerPayload({
    sessionId: VALID_SESSION_ID,
    questionId: 'current_asset',
    answer: { type: 'single', optionId: 'bogus_option' },
  });
  assert.deepEqual(result, { valid: false, error: 'invalid_option' });
});

test('validateAnswerPayload rejects an unknown questionId', () => {
  const result = validateAnswerPayload({
    sessionId: VALID_SESSION_ID,
    questionId: 'not_a_real_question',
    answer: { type: 'single', optionId: 'nothing' },
  });
  assert.deepEqual(result, { valid: false, error: 'unknown_questionId' });
});

test('validateAnswerPayload rejects an empty selection for a required multi question', () => {
  const result = validateAnswerPayload({
    sessionId: VALID_SESSION_ID,
    questionId: 'user_actions',
    answer: { type: 'multi', optionIds: [] },
  });
  assert.deepEqual(result, { valid: false, error: 'empty_answer' });
});

test('validateAnswerPayload rejects a multi answer with an invalid option', () => {
  const result = validateAnswerPayload({
    sessionId: VALID_SESSION_ID,
    questionId: 'user_actions',
    answer: { type: 'multi', optionIds: ['not_a_real_action'] },
  });
  assert.deepEqual(result, { valid: false, error: 'invalid_option' });
});

test('validateAnswerPayload rejects a multi answer with duplicate option ids', () => {
  const result = validateAnswerPayload({
    sessionId: VALID_SESSION_ID,
    questionId: 'user_actions',
    answer: { type: 'multi', optionIds: ['understand_fit', 'understand_fit'] },
  });
  assert.deepEqual(result, { valid: false, error: 'duplicate_option' });
});

// No live question sets exclusiveOptionId after P9a slice 2, but the mechanism is
// still live validation code, so it is covered directly with a synthetic question.
const EXCLUSIVE_QUESTION: Question = {
  id: 'synthetic_exclusive',
  type: 'multi',
  promptHe: 'שאלה סינתטית לבדיקה',
  required: true,
  stageId: 1,
  stageTitleHe: 'בדיקה',
  exclusiveOptionId: 'none_needed',
  options: [
    { id: 'none_needed', labelHe: 'לא צריך כלום' },
    { id: 'something', labelHe: 'משהו' },
  ],
};

test('validateAnswerValue accepts a multi answer with only the exclusive option selected', () => {
  const result = validateAnswerValue({ type: 'multi', optionIds: ['none_needed'] }, EXCLUSIVE_QUESTION);
  assert.equal(result.valid, true);
});

test('validateAnswerValue rejects combining the exclusive option with another option', () => {
  const result = validateAnswerValue(
    { type: 'multi', optionIds: ['none_needed', 'something'] },
    EXCLUSIVE_QUESTION
  );
  assert.deepEqual(result, { valid: false, error: 'conflicting_exclusive_option' });
});

test('validateAnswerPayload accepts multiple non-exclusive user actions', () => {
  const result = validateAnswerPayload({
    sessionId: VALID_SESSION_ID,
    questionId: 'user_actions',
    answer: { type: 'multi', optionIds: ['contact_or_book', 'buy_order_pay'] },
  });
  assert.equal(result.valid, true);
});

test('validateAnswerPayload accepts a valid textarea answer', () => {
  const result = validateAnswerPayload({
    sessionId: VALID_SESSION_ID,
    questionId: 'business_description',
    answer: { type: 'text', value: 'עסק קטן שמוכר שירותי ייעוץ' },
  });
  assert.equal(result.valid, true);
});

test('validateAnswerPayload accepts a textarea answer at the min length boundary', () => {
  const result = validateAnswerPayload({
    sessionId: VALID_SESSION_ID,
    questionId: 'business_description',
    answer: { type: 'text', value: 'x'.repeat(10) },
  });
  assert.equal(result.valid, true);
});

test('validateAnswerPayload rejects a textarea answer below the min trimmed length', () => {
  const result = validateAnswerPayload({
    sessionId: VALID_SESSION_ID,
    questionId: 'business_description',
    answer: { type: 'text', value: 'x'.repeat(9) },
  });
  assert.deepEqual(result, { valid: false, error: 'text_too_short' });
});

test('validateAnswerPayload rejects a whitespace-padded answer that trims below the min', () => {
  const result = validateAnswerPayload({
    sessionId: VALID_SESSION_ID,
    questionId: 'business_description',
    answer: { type: 'text', value: `   ${'x'.repeat(9)}   ` },
  });
  assert.deepEqual(result, { valid: false, error: 'text_too_short' });
});

test('validateAnswerPayload accepts a textarea answer at the max length boundary', () => {
  const result = validateAnswerPayload({
    sessionId: VALID_SESSION_ID,
    questionId: 'business_description',
    answer: { type: 'text', value: 'x'.repeat(2000) },
  });
  assert.equal(result.valid, true);
});

test('validateAnswerPayload rejects a textarea answer exceeding the max length', () => {
  const result = validateAnswerPayload({
    sessionId: VALID_SESSION_ID,
    questionId: 'business_description',
    answer: { type: 'text', value: 'x'.repeat(2001) },
  });
  assert.deepEqual(result, { valid: false, error: 'text_too_long' });
});

test('validateAnswerPayload rejects a shape mismatch (multi answer for a single question)', () => {
  const result = validateAnswerPayload({
    sessionId: VALID_SESSION_ID,
    questionId: 'current_asset',
    answer: { type: 'multi', optionIds: ['nothing'] },
  });
  assert.deepEqual(result, { valid: false, error: 'invalid_answer_shape' });
});

test('validateAnswerPayload rejects a non-UUID sessionId', () => {
  const result = validateAnswerPayload({
    sessionId: 'abc-123',
    questionId: 'current_asset',
    answer: { type: 'single', optionId: 'nothing' },
  });
  assert.deepEqual(result, { valid: false, error: 'invalid_sessionId_format' });
});

test('validateSessionCreatePayload rejects a null body', () => {
  const result = validateSessionCreatePayload(null);
  assert.deepEqual(result, { valid: false, error: 'invalid_body' });
});

test('validateSessionCreatePayload rejects a non-object body', () => {
  const result = validateSessionCreatePayload('not-an-object');
  assert.deepEqual(result, { valid: false, error: 'invalid_body' });
});

test('validateSessionCreatePayload accepts a missing utm', () => {
  const result = validateSessionCreatePayload({});
  assert.deepEqual(result, { valid: true, value: {} });
});

test('validateSessionCreatePayload accepts a valid flat utm', () => {
  const result = validateSessionCreatePayload({ utm: { source: 'meta', campaign: 'launch' } });
  assert.deepEqual(result, { valid: true, value: { utm: { source: 'meta', campaign: 'launch' } } });
});

test('validateSessionCreatePayload rejects a utm with a non-string value', () => {
  const result = validateSessionCreatePayload({ utm: { source: 123 } });
  assert.deepEqual(result, { valid: false, error: 'invalid_utm' });
});

test('validateSessionCreatePayload rejects a utm with too many keys', () => {
  const utm: Record<string, string> = {};
  for (let i = 0; i < 21; i++) utm[`key${i}`] = 'value';
  const result = validateSessionCreatePayload({ utm });
  assert.deepEqual(result, { valid: false, error: 'invalid_utm' });
});

test('validateSessionCreatePayload rejects a utm with an oversized value', () => {
  const result = validateSessionCreatePayload({ utm: { source: 'x'.repeat(257) } });
  assert.deepEqual(result, { valid: false, error: 'invalid_utm' });
});

test('validateContactPayload accepts a full payload and normalizes trimmed fields', () => {
  const result = validateContactPayload({
    sessionId: VALID_SESSION_ID,
    fullName: '  Mor Levi  ',
    phone: ' 050-1234567 ',
    email: ' mor@example.com ',
    businessName: '  Moriz Studio  ',
    link: 'https://moriz.example',
    reviewRequest: 'תבדקו את הדף',
    reviewConsent: true,
    marketingConsent: true,
  });
  assert.deepEqual(result, {
    valid: true,
    value: {
      sessionId: VALID_SESSION_ID,
      fullName: 'Mor Levi',
      phone: '050-1234567',
      email: 'mor@example.com',
      businessName: 'Moriz Studio',
      link: 'https://moriz.example',
      reviewRequest: 'תבדקו את הדף',
      reviewConsent: true,
      marketingConsent: true,
    },
  });
});

test('validateContactPayload accepts a minimal payload, omits absent optionals, defaults marketingConsent', () => {
  const result = validateContactPayload({
    sessionId: VALID_SESSION_ID,
    fullName: 'Mor',
    phone: '0501234567',
    reviewConsent: true,
  });
  assert.deepEqual(result, {
    valid: true,
    value: {
      sessionId: VALID_SESSION_ID,
      fullName: 'Mor',
      phone: '0501234567',
      reviewConsent: true,
      marketingConsent: false,
    },
  });
});

test('validateContactPayload rejects a missing sessionId', () => {
  const result = validateContactPayload({
    fullName: 'Mor',
    phone: '0501234567',
    email: 'mor@example.com',
    reviewConsent: true,
  });
  assert.deepEqual(result, { valid: false, error: 'invalid_sessionId' });
});

test('validateContactPayload rejects a malformed sessionId uuid', () => {
  const result = validateContactPayload({
    sessionId: 'not-a-uuid',
    fullName: 'Mor',
    phone: '0501234567',
    email: 'mor@example.com',
    reviewConsent: true,
  });
  assert.deepEqual(result, { valid: false, error: 'invalid_sessionId_format' });
});

test('validateContactPayload rejects a missing fullName', () => {
  const result = validateContactPayload({
    sessionId: VALID_SESSION_ID,
    phone: '0501234567',
    email: 'mor@example.com',
    reviewConsent: true,
  });
  assert.deepEqual(result, { valid: false, error: 'invalid_fullName' });
});

test('validateContactPayload rejects a malformed email', () => {
  const result = validateContactPayload({
    sessionId: VALID_SESSION_ID,
    fullName: 'Mor',
    phone: '0501234567',
    email: 'not-an-email',
    reviewConsent: true,
  });
  assert.deepEqual(result, { valid: false, error: 'invalid_email' });
});

test('validateContactPayload rejects reviewConsent set to false', () => {
  const result = validateContactPayload({
    sessionId: VALID_SESSION_ID,
    fullName: 'Mor',
    phone: '0501234567',
    email: 'mor@example.com',
    reviewConsent: false,
  });
  assert.deepEqual(result, { valid: false, error: 'consent_required' });
});

test('validateContactPayload rejects a missing reviewConsent', () => {
  const result = validateContactPayload({
    sessionId: VALID_SESSION_ID,
    fullName: 'Mor',
    phone: '0501234567',
    email: 'mor@example.com',
  });
  assert.deepEqual(result, { valid: false, error: 'consent_required' });
});

test('validateContactPayload rejects an over-length required field', () => {
  const result = validateContactPayload({
    sessionId: VALID_SESSION_ID,
    fullName: 'x'.repeat(201),
    phone: '0501234567',
    email: 'mor@example.com',
    reviewConsent: true,
  });
  assert.deepEqual(result, { valid: false, error: 'invalid_fullName' });
});

test('validateContactPayload rejects an over-length optional field', () => {
  const result = validateContactPayload({
    sessionId: VALID_SESSION_ID,
    fullName: 'Mor',
    phone: '0501234567',
    email: 'mor@example.com',
    businessName: 'x'.repeat(201),
    reviewConsent: true,
  });
  assert.deepEqual(result, { valid: false, error: 'invalid_businessName' });
});

test('validateContactPayload rejects a non-boolean marketingConsent', () => {
  const result = validateContactPayload({
    sessionId: VALID_SESSION_ID,
    fullName: 'Mor',
    phone: '0501234567',
    email: 'mor@example.com',
    reviewConsent: true,
    marketingConsent: 'yes',
  });
  assert.deepEqual(result, { valid: false, error: 'invalid_marketingConsent' });
});

// ── P8a §F.1 contact link validation ─────────────────────────────────────────

function contactPayload(link?: unknown): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    sessionId: VALID_SESSION_ID,
    fullName: 'Mor',
    phone: '0501234567',
    email: 'mor@example.com',
    reviewConsent: true,
  };
  if (link !== undefined) payload.link = link;
  return payload;
}

test('normalizeContactLink prepends https:// to a scheme-less domain', () => {
  assert.equal(normalizeContactLink('pandaphysio.co.il'), 'https://pandaphysio.co.il');
});

test('normalizeContactLink keeps a full URL unchanged (no trailing-slash mutation)', () => {
  assert.equal(
    normalizeContactLink('https://moriz.example/page?x=1'),
    'https://moriz.example/page?x=1'
  );
  assert.equal(normalizeContactLink('http://moriz.example'), 'http://moriz.example');
});

test('normalizeContactLink rejects plain text and dot-less hostnames', () => {
  assert.equal(normalizeContactLink('רוברטו'), null);
  assert.equal(normalizeContactLink('localhost'), null);
  assert.equal(normalizeContactLink('not a url'), null);
});

test('normalizeContactLink returns null for empty and whitespace-only input', () => {
  assert.equal(normalizeContactLink(''), null);
  assert.equal(normalizeContactLink('   '), null);
});

test('validateContactPayload stores the normalized link for a scheme-less domain', () => {
  const result = validateContactPayload(contactPayload('pandaphysio.co.il'));
  assert.equal(result.valid, true);
  assert.equal(result.valid && result.value.link, 'https://pandaphysio.co.il');
});

test('validateContactPayload rejects a plain-text link with invalid_link', () => {
  const result = validateContactPayload(contactPayload('רוברטו'));
  assert.deepEqual(result, { valid: false, error: 'invalid_link' });
});

test('validateContactPayload passes with an absent, empty, or whitespace-only link', () => {
  for (const payload of [contactPayload(), contactPayload(''), contactPayload('   ')]) {
    const result = validateContactPayload(payload);
    assert.equal(result.valid, true);
    assert.equal(result.valid && 'link' in result.value, false);
  }
});

test('validateContactPayload rejects a link whose normalized form exceeds the cap', () => {
  // 493-char raw passes the raw-length cap; prepending https:// pushes it past 500.
  const result = validateContactPayload(contactPayload(`${'a'.repeat(490)}.co`));
  assert.deepEqual(result, { valid: false, error: 'invalid_link' });
});

test('validateEventPayload accepts a minimal landing_view event', () => {
  const result = validateEventPayload({ name: 'landing_view', timestamp: VALID_TIMESTAMP });
  assert.deepEqual(result, {
    valid: true,
    value: { name: 'landing_view', timestamp: VALID_TIMESTAMP },
  });
});

test('validateEventPayload accepts a full question_answered event with attribution', () => {
  const result = validateEventPayload({
    name: 'question_answered',
    sessionId: VALID_SESSION_ID,
    timestamp: VALID_TIMESTAMP,
    attribution: VALID_ATTRIBUTION,
    questionId: 'current_asset',
    answer: { type: 'single', optionId: 'nothing' },
  });
  assert.deepEqual(result, {
    valid: true,
    value: {
      name: 'question_answered',
      sessionId: VALID_SESSION_ID,
      timestamp: VALID_TIMESTAMP,
      attribution: VALID_ATTRIBUTION,
      questionId: 'current_asset',
      answer: { type: 'single', optionId: 'nothing' },
    },
  });
});

test('validateEventPayload accepts a multi answer summary', () => {
  const result = validateEventPayload({
    name: 'question_answered',
    timestamp: VALID_TIMESTAMP,
    questionId: 'user_actions',
    answer: { type: 'multi', optionIds: ['leave_details', 'buy_or_pay'] },
  });
  assert.deepEqual(result, {
    valid: true,
    value: {
      name: 'question_answered',
      timestamp: VALID_TIMESTAMP,
      questionId: 'user_actions',
      answer: { type: 'multi', optionIds: ['leave_details', 'buy_or_pay'] },
    },
  });
});

test('validateEventPayload keeps historical personalization_need analytics events shape-valid', () => {
  const result = validateEventPayload({
    name: 'question_answered',
    timestamp: VALID_TIMESTAMP,
    questionId: 'personalization_need',
    answer: { type: 'single', optionId: 'by_user_data' },
  });
  assert.deepEqual(result, {
    valid: true,
    value: {
      name: 'question_answered',
      timestamp: VALID_TIMESTAMP,
      questionId: 'personalization_need',
      answer: { type: 'single', optionId: 'by_user_data' },
    },
  });
});

test('validateEventPayload accepts a result_viewed event with primarySolution and leadTier', () => {
  const result = validateEventPayload({
    name: 'result_viewed',
    timestamp: VALID_TIMESTAMP,
    primarySolution: 'trust_website',
    leadTier: 'A',
  });
  assert.deepEqual(result, {
    valid: true,
    value: {
      name: 'result_viewed',
      timestamp: VALID_TIMESTAMP,
      primarySolution: 'trust_website',
      leadTier: 'A',
    },
  });
});

test('validateEventPayload accepts an ai_personalization_fallback event with a reason', () => {
  const result = validateEventPayload({
    name: 'ai_personalization_fallback',
    timestamp: VALID_TIMESTAMP,
    reason: 'timeout',
  });
  assert.deepEqual(result, {
    valid: true,
    value: { name: 'ai_personalization_fallback', timestamp: VALID_TIMESTAMP, reason: 'timeout' },
  });
});

test('validateEventPayload strips a stray value field from a text answer instead of rejecting it', () => {
  const result = validateEventPayload({
    name: 'question_answered',
    timestamp: VALID_TIMESTAMP,
    questionId: 'business_description',
    answer: { type: 'text', value: 'sensitive free text' },
  });
  assert.deepEqual(result, {
    valid: true,
    value: {
      name: 'question_answered',
      timestamp: VALID_TIMESTAMP,
      questionId: 'business_description',
      answer: { type: 'text' },
    },
  });
  assert.equal(JSON.stringify(result).includes('sensitive free text'), false);
});

test('validateEventPayload strips an extra key from a single answer instead of passing it through', () => {
  const result = validateEventPayload({
    name: 'question_answered',
    timestamp: VALID_TIMESTAMP,
    questionId: 'current_asset',
    answer: { type: 'single', optionId: 'nothing', value: 'sensitive free text' },
  });
  assert.deepEqual(result, {
    valid: true,
    value: {
      name: 'question_answered',
      timestamp: VALID_TIMESTAMP,
      questionId: 'current_asset',
      answer: { type: 'single', optionId: 'nothing' },
    },
  });
  assert.equal(JSON.stringify(result).includes('sensitive free text'), false);
});

test('validateEventPayload strips an extra key from a multi answer instead of passing it through', () => {
  const result = validateEventPayload({
    name: 'question_answered',
    timestamp: VALID_TIMESTAMP,
    questionId: 'user_actions',
    answer: { type: 'multi', optionIds: ['leave_details'], notes: 'sensitive free text' },
  });
  assert.deepEqual(result, {
    valid: true,
    value: {
      name: 'question_answered',
      timestamp: VALID_TIMESTAMP,
      questionId: 'user_actions',
      answer: { type: 'multi', optionIds: ['leave_details'] },
    },
  });
  assert.equal(JSON.stringify(result).includes('sensitive free text'), false);
});

test('validateEventPayload rejects an oversized optionId (free text disguised as a single answer)', () => {
  const result = validateEventPayload({
    name: 'question_answered',
    timestamp: VALID_TIMESTAMP,
    questionId: 'current_asset',
    answer: { type: 'single', optionId: 'x'.repeat(101) },
  });
  assert.deepEqual(result, { valid: false, error: 'invalid_answer' });
});

test('validateEventPayload rejects a multi answer with too many optionIds', () => {
  const result = validateEventPayload({
    name: 'question_answered',
    timestamp: VALID_TIMESTAMP,
    questionId: 'user_actions',
    answer: { type: 'multi', optionIds: Array.from({ length: 21 }, (_, i) => `id${i}`) },
  });
  assert.deepEqual(result, { valid: false, error: 'invalid_answer' });
});

test('validateEventPayload strips an extra key from attribution instead of passing it through', () => {
  const result = validateEventPayload({
    name: 'landing_view',
    timestamp: VALID_TIMESTAMP,
    attribution: { ...VALID_ATTRIBUTION, email: 'sensitive@example.com' },
  });
  assert.deepEqual(result, {
    valid: true,
    value: { name: 'landing_view', timestamp: VALID_TIMESTAMP, attribution: VALID_ATTRIBUTION },
  });
  assert.equal(JSON.stringify(result).includes('sensitive@example.com'), false);
});

test('validateEventPayload rejects an oversized attribution landingPath', () => {
  const result = validateEventPayload({
    name: 'landing_view',
    timestamp: VALID_TIMESTAMP,
    attribution: { ...VALID_ATTRIBUTION, landingPath: '/'.concat('a'.repeat(500)) },
  });
  assert.deepEqual(result, { valid: false, error: 'invalid_attribution' });
});

test('validateEventPayload normalizes a valid but non-canonical timestamp', () => {
  const result = validateEventPayload({ name: 'landing_view', timestamp: '2026-07-04T12:00:00Z' });
  assert.deepEqual(result, {
    valid: true,
    value: { name: 'landing_view', timestamp: '2026-07-04T12:00:00.000Z' },
  });
});

test('validateEventPayload rejects a non-object body', () => {
  const result = validateEventPayload(null);
  assert.deepEqual(result, { valid: false, error: 'invalid_body' });
});

test('validateEventPayload rejects an array body', () => {
  const result = validateEventPayload([]);
  assert.deepEqual(result, { valid: false, error: 'invalid_body' });
});

test('validateEventPayload rejects an unknown event name', () => {
  const result = validateEventPayload({ name: 'bogus_event', timestamp: VALID_TIMESTAMP });
  assert.deepEqual(result, { valid: false, error: 'invalid_name' });
});

test('validateEventPayload rejects a missing timestamp', () => {
  const result = validateEventPayload({ name: 'landing_view' });
  assert.deepEqual(result, { valid: false, error: 'invalid_timestamp' });
});

test('validateEventPayload rejects an unparseable timestamp', () => {
  const result = validateEventPayload({ name: 'landing_view', timestamp: 'not-a-date' });
  assert.deepEqual(result, { valid: false, error: 'invalid_timestamp' });
});

test('validateEventPayload rejects a non-UUID sessionId', () => {
  const result = validateEventPayload({
    name: 'landing_view',
    timestamp: VALID_TIMESTAMP,
    sessionId: 'abc-123',
  });
  assert.deepEqual(result, { valid: false, error: 'invalid_sessionId_format' });
});

test('validateEventPayload rejects an attribution missing required fields', () => {
  const result = validateEventPayload({
    name: 'landing_view',
    timestamp: VALID_TIMESTAMP,
    attribution: { utm: { utm_source: 'meta' } },
  });
  assert.deepEqual(result, { valid: false, error: 'invalid_attribution' });
});

test('validateEventPayload rejects an empty questionId', () => {
  const result = validateEventPayload({
    name: 'question_answered',
    timestamp: VALID_TIMESTAMP,
    questionId: '',
    answer: { type: 'text' },
  });
  assert.deepEqual(result, { valid: false, error: 'invalid_questionId' });
});

test('validateEventPayload rejects an over-length questionId', () => {
  const result = validateEventPayload({
    name: 'question_answered',
    timestamp: VALID_TIMESTAMP,
    questionId: 'x'.repeat(101),
    answer: { type: 'text' },
  });
  assert.deepEqual(result, { valid: false, error: 'invalid_questionId' });
});

test('validateEventPayload rejects an answer with an invalid shape', () => {
  const result = validateEventPayload({
    name: 'question_answered',
    timestamp: VALID_TIMESTAMP,
    questionId: 'current_asset',
    answer: { type: 'single' },
  });
  assert.deepEqual(result, { valid: false, error: 'invalid_answer' });
});

test('validateEventPayload rejects an unknown primarySolution', () => {
  const result = validateEventPayload({
    name: 'result_viewed',
    timestamp: VALID_TIMESTAMP,
    primarySolution: 'bogus_solution',
    leadTier: 'A',
  });
  assert.deepEqual(result, { valid: false, error: 'invalid_primarySolution' });
});

test('validateEventPayload rejects an unknown leadTier', () => {
  const result = validateEventPayload({
    name: 'result_viewed',
    timestamp: VALID_TIMESTAMP,
    primarySolution: 'trust_website',
    leadTier: 'Z',
  });
  assert.deepEqual(result, { valid: false, error: 'invalid_leadTier' });
});

test('validateEventPayload rejects an unknown ai fallback reason', () => {
  const result = validateEventPayload({
    name: 'ai_personalization_fallback',
    timestamp: VALID_TIMESTAMP,
    reason: 'bogus_reason',
  });
  assert.deepEqual(result, { valid: false, error: 'invalid_reason' });
});
