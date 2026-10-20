"use client";

import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { warmPartyAssets } from "./media";
import styles from "./party-mode.module.css";
import { usePartyMode } from "./party-mode-provider";

// Visitors read the switch as an illustration, so the first time it comes
// into view a pointer demonstrates the tap; the hint stays until first use.
type Cue = "idle" | "play" | "done";
const cueDelay = 600;

export function PartyModeToggle() {
  const promptId = useId();
  const { enabled, phase, labels, toggleRef, setEnabled, setInlineVisible } =
    usePartyMode();
  const [cue, setCue] = useState<Cue>("idle");

  useEffect(() => {
    if (enabled) setCue("done");
  }, [enabled]);

  useEffect(() => {
    const toggle = toggleRef.current;
    if (!toggle) return;
    let release: (() => void) | undefined;
    let cueTimer: ReturnType<typeof setTimeout> | undefined;
    const visibility = new IntersectionObserver(([entry]) => {
      setInlineVisible(entry.isIntersecting);
      if (entry.isIntersecting && !cueTimer) {
        cueTimer = setTimeout(
          () => setCue((current) => (current === "idle" ? "play" : current)),
          cueDelay,
        );
      }
    });
    const preload = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        release = warmPartyAssets();
        preload.disconnect();
      },
      { rootMargin: "500px" },
    );
    visibility.observe(toggle);
    preload.observe(toggle);
    return () => {
      clearTimeout(cueTimer);
      visibility.disconnect();
      preload.disconnect();
      release?.();
    };
  }, [toggleRef, setInlineVisible]);

  return (
    <div
      className={styles.controlSlot}
      data-party-state={phase}
      data-cue={cue}
      dir="ltr"
    >
      <span id={promptId} className={styles.prompt} lang="en" dir="ltr">
        {labels.prompt}
      </span>
      <span className={styles.toggleWrap}>
        <span className={styles.hint} aria-hidden="true">
          try me!
          <svg
            className={styles.hintArrow}
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M29 3C19 5 11 12 8 27M8 27 3.5 20.5M8 27l6.5-3.5"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <Button
          ref={toggleRef}
          variant="outline"
          size="md"
          role="switch"
          aria-label={labels.label}
          aria-describedby={promptId}
          aria-checked={enabled}
          className={styles.toggle}
          data-party-toggle
          data-enabled={enabled}
          onClick={() => setEnabled(!enabled)}
          dir="ltr"
        >
          <span className={styles.selection} aria-hidden="true" />
          <span className={styles.toggleLabel} lang="en">
            {labels.no}
          </span>
          <span className={styles.toggleLabel} lang="en">
            <span className={styles.partyDot} aria-hidden="true" />
            {labels.yes}
          </span>
        </Button>
        <svg
          className={styles.cursor}
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M11.483 21.079C11.301 21.016 11.164 20.919 11.064 20.781C11.016 20.716 10.666 19.982 10.285 19.150C9.390 17.195 9.366 17.147 9.164 16.953C8.770 16.575 8.218 16.487 7.734 16.725C7.558 16.811 7.464 16.887 7.046 17.279C5.807 18.443 5.577 18.656 5.499 18.713C5.078 19.024 4.457 18.863 4.220 18.381L4.138 18.214L4.138 10.751L4.138 3.288L4.203 3.150C4.300 2.946 4.429 2.814 4.619 2.720C4.769 2.646 4.809 2.638 5.002 2.638C5.200 2.638 5.231 2.645 5.384 2.725C5.494 2.783 5.959 3.153 6.769 3.827C8.137 4.966 12.300 8.420 15.287 10.896C16.374 11.796 17.305 12.573 17.358 12.623C17.410 12.672 17.489 12.785 17.533 12.875C17.604 13.019 17.612 13.060 17.612 13.250C17.612 13.441 17.604 13.481 17.530 13.631C17.448 13.798 17.314 13.939 17.163 14.019C16.979 14.115 16.863 14.124 15.912 14.125C14.827 14.125 14.636 14.142 14.380 14.263C14.051 14.418 13.776 14.751 13.699 15.089C13.661 15.256 13.666 15.585 13.708 15.738C13.726 15.806 14.042 16.524 14.409 17.332C14.776 18.140 15.088 18.859 15.103 18.930C15.175 19.266 15.020 19.636 14.731 19.820C14.571 19.922 12.148 21.035 11.977 21.085C11.801 21.137 11.645 21.135 11.483 21.079Z"
            fill="currentColor"
            stroke="var(--site-card, var(--color-light))"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
          <circle cx="18.5" cy="5.5" r="1.6" fill="#fb2c36" />
        </svg>
      </span>
    </div>
  );
}
