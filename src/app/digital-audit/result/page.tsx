'use client';

import { useEffect, useRef, useState } from 'react';
import DiagnosticResult from '@/diagnostic/components/DiagnosticResult';
import HumanReviewForm from '@/diagnostic/components/HumanReviewForm';
import HomeLink from '@/diagnostic/components/HomeLink';
import { clearStoredSession, loadStoredSession } from '@/diagnostic/session-client';
import { trackDiagnosticEvent } from '@/diagnostic/analytics';
import { withBasePath } from '@/diagnostic/basePath';
import type { PersonalizeRes } from '@/diagnostic/api-types';
import type { PersonalizedDiagnosticCopy } from '@/diagnostic/ai/types';
import type { DiagnosticResult as DiagnosticResultData } from '@/diagnostic-core/types';
import styles from './page.module.css';

export default function DigitalAuditResultPage() {
  const [result, setResult] = useState<DiagnosticResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [personalization, setPersonalization] = useState<PersonalizedDiagnosticCopy | null>(null);
  const [aiPending, setAiPending] = useState(true);
  const personalizeFired = useRef(false);
  const resultViewedFired = useRef(false);

  async function loadResult() {
    const stored = loadStoredSession();
    if (!stored) {
      setError('לא נמצא אבחון פעיל. התחילו אבחון חדש.');
      setLoading(false);
      return;
    }
    setSessionId(stored.sessionId);

    try {
      const res = await fetch(withBasePath('/api/diagnostic/result'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: stored.sessionId }),
      });
      if (res.status === 404) {
        clearStoredSession();
        setError('האבחון לא נמצא. התחילו אבחון חדש.');
        return;
      }
      if (!res.ok) throw new Error('result_failed');
      const data: { result: DiagnosticResultData } = await res.json();
      setResult(data.result);
    } catch {
      setError('טעינת התוצאה נכשלה. נסו לרענן את הדף.');
    } finally {
      setLoading(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: deliberate one-shot mount fetch; adding deps would re-run it (kept verbatim from the standalone app)
  useEffect(() => {
    // ponytail: one-shot mount fetch gated on localStorage (client-only, can't move to server).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadResult();
  }, []);

  useEffect(() => {
    if (!result || resultViewedFired.current) return;
    resultViewedFired.current = true;
    trackDiagnosticEvent({
      name: 'result_viewed',
      sessionId: sessionId ?? undefined,
      primarySolution: result.primarySolution,
      leadTier: result.leadTier,
    });
  }, [result, sessionId]);

  useEffect(() => {
    // Fires once, in the background, only after the deterministic result is
    // in. Never blocks/gates the render above. Any failure (non-2xx, thrown,
    // aborted) is swallowed on purpose — the user never learns AI was tried.
    if (!result || !sessionId || personalizeFired.current) return;
    personalizeFired.current = true;

    (async () => {
      trackDiagnosticEvent({ name: 'ai_personalization_started', sessionId });
      // ponytail: client-side 12s bound sits above the server's ~8s AI_TIMEOUT_MS,
      // so the server resolves first in the normal case; this only catches a true
      // network black-hole so the prominent loader can't hang forever (closes P7a
      // P2). An abort lands in the catch below, which already runs the fallback.
      const controller = new AbortController();
      const abortTimer = setTimeout(() => controller.abort(), 12000);
      try {
        const res = await fetch(withBasePath('/api/diagnostic/personalize'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
          signal: controller.signal,
        });
        if (!res.ok) {
          trackDiagnosticEvent({ name: 'ai_personalization_fallback', sessionId, reason: 'fetch_failed' });
          setAiPending(false);
          return;
        }
        const data: PersonalizeRes = await res.json();
        if (data.personalization) {
          setPersonalization(data.personalization);
          trackDiagnosticEvent({ name: 'ai_personalization_generated', sessionId });
        } else {
          trackDiagnosticEvent({
            name: 'ai_personalization_fallback',
            sessionId,
            reason: data.reason ?? 'fetch_failed',
          });
        }
        setAiPending(false);
      } catch {
        // silent — deterministic result already rendered, AI is optional
        trackDiagnosticEvent({ name: 'ai_personalization_fallback', sessionId, reason: 'fetch_failed' });
        setAiPending(false);
      } finally {
        clearTimeout(abortTimer);
      }
    })();
  }, [result, sessionId]);

  if (loading) {
    return (
      <>
        <HomeLink />
        <p className={styles.status}>טוען תוצאה...</p>
      </>
    );
  }

  if (error || !result) {
    return (
      <>
        <HomeLink />
        <p className={styles.error}>{error ?? 'שגיאה לא צפויה.'}</p>
      </>
    );
  }

  return (
    <>
      <HomeLink />
      <DiagnosticResult
        result={result}
        personalization={personalization}
        aiPending={aiPending}
        onContactClick={!showForm
          ? () => {
            trackDiagnosticEvent({ name: 'contact_cta_clicked', sessionId: sessionId ?? undefined });
            setShowForm(true);
          }
          : undefined}
      />
      {showForm && sessionId && <HumanReviewForm sessionId={sessionId} />}
    </>
  );
}
