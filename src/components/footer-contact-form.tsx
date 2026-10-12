"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import type { SiteContent } from "@/i18n/dictionaries";
import styles from "./footer-contact-form.module.css";

type Field = "name" | "phone" | "email" | "message";
type Control = HTMLInputElement | HTMLTextAreaElement;
type Errors = Partial<Record<Field, string>>;
const fields = ["name", "phone", "email", "message"] as const;
const subscribe = () => () => {};

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

  function errorFor(field: Field, control: Control) {
    if (field !== "phone" && !control.value.trim())
      return content.errors[field];
    if (field === "email" && control.validity.typeMismatch)
      return content.errors.email;
    return undefined;
  }

  function validate(control: Control) {
    const field = control.name as Field;
    setErrors((previous) => ({
      ...previous,
      [field]: errorFor(field, control),
    }));
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
        let firstInvalid: Control | undefined;
        for (const field of fields) {
          const control = event.currentTarget.elements.namedItem(
            field,
          ) as Control;
          const error = errorFor(field, control);
          if (error) {
            next[field] = error;
            firstInvalid ??= control;
          }
        }
        setErrors(next);
        if (firstInvalid) firstInvalid.focus();
        else setChecked(true);
      }}
    >
      {/* Disabled until hydration: no browser fallback can submit visitor details. */}
      <fieldset className={styles.fields} disabled={!hydrated}>
        {fields.map((field) => {
          const id = `contact-${field}`;
          const error = errors[field];
          const props = {
            id,
            name: field,
            className: styles.control,
            required: field !== "phone",
            "aria-invalid": error ? (true as const) : undefined,
            "aria-describedby": error ? `${id}-error` : undefined,
            onBlur: (event: React.FocusEvent<Control>) =>
              validate(event.currentTarget),
            onChange: (event: React.ChangeEvent<Control>) => {
              setChecked(false);
              if (errors[field]) validate(event.currentTarget);
            },
          };
          return (
            <div
              key={field}
              className={`${styles.field} ${field === "name" || field === "phone" ? "" : styles.full}`}
            >
              <label htmlFor={id} className={styles.label}>
                {content.fields[field]}
              </label>
              {field === "message" ? (
                <textarea {...props} rows={3} dir="auto" />
              ) : (
                <input
                  {...props}
                  type={
                    field === "name"
                      ? "text"
                      : field === "phone"
                        ? "tel"
                        : "email"
                  }
                  autoComplete={field === "phone" ? "tel" : field}
                  dir={field === "name" ? "auto" : "ltr"}
                  spellCheck={field === "name"}
                />
              )}
              {error && (
                <p id={`${id}-error`} className={styles.error}>
                  {error}
                </p>
              )}
            </div>
          );
        })}
        <div className={`${styles.actions} ${styles.full}`}>
          <Button
            type="submit"
            variant="outline"
            size="md"
            className={styles.submit}
          >
            {content.submit}
          </Button>
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
