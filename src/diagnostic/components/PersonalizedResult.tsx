import type { PersonalizedDiagnosticCopy } from '@/diagnostic/ai/types';
import styles from './PersonalizedResult.module.css';

interface PersonalizedResultProps {
  copy: PersonalizedDiagnosticCopy | null;
}

// ponytail: disposable presentational block — no fetch, no analytics.
// P5f: rendered INSIDE the deterministic result flow, between "why this
// fits you" and "what to include". No title/summary/include-list/next-step/
// CTA of its own — those belong to DiagnosticResult.
// P7a: parent mounts this only while AI is pending or has produced copy, so
// null here always means "still loading" (never "tried and got nothing").
// The `key` swap remounts the inner node on loading->done to replay the fade.
export default function PersonalizedResult({ copy }: PersonalizedResultProps) {
  return (
    <section className={styles.personalized} aria-live="polite">
      {copy ? (
        <div key="done" className={styles.fadeIn}>
          <h2>התאמה אישית לפי מה שסיפרת</h2>
          <p className={styles.summary}>{copy.insightHe}</p>
          <p>{copy.contextFitHe}</p>
        </div>
      ) : (
        <div key="loading" className={`${styles.loading} ${styles.fadeIn}`}>
          <div className={styles.loadingDots} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <h2 className={styles.loadingTitle}>מחדדים את ההמלצה לעסק שלך</h2>
          <div className={styles.statusLines}>
            <span className={styles.statusLine}>עוברים על מה שסיפרת לנו</span>
            <span className={styles.statusLine}>מתאימים את הכיוון לעסק שלך</span>
            <span className={styles.statusLine}>מנסחים המלצה אישית וברורה</span>
          </div>
        </div>
      )}
    </section>
  );
}
