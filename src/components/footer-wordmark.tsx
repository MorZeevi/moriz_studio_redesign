"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useSyncExternalStore } from "react";
import styles from "./site-footer.module.css";

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(callback: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const readMotion = () => window.matchMedia(motionQuery).matches;
const serverMotion = () => true;

// Each letter starts tipped a different way so the words land like a loose wave.
const startRotations = [-14, 9, -7, 12, -10, 8, -12];

type Line = { text: string; bold: boolean };

export function FooterWordmark({
  lines,
  fillSrc,
}: {
  lines: Line[];
  /** Image shown through the glyphs, continuous across the whole word. */
  fillSrc?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    readMotion,
    serverMotion,
  );

  // Each letter clips its own copy of the image; offsetting it by the letter's
  // untransformed position stitches the copies into one picture.
  useEffect(() => {
    const element = root.current;
    if (!element || !fillSrc) return;
    // The image covers the whole block, centred; its height comes from the
    // file's own ratio once it loads.
    const image = new Image();
    image.src = fillSrc;
    const align = () => {
      const width = element.clientWidth;
      const height = image.naturalWidth
        ? (width * image.naturalHeight) / image.naturalWidth
        : element.clientHeight;
      const top = (element.clientHeight - height) / 2;
      element.style.setProperty("--fill-w", `${width}px`);
      element.style.setProperty("--fill-h", `${height}px`);
      for (const letter of element.querySelectorAll<HTMLElement>(
        "[data-letter]",
      )) {
        letter.style.setProperty("--fill-x", `${-letter.offsetLeft}px`);
        letter.style.setProperty("--fill-y", `${top - letter.offsetTop}px`);
      }
    };
    align();
    image.addEventListener("load", align);
    const size = new ResizeObserver(align);
    size.observe(element);
    return () => {
      image.removeEventListener("load", align);
      size.disconnect();
    };
  }, [fillSrc]);

  useEffect(() => {
    const element = root.current;
    if (!element || reducedMotion) return;
    gsap.registerPlugin(ScrollTrigger);
    const letters = element.querySelectorAll<HTMLElement>("[data-letter]");
    const tween = gsap.fromTo(
      letters,
      {
        yPercent: 85,
        rotation: (index) => startRotations[index % startRotations.length],
        transformOrigin: "50% 100%",
      },
      {
        yPercent: 0,
        rotation: 0,
        ease: "none",
        stagger: 0.08,
        scrollTrigger: {
          trigger: element,
          start: "top bottom",
          // The footer ends the page, so the word settles on the last scroll.
          end: "max",
          scrub: 0.6,
        },
      },
    );
    // Late fonts, images and sticky stacks above change the page height,
    // which moves both ends of this trigger. Refresh only this one.
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let active = true;
    const refresh = () => {
      // A late fonts.ready after cleanup would refresh a killed trigger.
      if (!active) return;
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => tween.scrollTrigger?.refresh(), 150);
    };
    const pageSize = new ResizeObserver(refresh);
    pageSize.observe(document.body);
    document.fonts.ready.then(refresh);
    return () => {
      active = false;
      clearTimeout(refreshTimer);
      pageSize.disconnect();
      tween.scrollTrigger?.kill();
      tween.kill();
      // Not "all": that would also wipe the fill offsets set above.
      gsap.set(letters, {
        clearProps: "transform,transformOrigin,translate,rotate,scale",
      });
    };
  }, [reducedMotion]);

  return (
    <div
      ref={root}
      dir="ltr"
      aria-hidden="true"
      className={
        fillSrc ? `${styles.wordmark} ${styles.filled}` : styles.wordmark
      }
      style={
        fillSrc
          ? ({ "--fill-image": `url(${fillSrc})` } as React.CSSProperties)
          : undefined
      }
    >
      {lines.map((line) => (
        <span
          key={line.text}
          className={
            line.bold ? styles.line : `${styles.line} ${styles.lineRegular}`
          }
        >
          {Array.from(line.text).map((letter, index) =>
            // Leon's i dot is oval; draw the stem dotless and add a round dot.
            letter === "i" ? (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: letters can repeat and never reorder.
                key={index}
                data-letter
                className={`${styles.letter} ${styles.dotted}`}
              >
                ı
              </span>
            ) : (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: letters can repeat and never reorder.
                key={index}
                data-letter
                className={styles.letter}
              >
                {letter}
              </span>
            ),
          )}
        </span>
      ))}
    </div>
  );
}
