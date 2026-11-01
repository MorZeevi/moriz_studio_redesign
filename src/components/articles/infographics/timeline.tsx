"use client";

import { useRef, type ReactNode } from "react";
import styles from "./infographics.module.css";
import { useArticleMotion } from "./motion";
import { SourceCredit, type Citation } from "./source-credit";
import { oneLine, plainText } from "./text";

export type TimelineItemProps = {
  /** Short point on the line, such as a round or a date. */
  when: string;
  title: string;
  children?: ReactNode;
};

export type TimelineProps = Citation & {
  title?: string;
  children?: ReactNode;
};

export function TimelineItem({ when, title, children }: TimelineItemProps) {
  const detail = oneLine(plainText(children));
  return (
    <li className={styles.event} data-event="">
      <p className={styles.srOnly}>{`${when}. ${title}. ${detail}`}</p>
      <div aria-hidden="true">
        <p className={styles.when}>{when}</p>
        <p className={styles.eventTitle}>{title}</p>
        <div className={styles.eventBody}>{children}</div>
      </div>
    </li>
  );
}

export function Timeline({ title, source, sourceUrl, children }: TimelineProps) {
  const ref = useRef<HTMLElement>(null);
  useArticleMotion(ref);
  return (
    <figure ref={ref} className={styles.figure} data-infographic="timeline">
      {title ? <p className={styles.heading}>{title}</p> : null}
      <ol className={styles.events}>{children}</ol>
      <figcaption className={styles.caption}>
        <SourceCredit source={source} sourceUrl={sourceUrl} />
      </figcaption>
    </figure>
  );
}
