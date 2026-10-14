"use client";

import Image from "next/image";
import { type CSSProperties, useId, useSyncExternalStore } from "react";
import { LiquidFilter, LiquidLink } from "@/components/ui/liquid-link";
import { SparkleIcon } from "@/components/ui/sparkle-icon";
import type { SiteContent } from "@/i18n/dictionaries";
import { AI_CHAT_DIALOG_ID, openAiChat } from "@/lib/chat-launcher";
import { WHATSAPP_URL } from "@/lib/whatsapp";
import styles from "./faq.module.css";

const subscribeNothing = () => () => {};

export function Faq({ content }: { content: SiteContent["faq"] }) {
  const id = useId().replace(/:/g, "");
  const filterId = `faq-liquid-${id}`;
  const hydrated = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

  return (
    <div className={styles.layout} data-enhanced={hydrated ? "" : undefined}>
      <h2 id="faq-heading" className={styles.heading}>
        {content.heading}
      </h2>

      <div className={styles.questions}>
        <LiquidFilter id={filterId} blur={5} />
        {content.questions.map((question) => (
          <details
            key={question}
            name={`faq-${id}`}
            className={`faq-item ${styles.item}`}
            style={{ "--faq-filter": `url("#${filterId}")` } as CSSProperties}
          >
            <summary className={styles.summary}>
              <span className={styles.shape} aria-hidden="true">
                <span className={styles.bodyShape} />
                <span className={styles.controlShape} />
                <span className={styles.bridge} />
              </span>
              <span className={styles.question}>{question}</span>
              <span className={styles.control} aria-hidden="true">
                <svg
                  className={styles.plus}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  focusable="false"
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
            </summary>
            <div className={styles.answer}>
              <p>{content.answerPlaceholder}</p>
            </div>
          </details>
        ))}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.action} ${styles.ai}`}
          aria-haspopup="dialog"
          aria-controls={AI_CHAT_DIALOG_ID}
          disabled={!hydrated}
          onClick={(event) => openAiChat(event.currentTarget)}
        >
          <svg
            className={styles.aiSurface}
            viewBox="0 0 280 48"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M16 1H177C188 1 188 13 200 13S212 1 223 1H264Q279 1 279 16V32Q279 47 264 47H223C212 47 212 35 200 35S188 47 177 47H16Q1 47 1 32V16Q1 1 16 1Z" />
          </svg>
          <span data-liquid-icon aria-hidden="true">
            <SparkleIcon />
          </span>
          <span data-liquid-label>
            <span>
              {content.aiLabel}
              <bdi>{content.aiName}</bdi>
            </span>
          </span>
        </button>
        {WHATSAPP_URL && (
          <LiquidLink
            className={`${styles.action} ${styles.whatsapp}`}
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            icon={
              <Image
                src="/images/mor-avatar-cutout.webp"
                alt=""
                width={600}
                height={600}
                sizes="88px"
              />
            }
          >
            {content.whatsappLabel}
          </LiquidLink>
        )}
      </div>
    </div>
  );
}
