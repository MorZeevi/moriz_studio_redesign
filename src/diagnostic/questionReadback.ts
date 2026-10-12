// Admin-view readback: turn stored diagnostic answers into readable Hebrew rows,
// including answers from retired questionnaire versions. Pure and portable
// (no React/Next/Supabase), so the admin page just renders what this returns.
//
// Label lookup order for every option id: current QUESTIONS -> the frozen
// LEGACY_QUESTION_COPY for that question -> the raw id (never blank). This keeps
// a pre-slice-2 lead's answers (old user_actions ids, the removed
// personalization_need question) readable instead of vanishing or showing raw ids.

import { LEGACY_QUESTION_COPY, QUESTIONS } from '../diagnostic-core/questions.ts';
import type { AnswerValue, DiagnosticAnswers, MatchedSignal } from '../diagnostic-core/types.ts';

export interface QuestionReadbackRow {
  questionId: string;
  promptHe: string;
  answerHe: string;
}

// Bridge the `as const` copy table to a plain string-keyed lookup so an
// arbitrary stored id (including retired ones) can be resolved at runtime.
const LEGACY = LEGACY_QUESTION_COPY as unknown as Record<
  string,
  { promptHe: string; optionsHe: Record<string, string> }
>;

function optionLabelHe(questionId: string, optionId: string): string {
  const current = QUESTIONS.find((q) => q.id === questionId)?.options?.find((o) => o.id === optionId)?.labelHe;
  if (current) return current;
  const legacy = LEGACY[questionId]?.optionsHe[optionId];
  if (legacy) return legacy;
  return optionId;
}

function answerLabelHe(questionId: string, answer: AnswerValue | undefined): string {
  if (!answer) return 'לא נענה';
  if (answer.type === 'text') return answer.value;
  if (answer.type === 'single') return optionLabelHe(questionId, answer.optionId);
  return answer.optionIds.map((id) => optionLabelHe(questionId, id)).join(', ');
}

// A stored user_actions answer is legacy when it carries any option id the current
// question no longer offers. The pre-slice-2 ids have no overlap with the reworded
// set, so a single foreign id is an unambiguous "this was answered on the old form"
// -> render it under the historical prompt it was actually shown with.
function isLegacyUserActions(answer: AnswerValue | undefined): boolean {
  if (answer?.type !== 'multi') return false;
  const current = new Set(
    QUESTIONS.find((q) => q.id === 'user_actions')?.options?.map((o) => o.id) ?? [],
  );
  return answer.optionIds.some((id) => !current.has(id));
}

export function buildQuestionReadbackRows(answers: DiagnosticAnswers): QuestionReadbackRow[] {
  const rows: QuestionReadbackRow[] = [];

  for (const question of QUESTIONS) {
    const answer = answers[question.id];
    const promptHe =
      question.id === 'user_actions' && isLegacyUserActions(answer)
        ? LEGACY.user_actions.promptHe
        : question.promptHe;
    rows.push({ questionId: question.id, promptHe, answerHe: answerLabelHe(question.id, answer) });

    // personalization_need was removed directly after user_actions. A legacy lead's
    // answer to it renders in its original slot -- immediately after user_actions --
    // not appended after the rest of the flow.
    if (question.id === 'user_actions') {
      const legacyAnswer = answers.personalization_need;
      const legacyPrompt = LEGACY.personalization_need?.promptHe;
      if (legacyAnswer && legacyPrompt) {
        rows.push({
          questionId: 'personalization_need',
          promptHe: legacyPrompt,
          answerHe: answerLabelHe('personalization_need', legacyAnswer),
        });
      }
    }
  }

  // Defensive tail: any other retired question with a stored answer that isn't
  // already rendered inline (personalization_need is placed above and skipped here).
  // The prompt falls back frozen copy -> raw id (never blank), matching the tier-3
  // label rule, so an unforeseen legacy answer stays visible instead of dropping.
  const currentIds = new Set(QUESTIONS.map((q) => q.id));
  for (const questionId of Object.keys(answers)) {
    if (currentIds.has(questionId) || questionId === 'personalization_need') continue;
    const promptHe = LEGACY[questionId]?.promptHe ?? questionId;
    rows.push({ questionId, promptHe, answerHe: answerLabelHe(questionId, answers[questionId]) });
  }

  return rows;
}

export function getMatchedSignalLabelHe(signal: MatchedSignal): string {
  if (signal.reasonHe) return signal.reasonHe;
  const label = optionLabelHe(signal.questionId, signal.optionId);
  // optionLabelHe's last resort is the bare optionId; the admin view prefers the
  // richer questionId/optionId form when neither current nor legacy copy matched.
  return label === signal.optionId ? `${signal.questionId}/${signal.optionId}` : label;
}
