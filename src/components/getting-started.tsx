"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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
  const rootRef = useRef<HTMLOListElement>(null);
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

  // The rail fills with the scroll: one progress value drives every segment
  // (see .segmentFill) and marks each node as the fill reaches it.
  useEffect(() => {
    const root = rootRef.current;
    if (!enhanced || !root) return;
    const desktop = window.matchMedia("(min-width: 64rem)");
    const setProgress = (progress: number) => {
      root.style.setProperty("--gs-progress", progress.toFixed(4));
      // Desktop draws a segment after every node; mobile skips the last one.
      const segments = desktop.matches ? steps.length : steps.length - 1;
      stepRefs.current.forEach((step, index) => {
        if (step)
          step.toggleAttribute(
            "data-reached",
            progress >= index / Math.max(segments, 1) - 0.001,
          );
      });
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(1);
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    // Function-based edges instead of gsap.matchMedia, which would revert and
    // refresh every ScrollTrigger on the page (see HeroVideo).
    // A proxy tween, so scrub can smooth the value between scroll steps.
    const rail = { progress: 0 };
    const tween = gsap.to(rail, {
      progress: 1,
      ease: "none",
      onUpdate: () => setProgress(rail.progress),
      scrollTrigger: {
        trigger: root,
        start: () => (desktop.matches ? "top 80%" : "top 70%"),
        end: () => (desktop.matches ? "top 35%" : "bottom 70%"),
        scrub: 0.25,
      },
    });
    setProgress(rail.progress);
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      root.style.removeProperty("--gs-progress");
      for (const step of stepRefs.current)
        step?.removeAttribute("data-reached");
    };
  }, [enhanced, steps]);

  return (
    <ol
      ref={rootRef}
      className={styles.root}
      data-enhanced={enhanced ? "" : undefined}
    >
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
