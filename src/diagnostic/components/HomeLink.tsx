import { StudioLogo } from '@/components/studio-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import styles from './HomeLink.module.css';

// The funnel is Hebrew-only, like the enabled site locale; these mirror theme.* in the Hebrew dictionary.
const THEME_LABELS = { switchToDark: 'מעבר למצב כהה', switchToLight: 'מעבר למצב בהיר' };

export default function HomeLink() {
  return (
    <header className={styles.navigation}>
      <StudioLogo name="Moriz Studio" locale="he" />
      <nav className={styles.actions} aria-label="ניווט לאתר הראשי">
        <ThemeToggle labels={THEME_LABELS} />
        <a className={`button button--outline button--sm ${styles.link}`} href="/he">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14m-7-7 7 7-7 7" />
          </svg>
          <span>חזרה לעמוד הבית</span>
        </a>
      </nav>
    </header>
  );
}
