"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";
import styles from "./site-footer.module.css";

// Desktop only: phones and reduced motion keep the letters at rest.
const motionQuery =
  "(min-width: 64rem) and (prefers-reduced-motion: no-preference)";

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
  const [nearby, setNearby] = useState(false);
  const visibleFill = !!fillSrc && nearby;

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry], observer) => {
        if (!entry.isIntersecting) return;
        setNearby(true);
        observer.disconnect();
      },
      { rootMargin: "500px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Each letter clips its own copy of the image; offsetting it by the letter's
  // untransformed position stitches the copies into one picture.
  useEffect(() => {
    const element = root.current;
    if (!element || !visibleFill || !fillSrc) return;
    let active = true;
    const image = new Image();
    const align = () => {
      if (!active || !image.naturalWidth || !image.naturalHeight) return;
      const letters = [
        ...element.querySelectorAll<HTMLElement>("[data-letter]"),
      ];
      // Include the padded paint bounds, not the animated bounding rectangles.
      const left = Math.min(0, ...letters.map((letter) => letter.offsetLeft));
      const top = Math.min(0, ...letters.map((letter) => letter.offsetTop));
      const right = Math.max(
        element.clientWidth,
        ...letters.map((letter) => letter.offsetLeft + letter.offsetWidth),
      );
      const bottom = Math.max(
        element.clientHeight,
        ...letters.map((letter) => letter.offsetTop + letter.offsetHeight),
      );
      const scale = Math.max(
        (right - left) / image.naturalWidth,
        (bottom - top) / image.naturalHeight,
      );
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const imageLeft = left + (right - left - width) / 2;
      const imageTop = top + (bottom - top - height) / 2;
      element.style.setProperty("--fill-w", `${width}px`);
      element.style.setProperty("--fill-h", `${height}px`);
      for (const letter of letters) {
        letter.style.setProperty(
          "--fill-x",
          `${imageLeft - letter.offsetLeft}px`,
        );
        letter.style.setProperty(
          "--fill-y",
          `${imageTop - letter.offsetTop}px`,
        );
      }
    };
    image.addEventListener("load", align);
    image.src = fillSrc;
    align();
    const size = new ResizeObserver(align);
    size.observe(element);
    for (const letter of element.querySelectorAll("[data-letter]"))
      size.observe(letter);
    document.fonts.ready.then(align);
    return () => {
      active = false;
      image.removeEventListener("load", align);
      size.disconnect();
    };
  }, [fillSrc, visibleFill]);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const media = window.matchMedia(motionQuery);
    const letters = element.querySelectorAll<HTMLElement>("[data-letter]");
    let tween: gsap.core.Tween | undefined;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let active = true;

    // Late fonts, images and sticky stacks above change the page height,
    // which moves both ends of this trigger. Refresh only this one.
    const refresh = () => {
      // A late fonts.ready after cleanup would refresh a killed trigger.
      if (!active) return;
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => tween?.scrollTrigger?.refresh(), 150);
    };

    const setup = () => {
      tween?.scrollTrigger?.kill();
      tween?.kill();
      // Not "all": that would also wipe the fill offsets set above.
      gsap.set(letters, {
        clearProps: "transform,transformOrigin,translate,rotate,scale",
      });
      if (!media.matches) return;
      gsap.registerPlugin(ScrollTrigger);
      const stage = element.closest<HTMLElement>("[data-footer-stage]");
      tween = gsap.fromTo(
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
            // Measure from the stationary stage: the parent surface itself
            // moves during parallax, which otherwise shifts refreshed triggers.
            trigger: stage ?? element,
            start: () =>
              stage ? `top+=${element.offsetTop} bottom` : "top bottom",
            // The footer ends the page, so the word settles on the last scroll.
            end: "max",
            scrub: 0.6,
          },
        },
      );
      refresh();
    };

    const pageSize = new ResizeObserver(refresh);
    pageSize.observe(document.body);
    document.fonts.ready.then(refresh);
    setup();
    media.addEventListener("change", setup);
    return () => {
      active = false;
      clearTimeout(refreshTimer);
      pageSize.disconnect();
      media.removeEventListener("change", setup);
      tween?.scrollTrigger?.kill();
      tween?.kill();
      gsap.set(letters, {
        clearProps: "transform,transformOrigin,translate,rotate,scale",
      });
    };
  }, []);

  return (
    <div
      ref={root}
      data-footer-wordmark
      dir="ltr"
      aria-hidden="true"
      className={
        visibleFill ? `${styles.wordmark} ${styles.filled}` : styles.wordmark
      }
      style={
        visibleFill
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
