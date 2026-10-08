"use client";
import { useState, useTransition } from "react";
import {
  createCategory,
  deleteCategory,
  renameCategory,
  reorderCategories,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import type { Category } from "@/types/project";
import styles from "./admin.module.css";
type Entry = Category & { usage: number };
export function CategoryManager({ initial }: { initial: Entry[] }) {
  const [entries, setEntries] = useState(initial);
  const [name, setName] = useState("");
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
  function move(index: number, direction: number) {
    const next = [...entries];
    [next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ];
    run(async () => {
      const result = await reorderCategories(next.map((c) => c.id));
      if (result.ok) {
        setEntries(next);
        setMessage("הסדר נשמר.");
      } else setError(result.error);
    });
  }
  return (
    <main>
      <h1>קטגוריות</h1>
      <p>קטגוריות משותפות לכל הפרויקטים. שינוי שם שומר את השיוכים.</p>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <p role="status" className={styles.status}>
        {pending ? "שומר…" : message}
      </p>
      {entries.map((entry, index) => (
        <CategoryRow
          key={entry.id}
          entry={entry}
          pending={pending}
          onSave={(newName) =>
            run(async () => {
              const result = await renameCategory(entry.id, newName);
              if (result.ok) {
                setEntries((items) =>
                  items.map((c) =>
                    c.id === entry.id ? { ...c, name: newName.trim() } : c,
                  ),
                );
                setMessage("השם נשמר.");
              } else setError(result.error);
            })
          }
          onDelete={() => {
            if (
              window.confirm(
                `"${entry.name}" משויכת ל־${entry.usage} פרויקטים. מחיקתה תסיר את השיוכים בלבד. הפרויקטים יישמרו. למחוק?`,
              )
            )
              run(async () => {
                const result = await deleteCategory(entry.id);
                if (result.ok) {
                  setEntries((items) => items.filter((c) => c.id !== entry.id));
                  setMessage("הקטגוריה נמחקה.");
                } else setError(result.error);
              });
          }}
        >
          <Button
            size="sm"
            variant="ghost"
            disabled={pending || index === 0}
            onClick={() => move(index, -1)}
            aria-label={`הזזת ${entry.name} למעלה`}
          >
            למעלה
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={pending || index === entries.length - 1}
            onClick={() => move(index, 1)}
            aria-label={`הזזת ${entry.name} למטה`}
          >
            למטה
          </Button>
        </CategoryRow>
      ))}
      <form
        className={styles.inline}
        onSubmit={(event) => {
          event.preventDefault();
          run(async () => {
            const result = await createCategory(name);
            if (result.ok) {
              setEntries((items) => [...items, { ...result.data, usage: 0 }]);
              setName("");
              setMessage("הקטגוריה נוספה.");
            } else setError(result.error);
          });
        }}
      >
        <label className={styles.field}>
          <span>קטגוריה חדשה</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
          />
        </label>
        <Button type="submit" disabled={pending}>
          הוספת קטגוריה
        </Button>
      </form>
    </main>
  );
}
function CategoryRow({
  entry,
  pending,
  onSave,
  onDelete,
  children,
}: {
  entry: Entry;
  pending: boolean;
  onSave: (name: string) => void;
  onDelete: () => void;
  children: React.ReactNode;
}) {
  const [name, setName] = useState(entry.name);
  return (
    <div className={styles.row}>
      <form
        className={styles.inline}
        onSubmit={(e) => {
          e.preventDefault();
          onSave(name);
        }}
      >
        <label className={styles.field}>
          <span className="sr-only">שם קטגוריה: {entry.name}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            required
          />
        </label>
        <span>{entry.usage} פרויקטים</span>
        <Button
          size="sm"
          variant="outline"
          type="submit"
          disabled={pending || name === entry.name}
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
