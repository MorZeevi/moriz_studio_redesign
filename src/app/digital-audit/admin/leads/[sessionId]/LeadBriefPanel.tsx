'use client';

import { useState } from 'react';

import type { LeadBrief, LeadBriefFailureReason } from '@/diagnostic/api-types';
import { withBasePath } from '@/diagnostic/basePath';
import styles from './page.module.css';

// The secret prop is the value from the admin's own URL (searchParams on the
// server page) — never process.env.ADMIN_ACCESS_SECRET, which must not reach
// a client component.
interface LeadBriefPanelProps {
  sessionId: string;
  secret: string;
  initialBrief: LeadBrief | null;
}

const GENERIC_ERROR = 'הפעולה נכשלה. נסו שוב.';
const NO_DRAFT_ERROR = 'אין עדיין טיוטה לאישור. שמרו קודם.';
// Mirrors the server's MIN_EVIDENCE_TRIMMED_LENGTH (leadBriefService.ts) —
// not imported because that module is server-only.
const EVIDENCE_MIN_LENGTH = 10;
const EVIDENCE_REQUIRED_ERROR =
  'כדי לייצר אודיט AI צריך להדביק קודם ראיות או ממצאים בשדה הראיות (לפחות 10 תווים).';
const REASON_TEXT: Record<LeadBriefFailureReason, string> = {
  disabled: 'יצירת AI כבויה כרגע. אפשר להדביק טקסט ידנית וללחוץ שמירה.',
  timeout: 'הבקשה לספק ה-AI חרגה מהזמן. נסו שוב.',
  provider_error: 'שגיאה מול ספק ה-AI. נסו שוב.',
  invalid_output: 'הפלט מה-AI לא עבר בדיקת תקינות. נסו שוב או הדביקו ידנית.',
};

type RouteResponse =
  | { ok: true; brief: LeadBrief }
  | { ok: false; reason: LeadBriefFailureReason }
  | { error: string };

type RouteMode = 'save' | 'generate' | 'approve';
type MessageKind = 'success' | 'error';

