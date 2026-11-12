"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { CheckIcon } from "@/components/contact-icons";
import { LiquidButton } from "@/components/ui/liquid-link";
import { PaperPlaneIcon } from "@/components/ui/paper-plane-icon";
import type { SiteContent } from "@/i18n/dictionaries";
import { getAttribution } from "@/diagnostic/attribution";
import { CONTACT_INTERESTS, type ContactInterest } from "@/lib/contact-interests";
import { trackConversion } from "@/lib/conversion";
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

// Small line drawings, one per choice; decorative beside the label.
const icon = (paths: React.ReactNode) => (
  <svg
    className={styles.interestIcon}
    viewBox="0 0 32 32"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="4" y="5" width="24" height="17" rx="2.5" />
    <path d="M12 27h8M16 22v5" />
    {paths}
  </svg>
);
const interestIcons: Record<ContactInterest, React.ReactNode> = {
  website: icon(<path d="M4 10h24M13 14l-2.5 2.5L13 19M19 14l2.5 2.5L19 19" />),
  "web-app": icon(<path d="M9 10h6v8H9zM19 10h4M19 14h4M19 18h4" />),
  "ai-tool": icon(
    <path d="M15 8.5l1.3 3.2 3.2 1.3-3.2 1.3L15 17.5l-1.3-3.2-3.2-1.3 3.2-1.3zM21.5 15v4M19.5 17h4" />,
  ),
  "ux-ui": icon(<path d="M16 9l3 6-3 3-3-3zM16 9v6M9 18h2M21 18h2" />),
  specification: icon(
    <path d="M9 10h4v3H9zM19 15h4v3h-4zM13 11.5h3v5h3" />,
  ),
  diagnosis: icon(
    <path d="M13.5 11.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8M16 18.5v.01" />,
  ),
};

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
  const startedRef = useRef(false);

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
  function question(
    field: Field,
    control: React.ReactNode,
    hint?: string,
  ) {
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
        {hint && !error && <p className={styles.hint}>{hint}</p>}
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
      data-clarity-mask="true"
      data-contact-placement="contact-form"
      aria-labelledby="contact-heading"
      aria-describedby="contact-status"
      aria-busy={submissionState === "sending"}
      noValidate
      onChange={() => {
        if (!startedRef.current) {
          startedRef.current = true;
          trackConversion("contact_form_start");
        }
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
        const website = String(form.get("website") ?? "");
        const attribution = getAttribution();
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
              interests: form.getAll("interests").map(String),
              website,
              source: {
                utmSource: attribution?.utm?.utm_source,
                utmMedium: attribution?.utm?.utm_medium,
                utmCampaign: attribution?.utm?.utm_campaign,
                referrer: attribution?.referrer,
                landingPath: attribution?.landingPath,
                page: window.location.pathname,
              },
            }),
            signal: controller.signal,
          });
          if (!response.ok) throw new Error("contact_send_failed");
          formElement.reset();
          setWhatsapp(!!WHATSAPP_URL);
          setSubmissionState("success");
          // A filled trap field is spam: the server drops it, so it is no lead.
          if (!website) {
            trackConversion("contact_form_success");
            trackConversion("generate_lead", { channel: "form" });
          }
        } catch {
          setSubmissionState("error");
          trackConversion("contact_form_error");
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
        <fieldset className={`${styles.interests} ${styles.full}`}>
          <legend className={styles.label}>
            {content.interests}{" "}
            <span className={styles.optional}>{content.fields.optional}</span>
          </legend>
          <div className={styles.interestGrid}>
            {CONTACT_INTERESTS.map((interest) => (
              <label key={interest.id} className={styles.interest}>
                <input type="checkbox" name="interests" value={interest.id} />
                <span className={styles.interestMark} aria-hidden="true">
                  <CheckIcon />
                </span>
                {interestIcons[interest.id]}
                <span>{interest.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
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
          content.phoneHint,
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
            rows={2}
            dir="auto"
          />
        </div>

        <div className={`${styles.actions} ${styles.full}`}>
          {/* The server sends the message to Mor; this label stays stable. */}
          <LiquidButton
            type="submit"
            className={styles.submit}
            glyph={<PaperPlaneIcon />}
          >
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
