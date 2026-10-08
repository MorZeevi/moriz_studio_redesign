"use client";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import styles from "./admin.module.css";
export function ServiceTags({
  values,
  suggestions,
  onChange,
}: {
  values: string[];
  suggestions: string[];
  onChange: (values: string[]) => void;
}) {
  const [value, setValue] = useState("");
  const id = useId();
  function add() {
    const next = value.trim();
    if (next && !values.some((s) => s.toLowerCase() === next.toLowerCase()))
      onChange([...values, next]);
    setValue("");
  }
  return (
    <div>
      <div className={styles.tags}>
        {values.map((service) => (
          <span className={styles.tag} key={service}>
            {service}
            <button
              type="button"
              aria-label={`הסרת שירות ${service}`}
              onClick={() => onChange(values.filter((v) => v !== service))}
            >
              הסרה
            </button>
          </span>
        ))}
      </div>
      <div className={styles.inline}>
        <label className={styles.field}>
          <span>שירות נוסף</span>
          <input
            list={id}
            dir="auto"
            value={value}
            maxLength={100}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
        </label>
        <datalist id={id}>
          {suggestions
            .filter((s) => !values.includes(s))
            .map((s) => (
              <option key={s} value={s} />
            ))}
        </datalist>
        <Button variant="outline" onClick={add} disabled={!value.trim()}>
          הוספת שירות
        </Button>
      </div>
    </div>
  );
}
