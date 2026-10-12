"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { AskAiChat } from "@/components/ask-ai-chat";
import { LiquidButton, LiquidLink } from "@/components/ui/liquid-link";
import type { SiteContent } from "@/i18n/dictionaries";
import { WHATSAPP_URL } from "@/lib/whatsapp";
import styles from "./floating-actions.module.css";

// Phones get a full-screen modal sheet; wider screens a drawer beside the page.
const SHEET_QUERY = "(max-width: 39.999rem)";

function showChat(
  dialog: HTMLDialogElement,
  composer: HTMLTextAreaElement | null,
) {
  if (window.matchMedia(SHEET_QUERY).matches) {
    dialog.showModal();
    return;
  }
  // Non-modal, so the page stays readable and scrollable beside the chat.
  dialog.show();
  composer?.focus({ preventScroll: true });
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9.5 3.5c.6 4.4 2.6 6.4 7 7-4.4.6-6.4 2.6-7 7-.6-4.4-2.6-6.4-7-7 4.4-.6 6.4-2.6 7-7Z" />
      <path d="M18 1.5c.3 2 1.2 2.9 3.2 3.2-2 .3-2.9 1.2-3.2 3.2-.3-2-1.2-2.9-3.2-3.2 2-.3 2.9-1.2 3.2-3.2Z" />
    </svg>
  );
}

function Portrait() {
  return (
    <Image
      src="/images/mor-avatar-cutout.webp"
      alt=""
      width={600}
      height={600}
      sizes="72px"
    />
  );
}

// Corner stack on every public page: moriz.ai (opens the chat drawer) above WhatsApp.
export function FloatingActions({
  content,
  ask,
  compactOnMobile = false,
}: {
  content: SiteContent["floatingActions"];
  ask: SiteContent["askAi"];
  compactOnMobile?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0);
  const dialogId = useId();
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  function openChat() {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    showChat(dialog, composerRef.current);
    setOpen(true);
    setOpenCount((count) => count + 1);
  }

  function closeChat() {
    dialogRef.current?.close();
  }

  // Crossing the breakpoint while open reopens in the other mode.
  useEffect(() => {
    const sheet = window.matchMedia(SHEET_QUERY);
    function switchMode() {
      const dialog = dialogRef.current;
      if (!dialog?.open) return;
      dialog.close();
      showChat(dialog, composerRef.current);
    }
    sheet.addEventListener("change", switchMode);
    return () => sheet.removeEventListener("change", switchMode);
  }, []);

  // A non-modal dialog has no built-in Escape, so the page handles it.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      dialogRef.current?.close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function onDialogClose() {
    // A breakpoint switch closes and reopens; it fires close after the reopen.
    if (dialogRef.current?.open) return;
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  }

  return (
    <>
      {/* Stays mounted while closed so the conversation is there on reopen. */}
      <dialog
        ref={dialogRef}
        id={dialogId}
        className={styles.drawer}
        aria-labelledby={titleId}
        onClose={onDialogClose}
      >
        <AskAiChat
          content={ask}
          whatsappUrl={WHATSAPP_URL}
          titleId={titleId}
          openCount={openCount}
          composerRef={composerRef}
          onClose={closeChat}
        />
      </dialog>

      <div
        className={`${styles.root}${compactOnMobile ? ` ${styles.compactMobile}` : ""}`}
      >
        <nav aria-label={content.label} className={styles.stack}>
          <LiquidButton
            ref={triggerRef}
            className={`${styles.action} ${styles.ai} floating-action`}
            glyph={<SparkleIcon />}
            aria-label={content.aiLabel}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={dialogId}
            onClick={() => (open ? closeChat() : openChat())}
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
              icon={<Portrait />}
            >
              {content.whatsapp}
            </LiquidLink>
          )}
        </nav>
      </div>
    </>
  );
}
