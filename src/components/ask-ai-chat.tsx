"use client";

import Image from "next/image";
import {
  type FormEvent,
  type KeyboardEvent,
  type Ref,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { LiquidButton } from "@/components/ui/liquid-link";
import type { SiteContent } from "@/i18n/dictionaries";
import type { AiAnswer } from "@/lib/ai/kimi";
import {
  type ChatTurn,
  MAX_ANSWER_LENGTH,
  MAX_HISTORY_TURNS,
  MAX_QUESTION_LENGTH,
} from "@/lib/ai/question";
import styles from "./ask-ai-chat.module.css";

type Message =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "assistant"; kind: "answer"; text: string }
  | { id: number; role: "assistant"; kind: "fallback" }
  | { id: number; role: "assistant"; kind: "error"; question: string };

// Each word fades in after the one before, capped so long answers don't drag.
const WORD_STAGGER_MS = 28;
const MAX_REVEAL_MS = 1400;

export function MorAvatar({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <span
      className={`${styles.avatar}${className ? ` ${className}` : ""}`}
      style={{ inlineSize: size, blockSize: size }}
      aria-hidden="true"
    >
      <Image
        src="/images/mor-chat-avatar.webp"
        alt=""
        width={400}
        height={400}
        sizes={`${size * 2}px`}
      />
    </span>
  );
}

// Types the hint out each time the drawer opens; whole at once under reduced motion.
function useTypewriter(text: string, runKey: number) {
  const [count, setCount] = useState(text.length);
  useEffect(() => {
    if (runKey === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(text.length);
      return;
    }
    setCount(0);
    let typed = 0;
    let timer = 0;
    function typeNext() {
      typed += 1;
      setCount(typed);
      if (typed < text.length)
        timer = window.setTimeout(typeNext, 40 + Math.random() * 60);
    }
    timer = window.setTimeout(typeNext, 450);
    return () => window.clearTimeout(timer);
  }, [text, runKey]);
  return { shown: text.slice(0, count), done: count >= text.length };
}

// Only answered questions go back as context; the current question never does.
function toHistory(messages: Message[]): ChatTurn[] {
  const turns: ChatTurn[] = [];
  messages.forEach((message, index) => {
    const previous = messages[index - 1];
    if (
      message.role === "assistant" &&
      message.kind === "answer" &&
      message.text.trim() &&
      previous?.role === "user"
    )
      turns.push(
        { role: "user", content: previous.text },
        {
          role: "assistant",
          content: message.text.slice(0, MAX_ANSWER_LENGTH).trim(),
        },
      );
  });
  return turns.slice(-MAX_HISTORY_TURNS);
}

function RevealText({ text, animate }: { text: string; animate: boolean }) {
  if (!animate) return text;
  let word = 0;
  return text.split(/(\s+)/).map((part, index) => {
    if (!part.trim()) return part;
    const delay = Math.min(word++ * WORD_STAGGER_MS, MAX_REVEAL_MS);
    return (
      <span
        // Split positions are stable for a given answer.
        // biome-ignore lint/suspicious/noArrayIndexKey: static split of fixed text
        key={index}
        className={styles.word}
        style={{ animationDelay: `${delay}ms` }}
      >
        {part}
      </span>
    );
  });
}

