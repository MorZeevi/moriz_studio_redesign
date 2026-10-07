import type { ReactNode } from "react";
import type { SelectedElementContext } from "./types";
import styles from "./inspector.module.css";

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.detail}>
      <dt>{label}</dt>
      <dd dir="auto">{children}</dd>
    </div>
  );
}

export function SelectedElementPanel({
  selected,
}: {
  selected: SelectedElementContext | null;
}) {
  if (!selected)
    return (
      <p className={styles.help}>
        Turn Inspector ON, hover to preview, then click to select. Double-click
        copies its ID or classes. Escape stops inspection.
      </p>
    );
  const { source } = selected;
  return (
    <dl className={styles.details} data-inspector-details>
      <Detail label="Source mapping">
        {source.kind === "exact"
          ? "Exact JSX declaration"
          : source.kind === "containing"
            ? "Containing source — not the exact element"
            : "Unavailable"}
      </Detail>
      <Detail label="Component (declared)">
        <code>{source.component || "Unavailable"}</code>
      </Detail>
      <Detail label="File">
        <code>{source.file || "Unavailable"}</code>
      </Detail>
      <Detail label="Line">
        {source.line || "Unavailable"}
        {source.column ? `, column ${source.column}` : ""}
      </Detail>
      <Detail label="Element">
        <code>{selected.tag}</code>
      </Detail>
      <Detail label="ID">
        <code>{selected.id ? `#${selected.id}` : "None"}</code>
      </Detail>
      <Detail label="Classes">
        <code>{selected.classes.join(" ") || "None"}</code>
      </Detail>
      <Detail label="Text">
        {selected.text || "None"}
        {selected.textTruncated && " … (truncated)"}
      </Detail>
      <Detail label="Accessible name">
        {selected.accessibleName || "Unavailable"}
      </Detail>
      <Detail label="Size">
        {Math.round(selected.rect.width)} × {Math.round(selected.rect.height)}{" "}
        CSS px
      </Detail>
      <Detail label="Selector">
        <code>{selected.selector}</code>
      </Detail>
      <Detail label="Data attributes">
        <code>
          {Object.keys(selected.dataAttributes).length
            ? JSON.stringify(selected.dataAttributes, null, 2)
            : "None"}
        </code>
      </Detail>
    </dl>
  );
}
