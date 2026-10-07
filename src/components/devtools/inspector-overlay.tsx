import type { Highlight } from "./use-element-inspector";
import styles from "./inspector.module.css";

export function InspectorOverlay({
  highlight,
  selected = false,
}: {
  highlight: Highlight | null;
  selected?: boolean;
}) {
  if (!highlight) return null;
  const { rect, label } = highlight;
  return (
    <div
      className={`${styles.highlight} ${selected ? styles.selectedHighlight : styles.hoverHighlight}`}
      data-inspector-overlay={selected ? "selected" : "hover"}
      aria-hidden="true"
      style={{
        transform: `translate(${rect.x}px, ${rect.y}px)`,
        width: rect.width,
        height: rect.height,
      }}
    >
      <span
        className={styles.overlayLabel}
        style={{
          // Label placement uses viewport pixels, matching DOM geometry.
          top: rect.y < 32 ? "100%" : undefined,
          left: Math.max(0, -rect.x),
          maxWidth: `max(0px, min(20rem, calc(100vw - ${Math.max(0, rect.x)}px)))`,
        }}
      >
        {selected ? "Selected" : "Hover"}: {label}
      </span>
    </div>
  );
}
