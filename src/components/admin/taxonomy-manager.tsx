"use client";
import Link from "next/link";
import { type ReactNode, useState, useTransition } from "react";
import {
  createTerm,
  deleteTerm,
  reorderTerms,
  updateTerm,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import type { AdminTerm } from "@/lib/cms/queries";
import type { ManagedKind } from "@/types/project";
import { moveItem } from "./sortable-list";
import styles from "./admin.module.css";

const KINDS: Record<
  ManagedKind,
  {
    heading: string;
    singular: string;
    intro: string;
    create: string;
    add: string;
    added: string;
    deleted: string;
  }
> = {
  category: {
    heading: "קטגוריות",
    singular: "קטגוריה",
    intro:
      "קטגוריות משותפות לכל הפרויקטים: מוצגות כתגיות בפרויקט ומשמשות לסינון בעמוד הפרויקטים. שינוי שם שומר את השיוכים.",
    create: "קטגוריה חדשה",
    add: "הוספת קטגוריה",
    added: "הקטגוריה נוספה.",
    deleted: "הקטגוריה נמחקה.",
  },
  type: {
    heading: "סוגי פרויקטים",
    singular: "סוג פרויקט",
    intro:
      "רשימה קבועה: משחק, אתר תדמית, אפליקציית Web, כלי AI ואחר. לכל פרויקט סוג אחד, שנבחר בלשונית פרטי הפרויקט.",
    create: "סוג פרויקט חדש",
    add: "הוספת סוג",
    added: "הסוג נוסף.",
    deleted: "הסוג נמחק.",
  },
};
export function TaxonomyManager({
  kind,
  initial,
}: {
  kind: ManagedKind;
  initial: AdminTerm[];
}) {
  const labels = KINDS[kind];
  const [entries, setEntries] = useState(initial);
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  function run(work: () => Promise<void>) {
    setError("");
    setMessage("");
    start(async () => {
      try {
        await work();
      } catch {
        setError("הפעולה נכשלה. נסו שוב.");
      }
    });
  }
  function move(from: number, to: number) {
    const next = moveItem(entries, from, to);
    run(async () => {
      const result = await reorderTerms(next.map((c) => c.id));
      if (result.ok) {
        setEntries(next);
        setMessage("הסדר נשמר.");
      } else setError(result.error);
    });
  }
  const nav = (
    <nav aria-label="רשימות" className={styles.subnav}>
      {(Object.keys(KINDS) as ManagedKind[]).map((k) => (
        <Link
          key={k}
          href={`/admin/categories?kind=${k}`}
          aria-current={k === kind ? "page" : undefined}
        >
          {KINDS[k].heading}
        </Link>
      ))}
    </nav>
  );
  // Project types are a fixed list (src/lib/cms/project-types.ts).
  if (kind === "type")
    return (
      <main>
        <h1>{labels.heading}</h1>
        {nav}
        <p>{labels.intro}</p>
        <ul className={styles.list}>
          {entries.map((entry) => (
            <li key={entry.id} className={styles.row}>
              <span>
                <strong>{entry.name}</strong>
                {entry.name_en ? ` / ${entry.name_en}` : ""}
              </span>
              <span>{entry.usage} פרויקטים</span>
            </li>
          ))}
        </ul>
      </main>
    );
  return (
    <main>
      <h1>{labels.heading}</h1>
      {nav}
      <p>{labels.intro}</p>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <p role="status" className={styles.status}>
        {pending ? "שומר…" : message}
      </p>
      {entries.map((entry, index) => (
        <TermRow
          key={entry.id}
          entry={entry}
          singular={labels.singular}
          pending={pending}
          onSave={(newName, newNameEn) =>
            run(async () => {
              const result = await updateTerm(entry.id, newName, newNameEn);
              if (result.ok) {
                setEntries((items) =>
                  items.map((c) =>
                    c.id === entry.id
                      ? {
                          ...c,
                          name: newName.trim(),
                          name_en: newNameEn.trim() || null,
                        }
                      : c,
                  ),
                );
                setMessage("השם נשמר.");
              } else setError(result.error);
            })
          }
          onDelete={() => {
            if (
              window.confirm(
                `"${entry.name}" משויך ל־${entry.usage} פרויקטים. המחיקה תסיר את השיוכים בלבד. הפרויקטים יישמרו. למחוק?`,
              )
            )
              run(async () => {
                const result = await deleteTerm(entry.id);
                if (result.ok) {
                  setEntries((items) => items.filter((c) => c.id !== entry.id));
                  setMessage(labels.deleted);
                } else setError(result.error);
              });
          }}
        >
          <Button
            size="sm"
            variant="ghost"
            disabled={pending || index === 0}
            onClick={() => move(index, index - 1)}
            aria-label={`הזזת ${entry.name} למעלה`}
          >
            למעלה
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={pending || index === entries.length - 1}
            onClick={() => move(index, index + 1)}
            aria-label={`הזזת ${entry.name} למטה`}
          >
            למטה
          </Button>
        </TermRow>
      ))}
      <form
        className={styles.inline}
        onSubmit={(event) => {
          event.preventDefault();
          run(async () => {
            const result = await createTerm(kind, name, nameEn);
            if (result.ok) {
              setEntries((items) => [...items, { ...result.data, usage: 0 }]);
              setName("");
              setNameEn("");
              setMessage(labels.added);
            } else setError(result.error);
          });
        }}
      >
        <label className={styles.field}>
          <span>{labels.create}</span>
          <input
            dir="rtl"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
          />
        </label>
        <label className={styles.field}>
          <span>{labels.create} (English)</span>
          <input
            dir="ltr"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            maxLength={100}
          />
        </label>
        <Button type="submit" disabled={pending}>
          {labels.add}
        </Button>
      </form>
    </main>
  );
}
function TermRow({
  entry,
  singular,
  pending,
  onSave,
  onDelete,
  children,
}: {
  entry: AdminTerm;
  singular: string;
  pending: boolean;
  onSave: (name: string, nameEn: string) => void;
  onDelete: () => void;
  children: ReactNode;
}) {
  const [name, setName] = useState(entry.name);
  const [nameEn, setNameEn] = useState(entry.name_en ?? "");
  const unchanged = name === entry.name && nameEn === (entry.name_en ?? "");
  return (
    <div className={styles.row}>
      <form
        className={styles.inline}
        onSubmit={(e) => {
          e.preventDefault();
          onSave(name, nameEn);
        }}
      >
        <label className={styles.field}>
          <span className="sr-only">
            שם {singular}: {entry.name}
          </span>
          <input
            dir="rtl"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            required
          />
        </label>
        <label className={styles.field}>
          <span className="sr-only">שם באנגלית: {entry.name}</span>
          <input
            dir="ltr"
            placeholder="English"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            maxLength={100}
          />
        </label>
        <span>{entry.usage} פרויקטים</span>
        <Button
          size="sm"
          variant="outline"
          type="submit"
          disabled={pending || unchanged}
        >
          שמירת שם
        </Button>
      </form>
      <div className={styles.actions}>
        {children}
        <Button size="sm" variant="ghost" disabled={pending} onClick={onDelete}>
          מחיקה
        </Button>
      </div>
    </div>
  );
}
