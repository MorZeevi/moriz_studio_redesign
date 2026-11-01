"use client";

import {
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import styles from "./infographics.module.css";
import { useArticleMotion } from "./motion";
import { SourceCredit, type Citation } from "./source-credit";
import { oneLine, plainText } from "./text";

type Side = "before" | "after";

const Choice = createContext({
  selected: "after" as Side,
  beforeLabel: "לפני",
  afterLabel: "אחרי",
});

export type PaneProps = {
  title?: string;
  children?: ReactNode;
};

export type BeforeAfterProps = Citation & {
  title?: string;
  beforeLabel?: string;
  afterLabel?: string;
  children?: ReactNode;
};

function Pane({
  side,
  title,
  children,
}: PaneProps & { side: Side }) {
  const choice = useContext(Choice);
  const label = side === "before" ? choice.beforeLabel : choice.afterLabel;
  const active = choice.selected === side;
  const summary = `${label}. ${title ? `${title}. ` : ""}${oneLine(plainText(children))}`;
  const className = side === "before" ? styles.paneBefore : styles.paneAfter;
  return (
    <>
      <p className={styles.accessibleSummary}>{summary}</p>
      <div
        className={`${styles.pane} ${className}`}
        data-active={active ? "true" : "false"}
        data-side={side}
      >
        {title ? <p className={styles.paneTitle}>{title}</p> : null}
        <div className={styles.paneBody}>{children}</div>
      </div>
    </>
  );
}

export function Before(props: PaneProps) {
  return <Pane side="before" {...props} />;
}

export function After(props: PaneProps) {
  return <Pane side="after" {...props} />;
}

export function BeforeAfter({
  title,
  source,
  sourceUrl,
  beforeLabel = "לפני",
  afterLabel = "אחרי",
  children,
}: BeforeAfterProps) {
  const ref = useRef<HTMLElement>(null);
  useArticleMotion(ref);
  const [selected, setSelected] = useState<Side>("after");
  const beforeId = useId();
  const afterId = useId();

  function move(next: Side) {
    setSelected(next);
    document.getElementById(next === "before" ? beforeId : afterId)?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowRight" &&
      event.key !== "ArrowUp" &&
      event.key !== "ArrowDown"
    ) {
      return;
    }
    event.preventDefault();
    move(selected === "before" ? "after" : "before");
  }

  return (
    <figure ref={ref} className={styles.figure} data-infographic="compare">
      <Choice.Provider value={{ selected, beforeLabel, afterLabel }}>
        <div data-reveal="">
          {title ? <p className={styles.heading}>{title}</p> : null}
          <fieldset className={styles.switch} aria-label={title ?? "השוואה"}>
            <button
              type="button"
              id={beforeId}
              className={styles.switchButton}
              aria-pressed={selected === "before"}
              onClick={() => setSelected("before")}
              onKeyDown={onKeyDown}
            >
              {beforeLabel}
            </button>
            <button
              type="button"
              id={afterId}
              className={styles.switchButton}
              aria-pressed={selected === "after"}
              onClick={() => setSelected("after")}
              onKeyDown={onKeyDown}
            >
              {afterLabel}
            </button>
          </fieldset>
          <div className={styles.columns}>{children}</div>
        </div>
      </Choice.Provider>
      <figcaption className={styles.caption}>
        <SourceCredit source={source} sourceUrl={sourceUrl} />
      </figcaption>
    </figure>
  );
}
