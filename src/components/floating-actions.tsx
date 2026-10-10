"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { AskAiForm } from "@/components/ask-ai-form";
import { LiquidButton, LiquidLink } from "@/components/ui/liquid-link";
import type { SiteContent } from "@/i18n/dictionaries";
import { WHATSAPP_URL } from "@/lib/whatsapp";
import styles from "./floating-actions.module.css";

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9.5 3.5c.6 4.4 2.6 6.4 7 7-4.4.6-6.4 2.6-7 7-.6-4.4-2.6-6.4-7-7 4.4-.6 6.4-2.6 7-7Z" />
      <path d="M18 1.5c.3 2 1.2 2.9 3.2 3.2-2 .3-2.9 1.2-3.2 3.2-.3-2-1.2-2.9-3.2-3.2 2-.3 2.9-1.2 3.2-3.2Z" />
    </svg>
  );
}

// Corner stack on every public page: AI (opens a one-question panel) above WhatsApp.
export function FloatingActions({
  content,
  ask,
}: {
  content: SiteContent["floatingActions"];
  ask: SiteContent["askAi"];
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const headingId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div className={styles.root}>
      {/* Stays mounted while closed so the last answer is there on reopen. */}
      <div
        id={panelId}
        role="dialog"
        aria-labelledby={headingId}
        className={styles.panel}
        hidden={!open}
      >
        <div className={styles.panelHeader}>
          <h2 id={headingId} className={styles.heading}>
            {ask.heading}
          </h2>
          <button
            type="button"
            className={styles.close}
            onClick={close}
            aria-label={ask.close}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        <AskAiForm
          content={ask}
          whatsappUrl={WHATSAPP_URL}
          inputRef={inputRef}
        />
      </div>

      <nav aria-label={content.label} className={styles.stack}>
        <LiquidButton
          ref={triggerRef}
          className={`${styles.action} ${styles.ai} floating-action`}
          glyph={<SparkleIcon />}
          aria-label={content.aiLabel}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          {content.ai}
        </LiquidButton>
        {WHATSAPP_URL && (
          <LiquidLink
            className={`${styles.action} floating-action floating-whatsapp`}
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={content.whatsapp}
            icon={
              <Image
                src="/images/mor-avatar-cutout.webp"
                alt=""
                width={600}
                height={600}
                sizes="72px"
              />
            }
          >
            {content.whatsapp}
          </LiquidLink>
        )}
      </nav>
    </div>
  );
}
