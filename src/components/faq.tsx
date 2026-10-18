"use client";

import Image from "next/image";
import { type CSSProperties, useId, useSyncExternalStore } from "react";
import {
  LiquidButton,
  LiquidFilter,
  LiquidLink,
} from "@/components/ui/liquid-link";
import { SparkleIcon } from "@/components/ui/sparkle-icon";
import type { SiteContent } from "@/i18n/dictionaries";
import { AI_CHAT_DIALOG_ID, openAiChat } from "@/lib/chat-launcher";
import { WHATSAPP_URL } from "@/lib/whatsapp";
import styles from "./faq.module.css";

const subscribeNothing = () => () => {};

export function Faq({ content }: { content: SiteContent["faq"] }) {
  const id = useId().replace(/:/g, "");
  const filterId = `faq-liquid-${id}`;
  const outlineId = `faq-ai-outline-${id}`;
  const hydrated = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

  return (
    <div className={styles.layout} data-enhanced={hydrated ? "" : undefined}>
      <div className={styles.intro}>
        <h2 id="faq-heading" className={styles.heading}>
          {content.heading}
        </h2>
        <p className={styles.description}>
          {content.description.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
      </div>

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
        <svg
          width="0"
          height="0"
          className="liquid__filter"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <filter
              id={outlineId}
              x="-10%"
              y="-50%"
              width="120%"
              height="200%"
              colorInterpolationFilters="sRGB"
            >
              <feMorphology
                in="SourceAlpha"
                operator="erode"
                radius="1"
                result="inside"
              />
              <feComposite
                in="SourceAlpha"
                in2="inside"
                operator="out"
                result="outline"
              />
              <feFlood floodColor="var(--color-action-primary)" result="ink" />
              <feComposite
                in="ink"
                in2="outline"
                operator="in"
                result="border"
              />
              <feMerge>
                <feMergeNode in="SourceGraphic" />
                <feMergeNode in="border" />
              </feMerge>
            </filter>
          </defs>
        </svg>
        <LiquidButton
          type="button"
          className={`${styles.action} ${styles.ai}`}
          style={{ "--ai-outline": `url("#${outlineId}")` } as CSSProperties}
          glyph={<SparkleIcon />}
          aria-haspopup="dialog"
          aria-controls={AI_CHAT_DIALOG_ID}
          disabled={!hydrated}
          onClick={(event) => openAiChat(event.currentTarget)}
        >
          <span>
            {content.aiLabel}
            <bdi>{content.aiName}</bdi>
          </span>
        </LiquidButton>
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
