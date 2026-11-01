"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import styles from "./infographics.module.css";

/**
 * The final number is in the server HTML. Counting runs only after the card
 * scrolls into view, and only when the reader has not asked for less motion.
 * A hidden copy of the full string keeps the width stable while the digits change.
 */
export function StatCount({ value }: { value: string }) {
  const animRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = animRef.current;
    const parsed = parseCountable(value);
    if (!node || !parsed) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;

    let frame = 0;
    let wasOutside = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (!entry.isIntersecting) {
          wasOutside = true;
          return;
        }
        if (!wasOutside) {
          observer.disconnect();
          return;
        }
        observer.disconnect();
        const started = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - started) / 900);
          const eased = 1 - (1 - progress) ** 3;
          const current = Math.round(parsed.number * eased);
          node.textContent = `${current}${parsed.suffix}`;
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        node.textContent = `0${parsed.suffix}`;
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.55 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  const style = {
    "--stat-digits": String([...value].length),
  } as CSSProperties;

  return (
    <span className={styles.valueSlot} style={style}>
      <span className={styles.valueSizer} aria-hidden="true">
        {value}
      </span>
      <span ref={animRef} className={styles.valueAnim} aria-hidden="true">
        {value}
      </span>
      <span className={styles.srOnly}>{value}</span>
    </span>
  );
}

function parseCountable(value: string) {
  const match = /^(\d+)(%)$|^(\d+)$/.exec(value.trim());
  if (!match) return null;
  const raw = match[1] ?? match[3];
  if (!raw) return null;
  const number = Number(raw);
  if (!Number.isInteger(number) || number < 0 || number > 9999) return null;
  return { number, suffix: match[2] ?? "" };
}
