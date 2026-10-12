"use client";
import { useId } from "react";
import styles from "./admin.module.css";

/**
 * One text in two languages, side by side: Hebrew (primary, RTL) and English
 * (LTR). Each language is its own value, so editing one never touches the
 * other. The English input is labelled "<label> (English)".
 */
export function LocalizedField({
  label,
  value,
  valueEn,
  onChange,
  onChangeEn,
  multiline = false,
  hint,
  maxLength,
  required = false,
}: {
  label: string;
  value: string | null | undefined;
  valueEn: string | null | undefined;
  onChange: (value: string) => void;
  onChangeEn: (value: string) => void;
  multiline?: boolean;
  hint?: string;
  maxLength?: number;
  required?: boolean;
}) {
  const id = useId();
  const Input = multiline ? "textarea" : "input";
  return (
    <div className={styles.localized}>
      {/* Hints sit outside the label so they never become part of its name. */}
      <div className={styles.field}>
        <label htmlFor={`${id}-he`}>
          <span>{label}</span>
        </label>
        <Input
          id={`${id}-he`}
          dir="rtl"
          lang="he"
          value={value ?? ""}
          maxLength={maxLength}
          required={required}
          aria-describedby={hint ? `${id}-hint` : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
        {hint && <small id={`${id}-hint`}>{hint}</small>}
      </div>
      <div className={styles.field}>
        <label htmlFor={`${id}-en`}>
          <span>{label} (English)</span>
        </label>
        <Input
          id={`${id}-en`}
          dir="ltr"
          lang="en"
          value={valueEn ?? ""}
          maxLength={maxLength}
          onChange={(e) => onChangeEn(e.target.value)}
        />
      </div>
    </div>
  );
}
