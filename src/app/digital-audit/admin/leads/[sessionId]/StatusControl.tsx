'use client';

import { useState } from 'react';

import { STATUS_LABELS_HE, type LeadStatus } from '@/diagnostic/leadStatus';
import { withBasePath } from '@/diagnostic/basePath';
import styles from './page.module.css';

// Authenticated by the owner's session cookie (same-origin fetch); no
// credential is passed through props or headers.
interface StatusControlProps {
  sessionId: string;
  initialStatus: LeadStatus;
}

const STATUS_OPTIONS: LeadStatus[] = ['new', 'in_review', 'contacted', 'closed'];
const GENERIC_ERROR = 'עדכון הסטטוס נכשל. נסו שוב.';
const SAVED_MESSAGE = 'הסטטוס עודכן.';

type MessageKind = 'success' | 'error';

export default function StatusControl({ sessionId, initialStatus }: StatusControlProps) {
  const [status, setStatus] = useState<LeadStatus>(initialStatus);
  const [savedStatus, setSavedStatus] = useState<LeadStatus>(initialStatus);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageKind, setMessageKind] = useState<MessageKind | null>(null);

  const dirty = status !== savedStatus;

  async function save() {
    setBusy(true);
    setMessage(null);
    setMessageKind(null);
    try {
      const res = await fetch(withBasePath('/api/admin/lead-status'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, status }),
      });
      if (!res.ok) {
        setMessage(GENERIC_ERROR);
        setMessageKind('error');
        return;
      }
      setSavedStatus(status);
      setMessage(SAVED_MESSAGE);
      setMessageKind('success');
    } catch {
      setMessage(GENERIC_ERROR);
      setMessageKind('error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.statusControl}>
      <div className={styles.statusRow}>
        <select
          id="leadStatus"
          aria-label="סטטוס"
          className={styles.statusSelect}
          value={status}
          disabled={busy}
          onChange={(e) => {
            setStatus(e.target.value as LeadStatus);
            setMessage(null);
            setMessageKind(null);
          }}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS_HE[s]}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={styles.actionButton}
          disabled={busy || !dirty}
          onClick={() => void save()}
        >
          {busy ? 'שומר…' : 'שמירת סטטוס'}
        </button>
      </div>
      {message && (
        <p
          className={messageKind === 'error' ? styles.error : styles.success}
          role={messageKind === 'error' ? 'alert' : 'status'}
        >
          {message}
        </p>
      )}
    </div>
  );
}
