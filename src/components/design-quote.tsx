"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Fragment, useEffect, useRef } from "react";
import type { SiteContent } from "@/i18n/dictionaries";
import styles from "./design-quote.module.css";

export function DesignQuote({
  content,
}: {
  content: SiteContent["designQuote"];
}) {
  const rootRef = useRef<HTMLElement>(null);

  // Played once, when the quote scrolls into view: the letters slide up into
  // their words one after another, like the hero's rotating phrase entering,
  // then the signature appears and its underline is drawn. Without JS, or
  // with reduced motion, the quote is shown as is.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: root,
            start: "top 75%",
            once: true,
          },
        })
        .fromTo(
          "[data-quote-char]",
          { yPercent: 130 },
          {
            yPercent: 0,
            duration: 0.6,
            // Close to the hero's spring (damping 30, stiffness 400).
            ease: "back.out(1.4)",
            stagger: 0.025,
          },
        )
        .fromTo(
          "[data-quote-mark]",
          { opacity: 0, scale: 0.6, rotate: -12 },
          {
            opacity: 1,
            scale: 1,
            rotate: 0,
            duration: 0.5,
            ease: "back.out(2)",
          },
          0,
        )
        .fromTo(
          "[data-quote-author]",
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
          "-=0.2",
        )
        // The underline is drawn under the signature, left to right.
        .fromTo(
          "[data-quote-stroke]",
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 0.5, ease: "power1.inOut" },
        );
    }, root);
    return () => context.revert();
  }, []);

  const words = content.text.split(/\s+/);

  return (
    <figure ref={rootRef} lang="en" dir="ltr" className={styles.root}>
      <span className={styles.mark} aria-hidden="true" data-quote-mark>
        &ldquo;
      </span>
      <blockquote className={styles.quote}>
        <p>
          {/* Read whole; the letter-split copy below is only for the eye. */}
          <span className="visually-hidden">{content.text}</span>
          <span aria-hidden="true">
            {words.map((word, wordIndex) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static split of fixed copy
              <Fragment key={wordIndex}>
                <span className={styles.word}>
                  {[...word].map((char, charIndex) => (
                    <span
                      // biome-ignore lint/suspicious/noArrayIndexKey: static split of fixed copy
                      key={charIndex}
                      className={styles.char}
                      data-quote-char
                    >
                      {char}
                    </span>
                  ))}
                </span>
                {wordIndex < words.length - 1 ? " " : null}
              </Fragment>
            ))}
          </span>
        </p>
      </blockquote>
      {/* Signed by hand, at the end of the quote. */}
      <figcaption className={styles.author} data-quote-author>
        <cite className={styles.signature}>
          {content.author}
          <svg
            className={styles.stroke}
            viewBox="0 0 200 20"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M4 14C40 7 92 4 132 8S184 15 196 6"
              pathLength={1}
              data-quote-stroke
            />
          </svg>
        </cite>
      </figcaption>
    </figure>
  );
}
