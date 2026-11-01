"use client";

import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import styles from "./infographics.module.css";
import { useArticleMotion } from "./motion";
import { SourceCredit, type Citation } from "./source-credit";
import { oneLine, plainText } from "./text";

type StepsController = {
  total: number;
  active: number;
  next: () => number;
  preview: (index: number) => void;
  clearPreview: () => void;
  pin: (index: number) => void;
};

const StepsApi = createContext<StepsController | null>(null);

export type StepProps = {
  title: string;
  children?: ReactNode;
};

export type ProcessStepsProps = Citation & {
  title?: string;
  children?: ReactNode;
};

export function Step({ title, children }: StepProps) {
  const api = useContext(StepsApi);
  const slot = useRef<number | null>(null);
  if (slot.current == null) slot.current = api?.next() ?? 0;
  const index = slot.current;
  const open = api ? api.active === index : true;
  const panelId = useId();
  const detail = oneLine(plainText(children));
  const total = api?.total ?? 1;
  return (
    <li className={styles.step}>
      <p className={styles.srOnly} hidden={open}>
        {`שלב ${index + 1} מתוך ${total}: ${title}. ${detail}`}
      </p>
      <button
        type="button"
        className={styles.stepButton}
        aria-expanded={open}
        aria-controls={panelId}
        onMouseEnter={() => api?.preview(index)}
        onClick={() => api?.pin(index)}
      >
        <span className={styles.index}>{index + 1}</span>
        <span>{title}</span>
      </button>
      <div className={styles.detail} id={panelId} hidden={!open}>
        {children}
      </div>
    </li>
  );
}

export function ProcessSteps({ title, source, sourceUrl, children }: ProcessStepsProps) {
  const ref = useRef<HTMLElement>(null);
  useArticleMotion(ref);
  const counter = useRef(0);
  const hoverCapable = useRef(false);
  counter.current = 0;
  const total = Children.toArray(children).filter((child) => isValidElement(child)).length;
  const [pinned, setPinned] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const active = hovered ?? pinned;
  const preview = useCallback((index: number) => {
    if (hoverCapable.current) setHovered(index);
  }, []);
  const clearPreview = useCallback(() => setHovered(null), []);
  const pin = useCallback((index: number) => {
    setHovered(null);
    setPinned((current) => (current === index ? -1 : index));
  }, []);
  useLayoutEffect(() => {
    hoverCapable.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }, []);
  const api = useRef<StepsController>({
    total,
    active,
    next: () => counter.current++,
    preview,
    clearPreview,
    pin,
  });
  api.current = {
    total,
    active,
    next: () => counter.current++,
    preview,
    clearPreview,
    pin,
  };

  return (
    <figure ref={ref} className={styles.figure} data-infographic="steps">
      <StepsApi.Provider value={api.current}>
        <div data-reveal="">
          {title ? <p className={styles.heading}>{title}</p> : null}
          <ol
            className={styles.steps}
            onMouseLeave={clearPreview}
          >
            {children}
          </ol>
        </div>
      </StepsApi.Provider>
      <figcaption className={styles.caption}>
        <SourceCredit source={source} sourceUrl={sourceUrl} />
      </figcaption>
    </figure>
  );
}
