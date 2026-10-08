"use client";

import { useEffect, useId } from "react";
import { Button } from "@/components/ui/button";
import { warmPartyAssets } from "./media";
import styles from "./party-mode.module.css";
import { usePartyMode } from "./party-mode-provider";

export function PartyModeToggle() {
  const promptId = useId();
  const { enabled, phase, labels, toggleRef, setEnabled, setInlineVisible } =
    usePartyMode();

  useEffect(() => {
    const toggle = toggleRef.current;
    if (!toggle) return;
    let release: (() => void) | undefined;
    const visibility = new IntersectionObserver(([entry]) => {
      setInlineVisible(entry.isIntersecting);
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
      visibility.disconnect();
      preload.disconnect();
      release?.();
    };
  }, [toggleRef, setInlineVisible]);

  return (
    <div className={styles.controlSlot} data-party-state={phase} dir="ltr">
      <span id={promptId} className={styles.prompt} lang="en" dir="ltr">
        {labels.prompt}
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
    </div>
  );
}
