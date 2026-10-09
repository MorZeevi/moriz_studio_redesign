import Link from "next/link";
import type { EnabledLocale } from "@/i18n/config";
import styles from "./studio-logo.module.css";

export function StudioLogo({
  name,
  locale,
  className,
}: {
  name: string;
  locale: EnabledLocale;
  className?: string;
}) {
  return (
    <Link
      href={`/${locale}#top`}
      dir="ltr"
      title={name}
      aria-label="moriz.studio"
      className={[styles.wordmark, className].filter(Boolean).join(" ")}
    >
      <span>moriz.</span>
      <span className={styles.suffix}>studio</span>
    </Link>
  );
}
