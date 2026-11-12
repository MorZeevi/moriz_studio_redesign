"use client";

import { conversionCopy } from "@/content/conversion-copy";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { WhatsappGlyphIcon, WhatsappLogoIcon } from "@/components/contact-icons";
import { LiquidLink } from "@/components/ui/liquid-link";
import { SparkleIcon } from "@/components/ui/sparkle-icon";
import type { SiteContent } from "@/i18n/dictionaries";
import {
  AI_CHAT_DIALOG_ID,
  AI_CHAT_OPEN_EVENT,
  type AiChatOpenEvent,
} from "@/lib/chat-launcher";
import { trackConversion } from "@/lib/conversion";
import { WHATSAPP_CONTACT_URL as WHATSAPP_URL } from "@/lib/whatsapp";
import styles from "./floating-actions.module.css";

const AskAiChat = dynamic(() =>
  import("@/components/ask-ai-chat").then((m) => m.AskAiChat),
);

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

// On every public page, in the lower inline-end corner (left in RTL): a
// moriz.ai tab on the screen edge (opens the chat drawer) above WhatsApp.
export function FloatingActions({
  content,
  ask,
  compactOnMobile = false,
  mobileWhatsappOnly = false,
}: {
  content: SiteContent["floatingActions"];
  ask: SiteContent["askAi"];
  compactOnMobile?: boolean;
  mobileWhatsappOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [barHidden, setBarHidden] = useState(true);
  useEffect(() => {
    const sync = () => {
      const active = document.activeElement;
      const editing =
        active instanceof HTMLElement &&
        active.matches("input, textarea, select, [contenteditable=true]");
      const targets = document.querySelectorAll(".hero-actions, #contact");
      const visible = [...targets].some((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
      });
      setBarHidden(editing || visible);
    };
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("resize", sync);
    document.addEventListener("focusin", sync);
    document.addEventListener("focusout", sync);
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("resize", sync);
      document.removeEventListener("focusin", sync);
      document.removeEventListener("focusout", sync);
    };
  }, []);
  const [openCount, setOpenCount] = useState(0);
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const openChat = useCallback((trigger: HTMLElement) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    openerRef.current = trigger;
    if (dialog.open) {
      composerRef.current?.focus({ preventScroll: true });
      return;
    }
    showChat(dialog, composerRef.current);
    trackConversion("chat_open");
    setOpen(true);
    setOpenCount((count) => count + 1);
  }, []);

  useEffect(() => {
    const onOpen = (event: Event) => {
      const trigger = (event as AiChatOpenEvent).detail?.trigger;
      if (trigger instanceof HTMLElement) openChat(trigger);
    };
    window.addEventListener(AI_CHAT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(AI_CHAT_OPEN_EVENT, onOpen);
  }, [openChat]);

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
    const opener = openerRef.current;
    requestAnimationFrame(() =>
      (opener?.isConnected ? opener : triggerRef.current)?.focus({
        preventScroll: true,
      }),
    );
  }

  return (
    <>
      {/* Stays mounted while closed so the conversation is there on reopen. */}
      <dialog
        ref={dialogRef}
        id={AI_CHAT_DIALOG_ID}
        data-clarity-mask="true"
        className={styles.drawer}
        aria-labelledby={titleId}
        onClose={onDialogClose}
      >
        {openCount > 0 && (
          <AskAiChat
            content={ask}
            whatsappUrl={WHATSAPP_URL}
            titleId={titleId}
            openCount={openCount}
            composerRef={composerRef}
            onClose={closeChat}
          />
        )}
      </dialog>

      <nav
        data-mobile-actions=""
        data-contact-placement="mobile-bar"
        className={styles.mobileBar}
        hidden={barHidden || open}
        aria-label={content.label}
      >
        {WHATSAPP_URL && (
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            {conversionCopy.mobileAction}
          </a>
        )}
        <button
          type="button"
          aria-haspopup="dialog"
          aria-controls={AI_CHAT_DIALOG_ID}
          aria-expanded={open}
          onClick={(event) => openChat(event.currentTarget)}
        >
          moriz.ai
        </button>
      </nav>
      <div
        data-contact-placement="floating"
        className={`${styles.root}${compactOnMobile ? ` ${styles.compactMobile}` : ""}${mobileWhatsappOnly ? ` ${styles.mobileWhatsappOnly}` : ""}`}
      >
        <nav aria-label={content.label} className={styles.stack}>
          <button
            ref={triggerRef}
            type="button"
            className={`${styles.aiTab} floating-action`}
            aria-label={content.aiLabel}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={AI_CHAT_DIALOG_ID}
            onClick={(event) =>
              open ? closeChat() : openChat(event.currentTarget)
            }
          >
            <span className={styles.aiTabInner}>
              {content.ai}
              <span className={styles.aiTabIcon}>
                <SparkleIcon />
              </span>
            </span>
          </button>
          {WHATSAPP_URL && (
            <LiquidLink
              className={`${styles.action} floating-action floating-whatsapp`}
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={content.whatsapp}
              icon={
                <>
                  <WhatsappGlyphIcon className={styles.whatsappGlyph} />
                  <WhatsappLogoIcon className={styles.whatsappIcon} />
                </>
              }
            >
              {content.whatsapp}
            </LiquidLink>
          )}
        </nav>
      </div>
    </>
  );
}
