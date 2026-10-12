import styles from './HomeLink.module.css';

const MORIZ_HOME_URL = 'https://moriz.studio/';

export default function HomeLink() {
  return (
    <nav className={styles.navigation} aria-label="ניווט לאתר הראשי">
      <a className={styles.link} href={MORIZ_HOME_URL}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14m-7-7 7 7-7 7" />
        </svg>
        <span>חזרה לעמוד הבית</span>
      </a>
    </nav>
  );
}
