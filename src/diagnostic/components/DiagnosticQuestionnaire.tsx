'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QUESTIONS } from '@/diagnostic-core/questions';
import type { AnswerValue, DiagnosticAnswers } from '@/diagnostic-core/types';
import {
  clearStoredSession,
  CURRENT_QUESTIONNAIRE_VERSION,
  loadStoredSession,
  saveStoredSession,
  type StoredSession,
} from '@/diagnostic/session-client';
import { toAnsweredSummary, trackDiagnosticEvent } from '@/diagnostic/analytics';
import { getAttribution } from '@/diagnostic/attribution';
import { withBasePath } from '@/diagnostic/basePath';
import ProgressIndicator from './ProgressIndicator';
import QuestionStep from './QuestionStep';
import styles from './DiagnosticQuestionnaire.module.css';

export default function DiagnosticQuestionnaire() {
  const router = useRouter();
  const [session, setSession] = useState<StoredSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function initSession() {
    setError(null);
    const stored = loadStoredSession();
    if (stored) {
      setSession(stored);
      setLoading(false);
      return;
    }

    try {
      const utm = getAttribution()?.utm;
      const res = await fetch(withBasePath('/api/diagnostic/session'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(utm ? { utm } : {}),
      });
      if (!res.ok) throw new Error('session_create_failed');
      const data: { sessionId: string; startedAt: string } = await res.json();
      const fresh: StoredSession = {
        questionnaireVersion: CURRENT_QUESTIONNAIRE_VERSION,
        sessionId: data.sessionId,
        answers: {},
        currentStep: 0,
      };
      saveStoredSession(fresh);
      setSession(fresh);
    } catch {
      setError('לא הצלחנו להתחיל את האבחון. נסו לרענן את הדף.');
    } finally {
      setLoading(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: deliberate one-shot mount fetch; adding deps would re-run it (kept verbatim from the standalone app)
  useEffect(() => {
    // ponytail: one-shot mount fetch gated on localStorage (client-only, can't move to server).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void initSession();
  }, []);

  async function restartSession() {
    clearStoredSession();
    setSession(null);
    await initSession();
  }

  if (loading) return <p className={styles.status}>טוען...</p>;
  if (error || !session) return <p className={styles.error}>{error ?? 'שגיאה לא צפויה.'}</p>;

  const currentStep = session.currentStep;
  const question = QUESTIONS[currentStep];
  const isLastStep = currentStep === QUESTIONS.length - 1;
  const currentAnswer = session.answers[question.id];
  const canProceed = !question.required || hasValidAnswer();

  function hasValidAnswer(): boolean {
    if (currentAnswer === undefined) return false;
    if (currentAnswer.type === 'text') {
      return currentAnswer.value.trim().length >= (question.minLengthTrimmed ?? 1);
    }
    if (currentAnswer.type === 'multi') {
      return currentAnswer.optionIds.length > 0;
    }
    return true;
  }

  function updateAnswer(answer: AnswerValue) {
    if (!session) return;
    const answers: DiagnosticAnswers = { ...session.answers, [question.id]: answer };
    const next = { ...session, answers };
    setSession(next);
    saveStoredSession(next);
  }

  async function goNext() {
    if (!session) return;
    setSubmitting(true);
    setError(null);
    try {
      const answer = session.answers[question.id];
      if (answer) {
        const res = await fetch(withBasePath('/api/diagnostic/answer'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: session.sessionId, questionId: question.id, answer }),
        });
        if (res.status === 404) {
          await restartSession();
          return;
        }
        if (res.status === 409) {
          // Session already finalized; its result is immutable. Send the user to
          // their result instead of silently dropping the new answer.
          router.push(withBasePath('/result'));
          return;
        }
        if (!res.ok) throw new Error('answer_save_failed');
        trackDiagnosticEvent({
          name: 'question_answered',
          sessionId: session.sessionId,
          questionId: question.id,
          answer: toAnsweredSummary(answer),
        });
      }

      if (isLastStep) {
        const resultRes = await fetch(withBasePath('/api/diagnostic/result'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: session.sessionId }),
        });
        if (resultRes.status === 404) {
          await restartSession();
          return;
        }
        if (!resultRes.ok) throw new Error('result_failed');
        trackDiagnosticEvent({ name: 'diagnostic_completed', sessionId: session.sessionId });
        router.push(withBasePath('/result'));
        return;
      }

      const next = { ...session, currentStep: currentStep + 1 };
      setSession(next);
      saveStoredSession(next);
    } catch {
      setError('שמירת התשובה נכשלה. נסו שוב.');
    } finally {
      setSubmitting(false);
    }
  }

  function goBack() {
    if (!session || currentStep === 0) return;
    const next = { ...session, currentStep: currentStep - 1 };
    setSession(next);
    saveStoredSession(next);
  }

  return (
    <div className={styles.questionnaire}>
      <ProgressIndicator currentStep={currentStep} totalSteps={QUESTIONS.length} />
      <QuestionStep question={question} answer={currentAnswer} onChange={updateAnswer} />
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.actions}>
        <button type="button" onClick={goBack} disabled={currentStep === 0 || submitting}>
          חזרה
        </button>
        <button type="button" onClick={() => void goNext()} disabled={!canProceed || submitting}>
          {isLastStep ? 'סיום' : 'הבא'}
        </button>
      </div>
    </div>
  );
}
