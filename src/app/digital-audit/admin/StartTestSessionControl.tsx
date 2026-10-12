'use client';

import { useRef, useState } from 'react';

import { createAdminTestSession } from '@/diagnostic/testSessionClient';
import styles from './page.module.css';

interface StartTestSessionControlProps {
  secret: string;
}

const GENERIC_ERROR = 'לא הצלחנו לפתוח בדיקת ניסיון. נסו שוב.';

export default function StartTestSessionControl({ secret }: StartTestSessionControlProps) {
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startTestSession() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);

    try {
      await createAdminTestSession(secret, {
        fetch: window.fetch.bind(window),
        confirm: window.confirm.bind(window),
        storage: window.localStorage,
        replaceLocation: (url) => window.location.replace(url),
      });
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <div className={styles.startTestControl}>
      <button
        type="button"
        className={styles.startTestButton}
        disabled={busy}
        onClick={() => void startTestSession()}
      >
        {busy ? 'פותחים בדיקה…' : 'התחלת בדיקת ניסיון'}
      </button>
      {error && (
        <p className={styles.controlError} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
