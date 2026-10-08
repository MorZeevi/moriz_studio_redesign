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
      <TextPressure text="moriz.studio" baseWeight={400} boldPrefix="moriz." />
    </Link>
  );
}
import Link from "next/link";
import TextPressure from "@/components/react-bits/TextPressure";
import type { EnabledLocale } from "@/i18n/config";
