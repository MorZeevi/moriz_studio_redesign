"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { AskAiChat } from "@/components/ask-ai-chat";
import { WhatsappLogoIcon } from "@/components/contact-icons";
import { LiquidLink } from "@/components/ui/liquid-link";
import { SparkleIcon } from "@/components/ui/sparkle-icon";
import type { SiteContent } from "@/i18n/dictionaries";
import {
  AI_CHAT_DIALOG_ID,
  AI_CHAT_OPEN_EVENT,
  type AiChatOpenEvent,
} from "@/lib/chat-launcher";
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
    (opener?.isConnected ? opener : triggerRef.current)?.focus({
      preventScroll: true,
    });
  }

  return (
    <>
      {/* Stays mounted while closed so the conversation is there on reopen. */}
      <dialog
        ref={dialogRef}
        id={AI_CHAT_DIALOG_ID}
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
                  <span className={styles.whatsappPortrait}>
                    <Portrait />
                  </span>
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
