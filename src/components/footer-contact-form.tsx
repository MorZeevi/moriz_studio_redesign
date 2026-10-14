"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { CheckIcon, WhatsappIcon } from "@/components/contact-icons";
import { LiquidButton } from "@/components/ui/liquid-link";
import type { SiteContent } from "@/i18n/dictionaries";
import styles from "./footer-contact-form.module.css";

type Field = "name" | "phone";
type Errors = Partial<Record<Field, string>>;
type Variant = "idle" | "named" | "whatsapp" | "whatsappIdle";
const required = ["name", "phone"] as const;
const subscribe = () => () => {};

// The first word only, kept short enough to fit on the button.
const firstNameOf = (value: string) =>
  value.trim().split(/\s+/)[0]?.slice(0, 18) ?? "";

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
  const [checked, setChecked] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [whatsapp, setWhatsapp] = useState(false);
  const [sent, setSent] = useState(0);

  // The button holds its "sent" check for a moment, then answers back again.
  useEffect(() => {
    if (!sent) return;
    const timer = window.setTimeout(() => setSent(0), 1600);
    return () => window.clearTimeout(timer);
  }, [sent]);

  function validate(control: HTMLInputElement) {
    const field = control.name as Field;
    const error = errorFor(field, control.value);
    setErrors((previous) => ({
      ...previous,
      [field]: error && content.errors[error],
    }));
  }

  const variant: Variant = whatsapp
    ? firstName
      ? "whatsapp"
      : "whatsappIdle"
    : firstName
      ? "named"
      : "idle";
  // `{name}` splits the label; labels without it have a single part.
  const [before, after] = content.submit[variant].split("{name}");

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
        setChecked(false);
        if (field === "name")
          setFirstName(firstNameOf(event.currentTarget.value));
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
      aria-describedby="contact-preview"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setChecked(false);
        const next: Errors = {};
        let firstInvalid: HTMLInputElement | undefined;
        for (const field of required) {
          const control = event.currentTarget.elements.namedItem(
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
        setChecked(true);
        setSent((count) => count + 1);
      }}
    >
      {/* Disabled until hydration: no browser fallback can submit visitor details. */}
      <fieldset className={styles.fields} disabled={!hydrated}>
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

        <label className={`${styles.check} ${styles.full}`}>
          <input
            type="checkbox"
            name="whatsapp"
            className={styles.box}
            checked={whatsapp}
            onChange={(event) => {
              setChecked(false);
              setWhatsapp(event.currentTarget.checked);
            }}
          />
          <CheckIcon className={styles.tick} />
          <span>{content.fields.whatsapp}</span>
        </label>

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
            placeholder={content.fields.messagePlaceholder}
            onChange={() => setChecked(false)}
          />
        </div>

        <div className={`${styles.actions} ${styles.full}`}>
          {/* The site's liquid CTA; the blob shows the arrow, the WhatsApp
              mark when that channel is preferred, and a check once sent. */}
          <LiquidButton
            type="submit"
            className={styles.submit}
            data-variant={variant}
            data-sent={sent ? "" : undefined}
            glyph={
              sent ? (
                <CheckIcon key="sent" className={styles.iconSwap} />
              ) : whatsapp ? (
                <WhatsappIcon key="whatsapp" className={styles.iconSwap} />
              ) : undefined
            }
          >
            <span key={variant} className={styles.submitLabel}>
              {before}
              {after !== undefined && (
                <>
                  <bdi>{firstName}</bdi>
                  {after}
                </>
              )}
            </span>
          </LiquidButton>
          <p id="contact-preview" className={styles.note}>
            {content.preview}
          </p>
        </div>
      </fieldset>
      <p role="status" className={styles.status}>
        {checked ? content.previewChecked : ""}
      </p>
    </form>
  );
}
