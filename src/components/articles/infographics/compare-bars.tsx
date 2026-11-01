"use client";

import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useRef,
  type ReactNode,
} from "react";
import { parseStatValue } from "@/lib/articles/infographic-values";
import { CountText, withUnit } from "./count";
import styles from "./infographics.module.css";
import { useArticleMotion } from "./motion";
import { SourceCredit, type Citation } from "./source-credit";

const BarScale = createContext({ max: 100, unit: "", lead: 0 });

export type BarProps = {
  /** Category name, such as the group being compared. */
  label: string;
  /** The number exactly as the source published it, without the unit. */
  value: string;
};

export type CompareBarsProps = Citation & {
  title?: string;
  /** Shown with every value. Use % for a percentage. */
  unit?: string;
  /** The value that fills the track. For percentages, 100. */
  max: string;
  children?: ReactNode;
};

function childNumbers(children: ReactNode) {
  const numbers: number[] = [];
  for (const child of Children.toArray(children)) {
    if (!isValidElement<{ value?: unknown }>(child)) continue;
    if (typeof child.props.value !== "string") continue;
    const parsed = parseStatValue(child.props.value);
    if (parsed) numbers.push(parsed.numeric);
  }
  return numbers;
}

export function Bar({ label, value }: BarProps) {
  const scale = useContext(BarScale);
  const text = value?.trim() ?? "";
  const parsed = parseStatValue(text);
  const width = parsed
    ? Math.round(Math.min(100, (parsed.numeric / scale.max) * 100) * 10) / 10
    : 0;
  const lead = parsed !== null && parsed.numeric === scale.lead && scale.lead > 0;
  const unit = scale.unit.trim();
  return (
    <li className={styles.barRow}>
      <p className={styles.srOnly}>{`${label}: ${withUnit(text, unit)}`}</p>
      <div aria-hidden="true">
        <div className={styles.barMeta}>
          <span className={styles.barLabel}>{label}</span>
          <bdi dir="ltr" className={styles.barValue}>
            <CountText text={text} parsed={parsed} />
            {unit ? <span>{/\p{L}/u.test(unit) ? ` ${unit}` : unit}</span> : null}
          </bdi>
        </div>
        <div className={styles.track}>
          <div
            className={styles.fill}
            data-bar=""
            data-width={String(width)}
            data-lead={lead ? "true" : "false"}
            style={{ width: `${width}%` }}
          />
        </div>
      </div>
    </li>
  );
}

export function CompareBars({
  title,
  source,
  sourceUrl,
  unit = "",
  max,
  children,
}: CompareBarsProps) {
  const ref = useRef<HTMLElement>(null);
  useArticleMotion(ref);
  const parsedMax = parseStatValue(max ?? "");
  const scale = parsedMax && parsedMax.numeric > 0 ? parsedMax.numeric : 100;
  const numbers = childNumbers(children);
  const lead = numbers.length ? Math.max(...numbers) : 0;
  return (
    <figure ref={ref} className={styles.figure} data-infographic="bars">
      <BarScale.Provider value={{ max: scale, unit, lead }}>
        <div data-reveal="">
          {title ? <p className={styles.heading}>{title}</p> : null}
          <ul className={styles.bars}>{children}</ul>
        </div>
      </BarScale.Provider>
      <figcaption className={styles.caption}>
        <SourceCredit source={source} sourceUrl={sourceUrl} />
      </figcaption>
    </figure>
  );
}
