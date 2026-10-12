import Image from 'next/image';
import styles from './DiagnosticLanding.module.css';

interface DiagnosticLandingProps {
  onStart: () => void;
}

export default function DiagnosticLanding({ onStart }: DiagnosticLandingProps) {
  return (
    <div className={styles.landing}>
      <div className={styles.copy}>
        <h1>מה הכלי הדיגיטלי שיכול לעזור לכם?</h1>
        <p>
          ענו על כמה שאלות פשוטות. AI ינתח את הצרכים שלכם ביחד איתי, ונמצא עבורכם פתרון לבעיה.
        </p>
        <p className={styles.reassurance}>ולא, ממש לא אכריח אתכם להשאיר פרטים בסוף.</p>
        <button type="button" className={styles.startButton} onClick={onStart}>
          שנתחיל?
        </button>
      </div>

      <div className={styles.portrait}>
        <Image
          src="/digital-audit/mor-profile.png"
          alt="מור זאבי, מייסדת Moriz Studio"
          width={540}
          height={540}
          className={styles.profileImage}
          sizes="(max-width: 704px) 224px, 256px"
          priority
        />
      </div>
    </div>
  );
}
