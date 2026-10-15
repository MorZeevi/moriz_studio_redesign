"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { CheckIcon } from "@/components/contact-icons";
import { LiquidButton } from "@/components/ui/liquid-link";
import type { SiteContent } from "@/i18n/dictionaries";
import { WHATSAPP_URL } from "@/lib/whatsapp";
import styles from "./footer-contact-form.module.css";

type Field = "name" | "phone";
type Errors = Partial<Record<Field, string>>;
type SubmissionState = "idle" | "sending" | "success" | "error";
const required = ["name", "phone"] as const;
const subscribe = () => () => {};

// Israeli or international: 9 to 15 digits once separators are removed.
const isPhone = (value: string) =>
  /^\d{9,15}$/.test(value.replace(/[\s\-+().]/g, ""));

function errorFor(field: Field, value: string) {
  if (field === "name") return value.trim() ? undefined : "name";
  return isPhone(value) ? undefined : "phone";
}

export function FooterContactForm({
  content,
}: {
  content: SiteContent["contact"];
}) {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [errors, setErrors] = useState<Errors>({});
  const [whatsapp, setWhatsapp] = useState(!!WHATSAPP_URL);
  const [submissionState, setSubmissionState] =
    useState<SubmissionState>("idle");
  const sendingRef = useRef(false);

  function validate(control: HTMLInputElement) {
    const field = control.name as Field;
    const error = errorFor(field, control.value);
    setErrors((previous) => ({
      ...previous,
      [field]: error && content.errors[error],
    }));
  }

  function fieldProps(field: Field) {
    const id = `contact-${field}`;
    const error = errors[field];
    return {
      id,
      name: field,
      className: styles.control,
      required: true,
      "aria-invalid": error ? (true as const) : undefined,
      "aria-describedby": error ? `${id}-error` : undefined,
      onBlur: (event: React.FocusEvent<HTMLInputElement>) =>
        validate(event.currentTarget),
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        if (errors[field]) validate(event.currentTarget);
      },
    };
  }

  // A required question over its field, with any error underneath.
  function question(field: Field, control: React.ReactNode) {
    const error = errors[field];
    return (
      <div className={styles.field}>
        <label htmlFor={`contact-${field}`} className={styles.label}>
          {content.fields[field]}
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        </label>
        {control}
        {error && (
          <p id={`contact-${field}-error`} className={styles.error}>
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      className={styles.form}
      aria-labelledby="contact-heading"
      aria-describedby="contact-status"
      aria-busy={submissionState === "sending"}
      noValidate
      onChange={() => {
        if (submissionState !== "sending") setSubmissionState("idle");
      }}
      onSubmit={async (event) => {
        event.preventDefault();
        if (sendingRef.current) return;
        const formElement = event.currentTarget;
        setSubmissionState("idle");
        const next: Errors = {};
        let firstInvalid: HTMLInputElement | undefined;
        for (const field of required) {
          const control = formElement.elements.namedItem(
            field,
          ) as HTMLInputElement;
          const error = errorFor(field, control.value);
          if (error) {
            next[field] = content.errors[error];
            firstInvalid ??= control;
          }
        }
        setErrors(next);
        if (firstInvalid) {
          firstInvalid.focus();
          return;
        }
        const form = new FormData(formElement);
        const name = String(form.get("name") ?? "").trim();
        const phone = String(form.get("phone") ?? "").trim();
        const message = String(form.get("message") ?? "").trim();
        sendingRef.current = true;
        setSubmissionState("sending");
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 30000);
        try {
          const response = await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              phone,
              message,
              preferWhatsApp: whatsapp,
              website: String(form.get("website") ?? ""),
            }),
            signal: controller.signal,
          });
          if (!response.ok) throw new Error("contact_send_failed");
          formElement.reset();
          setWhatsapp(!!WHATSAPP_URL);
          setSubmissionState("success");
        } catch {
          setSubmissionState("error");
        } finally {
          window.clearTimeout(timeout);
          sendingRef.current = false;
        }
      }}
    >
      {/* Disabled until hydration; direct contact links remain available below. */}
      <fieldset
        className={styles.fields}
        disabled={!hydrated || submissionState === "sending"}
      >
        <input
          className={styles.honeypot}
          type="text"
          name="website"
          tabIndex={-1}
          aria-hidden="true"
          autoComplete="off"
        />
        {question(
          "name",
          <input
            {...fieldProps("name")}
            type="text"
            autoComplete="name"
            dir="auto"
          />,
        )}
        {question(
          "phone",
          <input
            {...fieldProps("phone")}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            spellCheck={false}
          />,
        )}

        {WHATSAPP_URL && (
          <label className={`${styles.check} ${styles.full}`}>
            <input
              type="checkbox"
              name="whatsapp"
              className={styles.box}
              checked={whatsapp}
              onChange={(event) => setWhatsapp(event.currentTarget.checked)}
            />
            <CheckIcon className={styles.tick} />
            <span>{content.fields.whatsapp}</span>
          </label>
        )}

        <div className={`${styles.field} ${styles.full}`}>
          <label htmlFor="contact-message" className={styles.label}>
            {content.fields.message}{" "}
            <span className={styles.optional}>{content.fields.optional}</span>
          </label>
          <textarea
            id="contact-message"
            name="message"
            className={`${styles.control} ${styles.message}`}
            rows={3}
            dir="auto"
          />
        </div>

        <div className={`${styles.actions} ${styles.full}`}>
          {/* The server sends the message to Mor; this label stays stable. */}
          <LiquidButton type="submit" className={styles.submit}>
            {content.submit}
          </LiquidButton>
          <p
            id="contact-status"
            role="status"
            aria-live="polite"
            className={`${styles.note}${submissionState === "error" ? ` ${styles.noteError}` : ""}`}
          >
            {submissionState === "sending"
              ? content.sending
              : submissionState === "success"
                ? content.sent
                : submissionState === "error"
                  ? content.sendError
                  : ""}
          </p>
        </div>
      </fieldset>
      <noscript>
        <p className={styles.note}>{content.noScript}</p>
      </noscript>
    </form>
  );
}
