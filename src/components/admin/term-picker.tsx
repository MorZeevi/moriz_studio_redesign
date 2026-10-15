"use client";
import { useState, useTransition } from "react";
import { createTerm } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import type { ManagedKind, Term } from "@/types/project";
import styles from "./admin.module.css";

export const termLabels: Record<
  ManagedKind,
  {
    heading: string;
    singular: string;
    add: string;
    create: string;
    button: string;
  }
> = {
  category: {
    heading: "קטגוריות",
    singular: "קטגוריה",
    add: "הוספת קטגוריה לפרויקט",
    create: "יצירת קטגוריה משותפת חדשה",
    button: "יצירת קטגוריה",
  },
  type: {
    heading: "סוג פרויקט",
    singular: "סוג פרויקט",
    add: "סוג פרויקט",
    create: "יצירת סוג פרויקט חדש",
    button: "יצירת סוג",
  },
};
/**
 * Picks managed terms for a project. Categories are multi-select
 * chips; the project type is a single select. New terms can be created inline
 * and are shared with every project.
 */
export function TermPicker({
  kind,
  terms,
  selected,
  onChange,
  onCreated,
}: {
  kind: ManagedKind;
  terms: Term[];
  selected: string[];
  onChange: (ids: string[]) => void;
  onCreated: (term: Term) => void;
}) {
  const labels = termLabels[kind];
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const single = kind === "type";
  const chosen = terms.filter((t) => selected.includes(t.id));
  return (
    <div>
      {single ? (
        <label className={styles.field}>
          <span>{labels.add}</span>
          <select
            value={selected[0] ?? ""}
            onChange={(e) => onChange(e.target.value ? [e.target.value] : [])}
          >
            <option value="">ללא</option>
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.name_en ? ` / ${t.name_en}` : ""}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <>
          <div className={styles.tags}>
            {chosen.map((term) => (
              <span key={term.id} className={styles.tag}>
                {term.name}
                <button
                  type="button"
                  aria-label={`הסרת ${labels.singular} ${term.name}`}
                  onClick={() =>
                    onChange(selected.filter((id) => id !== term.id))
                  }
                >
                  הסרה
                </button>
              </span>
            ))}
          </div>
          <label className={styles.field}>
            <span>{labels.add}</span>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) onChange([...selected, e.target.value]);
              }}
            >
              <option value="">בחרו {labels.singular}</option>
              {terms
                .filter((t) => !selected.includes(t.id))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.name_en ? ` / ${t.name_en}` : ""}
                  </option>
                ))}
            </select>
          </label>
        </>
      )}
      <div className={styles.inline}>
        <label className={styles.field}>
          <span>{labels.create}</span>
          <input
            dir="rtl"
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span>{labels.create} (English)</span>
          <input
            dir="ltr"
            maxLength={100}
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
          />
        </label>
        <Button
          variant="outline"
          disabled={!name.trim() || pending}
          onClick={() => {
            setError("");
            start(async () => {
              try {
                const result = await createTerm(kind, name, nameEn);
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                onCreated(result.data);
                onChange(
                  single ? [result.data.id] : [...selected, result.data.id],
                );
                setName("");
                setNameEn("");
              } catch {
                setError("לא ניתן ליצור כרגע. נסו שוב.");
              }
            });
          }}
        >
          {labels.button}
        </Button>
      </div>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
