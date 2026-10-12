"use client";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import styles from "./admin.module.css";

/** Moves one item; out-of-range moves are ignored. */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= items.length ||
    to >= items.length
  )
    return items;
  const next = [...items];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}

/**
 * Drag-and-drop ordering with Up/Down buttons as the keyboard alternative.
 * `type` scopes drops so nested lists never accept each other's items.
 */
export function SortableList<T>({
  items,
  itemKey,
  type,
  onMove,
  label,
  render,
  className,
  disabled = false,
}: {
  items: T[];
  itemKey: (item: T, index: number) => string;
  type: string;
  onMove: (from: number, to: number) => void;
  /** Accessible name of the item at an index, e.g. "בלוק 2". */
  label: (item: T, index: number) => string;
  /** `handle` is the drag handle + move buttons, placed by the item. */
  render: (item: T, index: number, handle: ReactNode) => ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const mime = `application/x-moriz-${type}`;
  return (
    <ul className={`${styles.sortable} ${className ?? ""}`}>
      {items.map((item, index) => {
        const name = label(item, index);
        const handle = (
          <div className={styles.actions}>
            <Button
              className={styles.handle}
              variant="ghost"
              size="sm"
              draggable={!disabled}
              disabled={disabled}
              onDragStart={(e) => {
                e.dataTransfer.setData(mime, String(index));
                e.dataTransfer.effectAllowed = "move";
              }}
              title="גררו כדי לשנות סדר"
              aria-label={`גרירת ${name}`}
            >
              <svg
                width="16"
                height="20"
                viewBox="0 0 16 20"
                aria-hidden="true"
                fill="currentColor"
              >
                {[5, 10, 15].map((y) => (
                  <g key={y}>
                    <circle cx="5" cy={y} r="1.2" />
                    <circle cx="11" cy={y} r="1.2" />
                  </g>
                ))}
              </svg>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={disabled || index === 0}
              onClick={() => onMove(index, index - 1)}
              aria-label={`הזזת ${name} למעלה`}
            >
              למעלה
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={disabled || index === items.length - 1}
              onClick={() => onMove(index, index + 1)}
              aria-label={`הזזת ${name} למטה`}
            >
              למטה
            </Button>
          </div>
        );
        return (
          <li
            key={itemKey(item, index)}
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes(mime)) e.preventDefault();
            }}
            onDrop={(e) => {
              const value = e.dataTransfer.getData(mime);
              if (!value) return;
              e.preventDefault();
              e.stopPropagation();
              onMove(Number(value), index);
            }}
          >
            {render(item, index, handle)}
          </li>
        );
      })}
    </ul>
  );
}