export default function LeadBriefPanel({ sessionId, secret, initialBrief }: LeadBriefPanelProps) {
  const [evidence, setEvidence] = useState(initialBrief?.evidenceMd ?? '');
  const [internalBrief, setInternalBrief] = useState(initialBrief?.internalBriefMd ?? '');
  const [clientAudit, setClientAudit] = useState(initialBrief?.clientAuditMd ?? '');
  const [busyAction, setBusyAction] = useState<RouteMode | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageKind, setMessageKind] = useState<MessageKind | null>(null);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const busy = busyAction !== null;
  const generating = busyAction === 'generate';

  async function callRoute(
    payload: { mode: RouteMode } & Record<string, unknown>,
    successText: string
  ): Promise<void> {
    setBusyAction(payload.mode);
    setMessage(null);
    setMessageKind(null);
    try {
      const res = await fetch(withBasePath('/api/admin/lead-brief'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as RouteResponse;
      if (!res.ok) {
        setMessage(res.status === 404 && 'error' in data && data.error === 'brief_not_found' ? NO_DRAFT_ERROR : GENERIC_ERROR);
        setMessageKind('error');
        return;
      }
      if ('ok' in data && data.ok) {
        setEvidence(data.brief.evidenceMd ?? '');
        setInternalBrief(data.brief.internalBriefMd ?? '');
        setClientAudit(data.brief.clientAuditMd ?? '');
        setMessage(successText);
        setMessageKind('success');
      } else if ('ok' in data) {
        setMessage(REASON_TEXT[data.reason] ?? GENERIC_ERROR);
        setMessageKind('error');
      } else {
        setMessage(GENERIC_ERROR);
        setMessageKind('error');
      }
    } catch {
      setMessage(GENERIC_ERROR);
      setMessageKind('error');
    } finally {
      setBusyAction(null);
    }
  }

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
  }

  return (
    <section className={styles.section}>
      <h2>בריף ואבחון</h2>
      <p className={styles.hint}>האבחון ללקוח הוא תצפיות בלבד: בלי הבטחות מחיר, לוח זמנים או תוצאות.</p>

      <label className={styles.fieldLabel} htmlFor="evidence">
        ראיות (ממצאים מבדיקת הנוכחות הדיגיטלית)
      </label>
      <textarea
        id="evidence"
        className={styles.textarea}
        rows={8}
        value={evidence}
        onChange={(e) => {
          setEvidence(e.target.value);
          setEvidenceError(null);
        }}
      />
      {evidenceError && (
        <p className={styles.error} role="alert">
          {evidenceError}
        </p>
      )}

      {generating && (
        <p className={styles.srOnly} aria-live="polite">
          ה-AI מנסח כעת את הבריף הפנימי ואת האבחון ללקוח. הפעולה עשויה להימשך עד חצי דקה.
        </p>
      )}

      <div className={styles.blockHeader}>
        <label className={styles.fieldLabel} htmlFor="internalBrief">
          בריף פנימי (למור)
        </label>
        <button
          type="button"
          className={styles.copyButton}
          onClick={() => copy(internalBrief)}
          disabled={!internalBrief || generating}
        >
          העתקה
        </button>
      </div>
      <div className={styles.textareaWrap} aria-busy={generating ? true : undefined}>
        <textarea
          id="internalBrief"
          className={styles.textarea}
          rows={10}
          value={internalBrief}
          onChange={(e) => setInternalBrief(e.target.value)}
        />
        {generating && (
          <div className={`${styles.loadingOverlay} ${styles.fadeIn}`}>
            <div className={styles.loadingDots} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <p className={styles.loadingTitle}>ה-AI מנסח את הבריף הפנימי</p>
          </div>
        )}
      </div>

      <div className={styles.blockHeader}>
        <label className={styles.fieldLabel} htmlFor="clientAudit">
          אבחון ללקוח (לשליחה ידנית בלבד)
        </label>
        <button
          type="button"
          className={styles.copyButton}
          onClick={() => copy(clientAudit)}
          disabled={!clientAudit || generating}
        >
          העתקה
        </button>
      </div>
      <div className={styles.textareaWrap} aria-busy={generating ? true : undefined}>
        <textarea
          id="clientAudit"
          className={styles.textarea}
          rows={10}
          value={clientAudit}
          onChange={(e) => setClientAudit(e.target.value)}
        />
        {generating && (
          <div className={`${styles.loadingOverlay} ${styles.fadeIn}`}>
            <div className={styles.loadingDots} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <p className={styles.loadingTitle}>ה-AI מנסח את האבחון ללקוח</p>
          </div>
        )}
      </div>

      {message && (
        <p
          className={messageKind === 'error' ? styles.error : styles.success}
          role={messageKind === 'error' ? 'alert' : 'status'}
        >
          {message}
        </p>
      )}

      <div className={styles.buttons}>
        <button
          type="button"
          className={styles.actionButton}
          disabled={busy}
          onClick={() =>
            void callRoute(
              {
                mode: 'save',
                sessionId,
                evidenceMd: evidence,
                internalBriefMd: internalBrief,
                clientAuditMd: clientAudit,
              },
              'נשמר.'
            )
          }
        >
          שמירת שינויים
        </button>
        <button
          type="button"
          className={styles.primaryButton}
          disabled={busy}
          onClick={() => {
            setEvidenceError(null);
            if (evidence.trim().length < EVIDENCE_MIN_LENGTH) {
              setEvidenceError(EVIDENCE_REQUIRED_ERROR);
              return;
            }
            void callRoute({ mode: 'generate', sessionId, evidenceMd: evidence }, 'נוצר ונשמר כטיוטה.');
          }}
        >
          {busyAction === 'generate' ? 'מייצר…' : 'יצירה עם AI'}
        </button>
      </div>
    </section>
  );
}