export function AskAiChat({
  content,
  whatsappUrl,
  titleId,
  openCount,
  composerRef,
  onClose,
}: {
  content: SiteContent["askAi"];
  whatsappUrl: string | null;
  titleId: string;
  /** Bumps on every open, which replays the typing hint. */
  openCount: number;
  composerRef: Ref<HTMLTextAreaElement>;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState("");
  const [freshId, setFreshId] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const nextId = useRef(0);
  const request = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fieldId = useId();
  const hint = useTypewriter(content.typingHint, openCount);

  const askedQuestions = new Set(
    messages.flatMap((message) =>
      message.role === "user" ? message.text : [],
    ),
  );
  const remainingSuggestions = content.suggestions.filter(
    (suggestion) => !askedQuestions.has(suggestion),
  );
  const empty = messages.length === 0;

  // Keeps the newest message in view.
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll whenever the thread changes
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    list.scrollTo({
      top: list.scrollHeight,
      behavior: reduce ? "auto" : "smooth",
    });
  }, [messages, pending]);

  // The word reveal plays once; reopening the drawer shows the answer whole.
  useEffect(() => {
    if (freshId === null) return;
    const timer = window.setTimeout(
      () => setFreshId(null),
      MAX_REVEAL_MS + 800,
    );
    return () => window.clearTimeout(timer);
  }, [freshId]);

  useEffect(() => () => request.current?.abort(), []);

  async function ask(question: string, earlier: Message[]) {
    const userMessage: Message = {
      id: nextId.current++,
      role: "user",
      text: question,
    };
    setMessages([...earlier, userMessage]);
    setPending(true);
    setAnnouncement(content.loading);
    const controller = new AbortController();
    request.current = controller;

    let reply: Message;
    try {
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history: toHistory(earlier) }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(String(response.status));
      const result = (await response.json()) as AiAnswer;
      reply = result.hasAnswer
        ? {
            id: nextId.current++,
            role: "assistant",
            kind: "answer",
            text: result.answer,
          }
        : { id: nextId.current++, role: "assistant", kind: "fallback" };
    } catch {
      // A reset aborts the request; its thread is already gone.
      if (controller.signal.aborted) return;
      reply = {
        id: nextId.current++,
        role: "assistant",
        kind: "error",
        question,
      };
    }
    request.current = null;
    setMessages((current) => [...current, reply]);
    setFreshId(reply.id);
    setPending(false);
    setAnnouncement(
      reply.kind === "answer"
        ? reply.text
        : reply.kind === "fallback"
          ? content.fallback
          : content.error,
    );
  }

  function send(text: string) {
    const question = text.trim().slice(0, MAX_QUESTION_LENGTH);
    if (!question || pending) return;
    setDraft("");
    // Drops the grown height so the empty field is one line again.
    formRef.current
      ?.querySelector("textarea")
      ?.style.removeProperty("block-size");
    void ask(question, messages);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send(draft);
  }

  function onComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    )
      return;
    event.preventDefault();
    formRef.current?.requestSubmit();
  }

  // Grows with the text up to the CSS max height.
  function resize(field: HTMLTextAreaElement) {
    field.style.blockSize = "auto";
    field.style.blockSize = `${field.scrollHeight}px`;
  }

  function retry(errorIndex: number, question: string) {
    if (pending) return;
    void ask(question, messages.slice(0, errorIndex - 1));
  }

  function reset() {
    request.current?.abort();
    request.current = null;
    setMessages([]);
    setPending(false);
    setFreshId(null);
    setAnnouncement("");
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.ring}>
          <MorAvatar size={40} />
        </span>
        <div className={styles.identity}>
          <h2 id={titleId} className={styles.title}>
            {content.title}
          </h2>
        </div>
        {!empty && (
          <button
            type="button"
            className={styles.iconButton}
            onClick={reset}
            aria-label={content.reset}
            title={content.reset}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </button>
        )}
        <button
          type="button"
          className={styles.iconButton}
          onClick={onClose}
          aria-label={content.close}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </header>

      {/* A plain region, not a log: the polite status below announces each answer once. */}
      <section
        ref={listRef}
        className={styles.body}
        aria-label={content.thread}
      >
        {empty ? (
          <div className={styles.welcome}>
            <span className={styles.welcomeRing}>
              <MorAvatar size={84} />
            </span>
            <p className={styles.greeting}>{content.greeting}</p>
            <p className={styles.intro}>{content.intro}</p>
            <ul
              className={styles.suggestionCards}
              aria-label={content.suggestionsLabel}
            >
              {content.suggestions.map((suggestion, index) => (
                <li key={suggestion} style={{ "--i": index } as object}>
                  <LiquidButton
                    className={styles.suggestionCard}
                    glyph={<SparkleIcon />}
                    onClick={() => send(suggestion)}
                  >
                    {suggestion}
                  </LiquidButton>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ol className={styles.messages}>
            {messages.map((message, index) => {
              if (message.role === "user")
                return (
                  <li key={message.id} className={styles.userRow}>
                    <p className={`${styles.bubble} ${styles.userBubble}`}>
                      {message.text}
                    </p>
                  </li>
                );
              return (
                <li key={message.id} className={styles.answerRow}>
                  <MorAvatar size={30} className={styles.answerAvatar} />
                  <div className={`${styles.bubble} ${styles.answerBubble}`}>
                    {message.kind === "answer" && (
                      <p>
                        <RevealText
                          text={message.text}
                          animate={message.id === freshId}
                        />
                      </p>
                    )}
                    {message.kind === "fallback" && (
                      <>
                        <p>{content.fallback}</p>
                        {whatsappUrl && (
                          <a
                            className={styles.whatsapp}
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {content.whatsapp}
                          </a>
                        )}
                      </>
                    )}
                    {message.kind === "error" && (
                      <>
                        <p>{content.error}</p>
                        <button
                          type="button"
                          className={styles.retry}
                          onClick={() => retry(index, message.question)}
                          disabled={pending}
                        >
                          {content.retry}
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
            {pending && (
              <li className={styles.answerRow}>
                <MorAvatar size={30} className={styles.answerAvatar} />
                <div
                  className={`${styles.bubble} ${styles.answerBubble} ${styles.thinking}`}
                >
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                </div>
              </li>
            )}
          </ol>
        )}
      </section>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <div className={styles.footer}>
        {!empty && !pending && remainingSuggestions.length > 0 && (
          <ul
            className={styles.suggestionChips}
            aria-label={content.suggestionsLabel}
          >
            {remainingSuggestions.map((suggestion) => (
              <li key={suggestion}>
                <button
                  type="button"
                  className={styles.suggestionChip}
                  onClick={() => send(suggestion)}
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        )}

        <form
          ref={formRef}
          className={styles.composer}
          onSubmit={submit}
          aria-busy={pending}
        >
          <label htmlFor={fieldId} className="sr-only">
            {content.label}
          </label>
          <div className={styles.field}>
            <textarea
              ref={composerRef}
              id={fieldId}
              className={styles.input}
              rows={1}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                resize(event.target);
              }}
              onKeyDown={onComposerKeyDown}
              maxLength={MAX_QUESTION_LENGTH}
              autoComplete="off"
              data-empty={draft ? undefined : ""}
            />
            {!draft && (
              <span
                className={styles.hint}
                data-typing={hint.done ? undefined : ""}
                aria-hidden="true"
              >
                {hint.shown}
              </span>
            )}
          </div>
          <button
            type="submit"
            className={styles.send}
            disabled={pending || !draft.trim()}
            aria-label={content.send}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9.5 3.5c.6 4.4 2.6 6.4 7 7-4.4.6-6.4 2.6-7 7-.6-4.4-2.6-6.4-7-7 4.4-.6 6.4-2.6 7-7Z" />
      <path d="M18 1.5c.3 2 1.2 2.9 3.2 3.2-2 .3-2.9 1.2-3.2 3.2-.3-2-1.2-2.9-3.2-3.2 2-.3 2.9-1.2 3.2-3.2Z" />
    </svg>
  );
}
