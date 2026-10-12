"use client";
import { Button } from "@/components/ui/button";
import { MAX_HIGHLIGHTS } from "@/lib/cms/validation";
import type { Highlight } from "@/types/project";
import { LocalizedField } from "./localized-field";
import { moveItem, SortableList } from "./sortable-list";
import styles from "./admin.module.css";

/**
 * Up to three project facts ("6K+ · community members"). They describe the
 * project's scale, audience or scope; they are not presented as results.
 */
export function HighlightsEditor({
  highlights,
  onChange,
}: {
  highlights: Highlight[];
  onChange: (highlights: Highlight[]) => void;
}) {
  function patch(id: string, change: Partial<Highlight>) {
    onChange(highlights.map((h) => (h.id === id ? { ...h, ...change } : h)));
  }
  return (
    <div>
      <p className={styles.hint}>
        עובדות מעניינות על הפרויקט: היקף, קהל או סקופ. אלה לא בהכרח תוצאות. הערך
        הוא טקסט חופשי, למשל 6K+, 1,000+, 24/7 או 12.
      </p>
      <SortableList
        items={highlights}
        type="highlight"
        itemKey={(h) => h.id}
        label={(_, index) => `היילייט ${index + 1}`}
        onMove={(from, to) => onChange(moveItem(highlights, from, to))}
        render={(h, index, handle) => (
          <fieldset
            className={styles.block}
            aria-label={`היילייט ${index + 1}`}
          >
            <header className={styles.blockHeader}>
              <strong>
                היילייט {index + 1}
                {h.value ? ` · ${h.value}` : ""}
              </strong>
              <div className={styles.actions}>
                {handle}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    onChange(highlights.filter((item) => item.id !== h.id))
                  }
                >
                  הסרת היילייט
                </Button>
              </div>
            </header>
            <label className={styles.field}>
              <span>ערך</span>
              <input
                dir="ltr"
                maxLength={40}
                value={h.value}
                onChange={(e) => patch(h.id, { value: e.target.value })}
              />
            </label>
            <LocalizedField
              label="תווית"
              maxLength={200}
              value={h.label}
              valueEn={h.label_en}
              onChange={(label) => patch(h.id, { label })}
              onChangeEn={(label_en) => patch(h.id, { label_en })}
            />
            <LocalizedField
              label="תיאור קצר"
              multiline
              maxLength={1000}
              value={h.description}
              valueEn={h.description_en}
              onChange={(description) => patch(h.id, { description })}
              onChangeEn={(description_en) => patch(h.id, { description_en })}
            />
          </fieldset>
        )}
      />
      <Button
        variant="outline"
        disabled={highlights.length >= MAX_HIGHLIGHTS}
        onClick={() =>
          onChange([
            ...highlights,
            { id: crypto.randomUUID(), value: "", label: "" },
          ])
        }
      >
        הוספת היילייט ({highlights.length}/{MAX_HIGHLIGHTS})
      </Button>
    </div>
  );
}
/** Picks which highlight a card shows (at most one per card). */
export function HighlightSelect({
  label,
  highlights,
  flag,
  onChange,
}: {
  label: string;
  highlights: Highlight[];
  flag: "on_homepage" | "on_archive";
  onChange: (highlights: Highlight[]) => void;
}) {
  const selected = highlights.find((h) => h[flag])?.id ?? "";
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <select
        value={selected}
        onChange={(e) =>
          onChange(
            highlights.map((h) => ({
              ...h,
              [flag]: h.id === e.target.value ? true : undefined,
            })),
          )
        }
      >
        <option value="">ללא</option>
        {highlights.map((h) => (
          <option key={h.id} value={h.id}>
            {[h.value, h.label].filter(Boolean).join(" · ") || "היילייט ריק"}
          </option>
        ))}
      </select>
      {!highlights.length && (
        <small>אפשר להוסיף היילייטס בלשונית Case Study.</small>
      )}
    </label>
  );
}
