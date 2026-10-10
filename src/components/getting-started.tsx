"use client";

import {
  type CSSProperties,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { GettingStartedStep } from "@/content/getting-started";
import styles from "./getting-started.module.css";
import { StepIcon } from "./getting-started-icons";

const subscribeNothing = () => () => {};

export function GettingStarted({
  steps,
  locale,
}: {
  steps: GettingStartedStep[];
  locale: string;
}) {
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [visible, setVisible] = useState<boolean[]>(() =>
    steps.map(() => false),
  );
  // Without JavaScript every step is shown in its final state.
  const enhanced = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
  const numbers = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 });

  useEffect(() => {
    if (!enhanced) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(steps.map(() => true));
      return;
    }
    // Each step reveals on its own, so stacked mobile steps wait until they
    // are actually on screen; desktop columns intersect together.
    const observer = new IntersectionObserver(
      (entries) => {
        const shown = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) =>
            stepRefs.current.indexOf(entry.target as HTMLLIElement),
          );
        if (shown.length === 0) return;
        for (const entry of entries)
          if (entry.isIntersecting) observer.unobserve(entry.target);
        setVisible((previous) =>
          previous.map((value, index) => value || shown.includes(index)),
        );
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    for (const step of stepRefs.current) if (step) observer.observe(step);
    return () => observer.disconnect();
  }, [enhanced, steps]);

  return (
    <ol className={styles.root} data-enhanced={enhanced ? "" : undefined}>
      {steps.map((step, index) => (
        <li
          key={step.title}
          ref={(node) => {
            stepRefs.current[index] = node;
          }}
          className={styles.step}
          data-visible={visible[index] ? "" : undefined}
          style={{ "--i": index } as CSSProperties}
        >
          <span className={styles.rail} aria-hidden="true">
            <span className={styles.segment}>
              <span className={styles.segmentFill} />
            </span>
            <span className={styles.node} />
          </span>
          <div className={styles.head}>
            <span className={styles.icon}>
              <StepIcon icon={step.icon} />
            </span>
            <span className={styles.number} aria-hidden="true">
              <bdi>{numbers.format(index + 1)}</bdi>
            </span>
          </div>
          <h3 className={styles.title}>{step.title}</h3>
          <p className={styles.detail}>{step.detail}</p>
        </li>
      ))}
    </ol>
  );
}
