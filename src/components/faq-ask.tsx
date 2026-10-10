"use client";

import { type FormEvent, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import type { AiAnswer } from "@/lib/ai/kimi";
import { MAX_QUESTION_LENGTH } from "@/lib/ai/question";
import styles from "./faq-ask.module.css";

type Labels = {
  heading: string;
  label: string;
  placeholder: string;
  submit: string;
  loading: string;
  fallback: string;
  whatsapp: string;
  error: string;
};

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; result: AiAnswer }
  | { kind: "error" };

// One question, one answer: each submit replaces the previous result.
export function FaqAsk({
  content,
  whatsappUrl,
}: {
  content: Labels;
  whatsappUrl: string | null;
}) {
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const inputId = useId();
  const loading = status.kind === "loading";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    setStatus({ kind: "loading" });
    try {
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setStatus({ kind: "done", result: (await response.json()) as AiAnswer });
    } catch {
      setStatus({ kind: "error" });
    }
  }

  return (
    <div className={styles.root}>
      <h3 className={styles.heading}>{content.heading}</h3>
      <form className={styles.form} onSubmit={submit} aria-busy={loading}>
        <label htmlFor={inputId} className="sr-only">
          {content.label}
        </label>
        <input
          id={inputId}
          className={styles.input}
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={content.placeholder}
          maxLength={MAX_QUESTION_LENGTH}
          autoComplete="off"
          required
        />
        <Button
          type="submit"
          variant="primary"
          disabled={loading || !question.trim()}
        >
          {loading ? content.loading : content.submit}
        </Button>
      </form>

      <div className={styles.result} aria-live="polite">
        {status.kind === "done" && status.result.hasAnswer && (
          <p className={styles.answer}>{status.result.answer}</p>
        )}
        {status.kind === "done" && !status.result.hasAnswer && (
          <>
            {/* Fixed copy keeps the voice consistent with the CTA below it. */}
            <p className={styles.answer}>{content.fallback}</p>
            {whatsappUrl && (
              <a
                className="button button--outline button--md"
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {content.whatsapp}
              </a>
            )}
          </>
        )}
        {status.kind === "error" && (
          <p className={styles.error}>{content.error}</p>
        )}
      </div>
    </div>
  );
}
