"use client";

import type { SiteContent } from "@/i18n/dictionaries";
import { useTheme } from "./theme-provider";
import styles from "./theme-toggle.module.css";

export function ThemeToggle({ labels }: { labels: SiteContent["theme"] }) {
  const { resolvedTheme, toggle } = useTheme();
  const action =
    resolvedTheme === "dark" ? labels.switchToLight : labels.switchToDark;

  return (
    <div className={styles.controls} data-theme-controls>
      <button
        type="button"
        className={`theme-toggle ${styles.toggle}`}
        data-theme-toggle
        aria-label={action}
        title={action}
        aria-pressed={resolvedTheme === "dark"}
        onClick={toggle}
      >
        <svg
          className="theme-toggle__moon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z" />
        </svg>
        <svg
          className="theme-toggle__sun"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
        </svg>
      </button>
    </div>
  );
}
