import type { DiagnosticResult as DiagnosticResultData, LeadTier } from '@/diagnostic-core/types';
import type { PersonalizedDiagnosticCopy } from '@/diagnostic/ai/types';
import PersonalizedResult from './PersonalizedResult';
import styles from './DiagnosticResult.module.css';

interface DiagnosticResultProps {
  result: DiagnosticResultData;
  personalization?: PersonalizedDiagnosticCopy | null;
  aiPending?: boolean;
  onContactClick?: () => void;
}

const LEAD_TIER_LABELS: Record<LeadTier, string> = {
  A: 'התאמה גבוהה',
  B: 'התאמה בינונית',
  C: 'התאמה ראשונית',
};

export default function DiagnosticResult({
  result,
  personalization,
  aiPending = false,
  onContactClick,
}: DiagnosticResultProps) {
  const { resultTemplate } = result;
  // ponytail: settled-empty (AI done, nothing came back) unmounts the slot;
  // only pending-or-succeeded keeps it — distinguishes "still loading" from
  // "tried and got nothing" using aiPending, since both look like personalization === null.
  const showAiSlot = aiPending || Boolean(personalization);

  return (
    <div className={styles.result}>
      <span className={styles.tierBadge}>{LEAD_TIER_LABELS[result.leadTier]}</span>
      <h1>{resultTemplate.titleHe}</h1>
      <p className={styles.description}>{resultTemplate.shortDescriptionHe}</p>

      <section>
        <h2>למה זה מתאים לך</h2>
        <p>{resultTemplate.whyHe}</p>
      </section>

      {showAiSlot && <PersonalizedResult copy={personalization ?? null} />}

      {personalization && onContactClick && (
        <div className={`${styles.ctaArea} ${styles.personalizedCtaArea}`}>
          <button type="button" className={styles.cta} onClick={onContactClick}>
            רוצה שנעבור על האבחון יחד?
          </button>
        </div>
      )}

      {resultTemplate.whatToIncludeHe.length > 0 && (
        <section>
          <h2>מה כדאי לכלול</h2>
          <ul>
            {resultTemplate.whatToIncludeHe.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {resultTemplate.whatNotToBuildNowHe.length > 0 && (
        <section>
          <h2>מה לא לבנות עכשיו</h2>
          <ul>
            {resultTemplate.whatNotToBuildNowHe.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.nextStep}>
        <h2>הצעד הבא</h2>
        <p>{result.recommendedNextStep}</p>
      </section>

      {result.secondarySolution && (
        <p className={styles.secondary}>יכול להיות שגם כיוון נוסף רלוונטי עבורך.</p>
      )}

      {onContactClick && (
        <div className={styles.ctaArea}>
          <button type="button" className={styles.cta} onClick={onContactClick}>
            רוצה שנעבור על האבחון יחד?
          </button>
        </div>
      )}
    </div>
  );
}
