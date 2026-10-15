"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { panelSurface } from "@/lib/project-presentation";
import type { PanelStyle } from "@/types/project";
import styles from "./admin.module.css";

const DEFAULT_BACKGROUND = "#262626";
const HEX = /^#[0-9a-f]{6}$/i;

/** A colour input with a matching #RRGGBB field; only valid values change. */
function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [shown, setShown] = useState(value);
  // Follow outside changes (e.g. "automatic" text) without losing typing.
  if (value !== shown) {
    setShown(value);
    setDraft(value);
  }
  function pick(next: string) {
    setDraft(next);
    if (HEX.test(next)) onChange(next.toLowerCase());
  }
  return (
    <div className={styles.inline}>
      <label className={styles.field}>
        <span>{label}</span>
        <input
          type="color"
          value={value}
          onChange={(e) => pick(e.target.value)}
        />
      </label>
      <label className={styles.field}>
        <span>קוד צבע</span>
        <input
          dir="ltr"
          maxLength={7}
          value={draft}
          aria-invalid={!HEX.test(draft)}
          onChange={(e) => pick(e.target.value.trim())}
        />
      </label>
    </div>
  );
}

/**
 * The case study panel's background and text colours (panel_style). The site
 * draws its grain over the background. Without a text colour, the text is
 * light or dark by the background's luminance.
 */
export function PanelBackgroundEditor({
  panelStyle,
  onChange,
}: {
  panelStyle: PanelStyle | null;
  onChange: (style: PanelStyle | null) => void;
}) {
  const background = panelStyle?.color ?? null;
  const surface = panelSurface({ panel_style: panelStyle });
  return (
    <section className={styles.section}>
      <h2>צבעי הפאנל הצדדי</h2>
      <p className={styles.hint}>
        צבע רקע וצבע טקסט לפאנל המידע בעמוד הפרויקט. אפקט ה־grain של האתר מוצג
        מעל הרקע. הקווים והתגיות בפאנל מקבלים את צבע הטקסט.
      </p>
      <label className={styles.check}>
        <input
          type="checkbox"
          checked={!!background}
          onChange={(e) =>
            onChange(
              e.target.checked
                ? { ...panelStyle, color: DEFAULT_BACKGROUND }
                : null,
            )
          }
        />
        רקע צבעוני לפאנל
      </label>
      {background && (
        <>
          <ColorField
            label="צבע רקע"
            value={background}
            onChange={(color) => onChange({ ...panelStyle, color })}
          />
          <ColorField
            label={panelStyle?.text ? "צבע טקסט" : "צבע טקסט (אוטומטי)"}
            value={
              panelStyle?.text ??
              (surface?.foreground === "var(--color-light)"
                ? "#fbfbff"
                : "#262626")
            }
            onChange={(text) =>
              onChange({ ...panelStyle, color: background, text })
            }
          />
          {panelStyle?.text && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onChange({ color: background })}
            >
              צבע טקסט אוטומטי
            </Button>
          )}
          <p
            className={styles.hint}
            style={{
              background: surface?.background,
              color: surface?.foreground,
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius-md)",
            }}
          >
            כך ייראה הטקסט בפאנל.
          </p>
        </>
      )}
    </section>
  );
}
