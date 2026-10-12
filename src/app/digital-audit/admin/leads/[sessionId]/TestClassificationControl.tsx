'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { classifySessionFromAdmin } from '@/diagnostic/testSessionClient';
import { getClassificationSuccessMessageHe } from '@/diagnostic/testClassificationView';
import styles from './page.module.css';

interface TestClassificationControlProps {
  sessionId: string;
  secret: string;
  initialIsTest: boolean;
}

const GENERIC_ERROR = 'עדכון סיווג הנתונים נכשל. נסו שוב.';

export default function TestClassificationControl({
  sessionId,
  secret,
  initialIsTest,
}: TestClassificationControlProps) {
  const router = useRouter();
  const [isTest, setIsTest] = useState(initialIsTest);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function updateClassification() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const canonicalIsTest = await classifySessionFromAdmin(
        {
          sessionId,
          secret,
          action: isTest ? 'restore_real' : 'mark_test',
        },
        {
          fetch: window.fetch.bind(window),
          confirm: window.confirm.bind(window),
          refresh: () => router.refresh(),
        },
      );
      if (canonicalIsTest !== null) {
        setIsTest(canonicalIsTest);
        setSuccess(getClassificationSuccessMessageHe(canonicalIsTest));
      }
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.classificationControl}>
      <div className={styles.classificationRow}>
        <span className={isTest ? styles.testClassificationBadge : styles.realClassificationBadge}>
          {isTest ? 'נתוני בדיקה' : 'נתוני אמת'}
        </span>
        <button
          type="button"
          className={isTest ? styles.restoreButton : styles.destructiveButton}
          disabled={busy}
          onClick={() => void updateClassification()}
        >
          {busy ? 'מעדכנים…' : isTest ? 'שחזור כנתוני אמת' : 'סימון כנתוני בדיקה'}
        </button>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className={styles.classificationSuccess} role="status" aria-live="polite">
          {success}
        </p>
      )}
    </div>
  );
}
