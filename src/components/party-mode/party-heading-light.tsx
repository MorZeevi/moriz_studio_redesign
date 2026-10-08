"use client";

import styles from "./party-mode.module.css";
import { usePartyMode } from "./party-mode-provider";

/** Original heading text remains the only accessible/selectable content. */
export function PartyHeadingLight({ text }: { text: string }) {
  const { enabled, phase } = usePartyMode();
  if (!enabled && phase === "idle") return null;
  return (
    <span
      className={styles.headingProjection}
      data-party-projection
      aria-hidden="true"
    >
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={styles.headingLight}
          data-party-heading-light={index}
        >
          {text}
        </span>
      ))}
    </span>
  );
}
