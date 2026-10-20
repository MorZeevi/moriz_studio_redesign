"use client";

import { useRef } from "react";
import { useDesktopEntrance } from "@/lib/use-desktop-entrance";
import type { SiteContent } from "@/i18n/dictionaries";
import styles from "./design-quote.module.css";

export function DesignQuote({
  content,
}: {
  content: SiteContent["designQuote"];
}) {
  const rootRef = useRef<HTMLElement>(null);

  useDesktopEntrance(rootRef);

  return (
    <figure ref={rootRef} lang="en" dir="ltr" className={styles.root}>
      <span className={styles.mark} aria-hidden="true">
        &ldquo;
      </span>
      <blockquote className={styles.quote}>
        <p>{content.text}</p>
      </blockquote>
      {/* Signed by hand, under the quote. */}
      <figcaption className={styles.author}>
        <cite className={styles.signature}>
          {content.author}
          <svg
            className={styles.stroke}
            viewBox="0 0 200 20"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M4 14C40 7 92 4 132 8S184 15 196 6" pathLength={1} />
          </svg>
        </cite>
      </figcaption>
    </figure>
  );
}
