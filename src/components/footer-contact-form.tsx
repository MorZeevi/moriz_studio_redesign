"use client";

import { useState, useSyncExternalStore } from "react";
import { CheckIcon, WhatsappIcon } from "@/components/contact-icons";
import { LiquidButton } from "@/components/ui/liquid-link";
import type { SiteContent } from "@/i18n/dictionaries";
import { WHATSAPP_URL } from "@/lib/whatsapp";
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
  const [firstName, setFirstName] = useState("");
  const [whatsapp, setWhatsapp] = useState(!!WHATSAPP_URL);

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
        const form = new FormData(event.currentTarget);
        const name = String(form.get("name") ?? "").trim();
        const phone = String(form.get("phone") ?? "").trim();
        const message = String(form.get("message") ?? "").trim();
        const body = [
          `שלום מור, שמי ${name}.`,
          `מספר הטלפון שלי: ${phone}.`,
          message ? `רציתי לשאול: ${message}` : "",
        ]
          .filter(Boolean)
          .join("\n");
        const destination =
          whatsapp && WHATSAPP_URL
            ? `${WHATSAPP_URL}?text=${encodeURIComponent(body)}`
            : `mailto:${content.details.email}?subject=${encodeURIComponent("פנייה דרך האתר")}&body=${encodeURIComponent(body)}`;
        window.location.assign(destination);
      }}
    >
      {/* Disabled until hydration; direct contact links remain available below. */}
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
            placeholder={content.fields.messagePlaceholder}
          />
        </div>

        <div className={`${styles.actions} ${styles.full}`}>
          {/* The button opens a prepared message in the selected contact app. */}
          <LiquidButton
            type="submit"
            className={styles.submit}
            data-variant={variant}
            glyph={whatsapp ? <WhatsappIcon className={styles.iconSwap} /> : undefined}
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
      <noscript>
        <p className={styles.note}>{content.noScript}</p>
      </noscript>
    </form>
  );
}
