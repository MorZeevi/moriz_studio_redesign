import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildQuestionReadbackRows, getMatchedSignalLabelHe } from './questionReadback.ts';
import { LEGACY_QUESTION_COPY, QUESTIONS } from '../diagnostic-core/questions.ts';
import type { DiagnosticAnswers } from '../diagnostic-core/types.ts';

function row(rows: ReturnType<typeof buildQuestionReadbackRows>, questionId: string) {
  return rows.find((r) => r.questionId === questionId);
}

const CURRENT_USER_ACTIONS_PROMPT = QUESTIONS.find((q) => q.id === 'user_actions')!.promptHe;

test('every current question renders as a row in questionnaire order', () => {
  const rows = buildQuestionReadbackRows({});
  assert.equal(rows.length, QUESTIONS.length);
  assert.deepEqual(
    rows.map((r) => r.questionId),
    QUESTIONS.map((q) => q.id)
  );
});

test('an unanswered current question reads as "not answered"', () => {
  const rows = buildQuestionReadbackRows({});
  assert.equal(row(rows, 'primary_goal')?.answerHe, 'לא נענה');
});

test('a text answer is echoed verbatim', () => {
  const answers: DiagnosticAnswers = {
    business_description: { type: 'text', value: 'קליניקה אסתטית' },
  };
  assert.equal(row(buildQuestionReadbackRows(answers), 'business_description')?.answerHe, 'קליניקה אסתטית');
});

test('current user_actions ids render under the current prompt and current labels', () => {
  const answers: DiagnosticAnswers = {
    user_actions: { type: 'multi', optionIds: ['contact_or_book', 'track_work'] },
  };
  const uaRow = row(buildQuestionReadbackRows(answers), 'user_actions');
  const expected = ['contact_or_book', 'track_work']
    .map((id) => QUESTIONS.find((q) => q.id === 'user_actions')!.options!.find((o) => o.id === id)!.labelHe)
    .join(', ');
  assert.equal(uaRow?.answerHe, expected);
  // A current-form answer keeps the reworded current prompt -- the historical
  // bridge must not leak into new data.
  assert.equal(uaRow?.promptHe, CURRENT_USER_ACTIONS_PROMPT);
});

test('legacy user_actions ids render under the historical prompt and legacy labels (tier 2)', () => {
  const answers: DiagnosticAnswers = {
    user_actions: { type: 'multi', optionIds: ['read_and_understand', 'leave_details'] },
  };
  const uaRow = row(buildQuestionReadbackRows(answers), 'user_actions');
  const expected = [
    LEGACY_QUESTION_COPY.user_actions.optionsHe.read_and_understand,
    LEGACY_QUESTION_COPY.user_actions.optionsHe.leave_details,
  ].join(', ');
  assert.equal(uaRow?.answerHe, expected);
  // Old answers belong under the prompt they were actually shown with, not the
  // reworded current copy.
  assert.equal(uaRow?.promptHe, LEGACY_QUESTION_COPY.user_actions.promptHe);
  assert.notEqual(uaRow?.promptHe, CURRENT_USER_ACTIONS_PROMPT);
});

test('a removed question (personalization_need) renders immediately after user_actions, not appended', () => {
  const answers: DiagnosticAnswers = {
    user_actions: { type: 'multi', optionIds: ['read_and_understand'] },
    personalization_need: { type: 'single', optionId: 'by_user_data' },
  };
  const rows = buildQuestionReadbackRows(answers);
  const ids = rows.map((r) => r.questionId);
  // In its original slot, directly after user_actions -- interleaved, not appended.
  const uaIndex = ids.indexOf('user_actions');
  assert.equal(ids[uaIndex + 1], 'personalization_need');
  assert.notEqual(ids[ids.length - 1], 'personalization_need');
  const legacyRow = row(rows, 'personalization_need');
  assert.equal(legacyRow?.promptHe, LEGACY_QUESTION_COPY.personalization_need.promptHe);
  assert.equal(legacyRow?.answerHe, LEGACY_QUESTION_COPY.personalization_need.optionsHe.by_user_data);
});

test('an unknown stored option id falls back to the raw id (tier 3), never blank', () => {
  const answers: DiagnosticAnswers = {
    primary_goal: { type: 'single', optionId: 'a_goal_that_never_existed' },
  };
  assert.equal(row(buildQuestionReadbackRows(answers), 'primary_goal')?.answerHe, 'a_goal_that_never_existed');
});

test('an answer to an unknown, copy-less question renders a raw-id fallback row (tier 3), never dropped', () => {
  const answers: DiagnosticAnswers = {
    ghost_question: { type: 'single', optionId: 'x' },
  };
  const ghost = row(buildQuestionReadbackRows(answers), 'ghost_question');
  // Prompt and answer fall back to the raw ids so a future retired question's
  // stored answer stays visible in the admin view instead of silently vanishing.
  assert.equal(ghost?.promptHe, 'ghost_question');
  assert.equal(ghost?.answerHe, 'x');
});

test('getMatchedSignalLabelHe prefers an explicit reasonHe', () => {
  assert.equal(
    getMatchedSignalLabelHe({ questionId: 'user_actions', optionId: 'track_work', weight: 2, reasonHe: 'סיבה מפורשת' }),
    'סיבה מפורשת'
  );
});

test('getMatchedSignalLabelHe resolves a current option label', () => {
  const label = QUESTIONS.find((q) => q.id === 'user_actions')!.options!.find((o) => o.id === 'track_work')!.labelHe;
  assert.equal(getMatchedSignalLabelHe({ questionId: 'user_actions', optionId: 'track_work', weight: 2 }), label);
});

test('getMatchedSignalLabelHe resolves a legacy option label', () => {
  assert.equal(
    getMatchedSignalLabelHe({ questionId: 'user_actions', optionId: 'manage_process', weight: 2 }),
    LEGACY_QUESTION_COPY.user_actions.optionsHe.manage_process
  );
});

test('getMatchedSignalLabelHe falls back to questionId/optionId when nothing matches', () => {
  assert.equal(
    getMatchedSignalLabelHe({ questionId: 'user_actions', optionId: 'nope', weight: 1 }),
    'user_actions/nope'
  );
});
