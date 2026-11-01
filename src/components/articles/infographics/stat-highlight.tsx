"use client";

import { useRef, type ReactNode } from "react";
import { parseStatValue } from "@/lib/articles/infographic-values";
import { CountText } from "./count";
import styles from "./infographics.module.css";
import { useArticleMotion } from "./motion";
import { SourceCredit, type Citation } from "./source-credit";

export type StatProps = {
  /** The number exactly as the source published it, without a unit. */
  value: string;
  /** Words that follow the number. */
  label: string;
  prefix?: string;
  suffix?: string;
};

export type StatHighlightProps = Citation & {
  title?: string;
  children?: ReactNode;
};

function displayValue(value: string, prefix?: string, suffix?: string) {
  const text = value.trim();
  return `${prefix?.trim() ?? ""}${text}${suffix?.trim() ?? ""}`;
}

export function Stat({ value, label, prefix, suffix }: StatProps) {
  const text = value?.trim() ?? "";
  const parsed = parseStatValue(text);
  const shown = displayValue(text, prefix, suffix);
  return (
    <div className={styles.stat}>
      <p className={styles.srOnly}>{`${shown} ${label}`}</p>
      <div aria-hidden="true">
        <p className={styles.value} dir="ltr">
          {prefix?.trim() ? <span>{prefix.trim()}</span> : null}
          <CountText text={text} parsed={parsed} />
          {suffix?.trim() ? <span>{suffix.trim()}</span> : null}
        </p>
        <span className={styles.valueMark} />
        <p className={styles.label}>{label}</p>
      </div>
    </div>
  );
}

export function StatHighlight({
  title,
  source,
  sourceUrl,
  children,
}: StatHighlightProps) {
  const ref = useRef<HTMLElement>(null);
  useArticleMotion(ref);
  return (
    <figure
      ref={ref}
      className={styles.figure}
      data-infographic="stat"
    >
      <div data-reveal="">
        {title ? <p className={styles.heading}>{title}</p> : null}
        <div className={styles.stats}>{children}</div>
      </div>
      <figcaption className={styles.caption}>
        <SourceCredit source={source} sourceUrl={sourceUrl} />
      </figcaption>
    </figure>
  );
}
