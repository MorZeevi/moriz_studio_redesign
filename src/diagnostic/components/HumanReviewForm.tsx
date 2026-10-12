'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { trackDiagnosticEvent } from '@/diagnostic/analytics';
import { withBasePath } from '@/diagnostic/basePath';
import styles from './HumanReviewForm.module.css';

interface HumanReviewFormProps {
  sessionId: string;
}

const CONSENT_ERROR = 'צריך לאשר את מדיניות הפרטיות כדי לשלוח';
const GENERIC_ERROR = 'שליחת הפרטים נכשלה. נסו שוב.';

export default function HumanReviewForm({ sessionId }: HumanReviewFormProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [reviewRequest, setReviewRequest] = useState('');
  const [reviewConsent, setReviewConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    trackDiagnosticEvent({ name: 'lead_form_started', sessionId });
  }, [sessionId]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!reviewConsent) {
      setError(CONSENT_ERROR);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(withBasePath('/api/diagnostic/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          fullName,
          phone,
          reviewRequest,
          reviewConsent,
          marketingConsent: false,
        }),
      });
      if (!res.ok) throw new Error('contact_failed');
      trackDiagnosticEvent({ name: 'lead_submitted', sessionId });
      setDone(true);
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return <p className={styles.success}>קיבלנו! נחזור אליכם בקרוב.</p>;
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.heading}>רוצה שנעבור על האבחון יחד?</h2>

      <label className={styles.field}>
        שם מלא
        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </label>

      <label className={styles.field}>
        טלפון
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </label>

      <label className={styles.field}>
        לפני שמדברים, רוצים לתת לי משהו שכדאי לי לעבור עליו? (לא חובה)
        <textarea value={reviewRequest} onChange={(e) => setReviewRequest(e.target.value)} />
      </label>

      <label className={styles.checkbox}>
        <input type="checkbox" checked={reviewConsent} onChange={(e) => setReviewConsent(e.target.checked)} />
        <span>
          קראתי את{' '}
          <a href="https://moriz.studio/he/privacy-policy" onClick={(event) => event.stopPropagation()}>
            מדיניות הפרטיות
          </a>{' '}
          ואני מסכים/ה לשימוש בפרטים שמסרתי לצורך מענה לפנייה שלי.
        </span>
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.submit} disabled={submitting}>
        שליחה לבדיקה אישית
      </button>
    </form>
  );
}
