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

  // Each word comes into focus in reading order as the quote scrolls up:
  // from a soft blur, a little low, to sharp and in place. It plays once;
  // after the quote is fully read it stays at rest. Without JS, or with
  // reduced motion, the quote is shown as is.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top 80%",
          end: "center 50%",
          scrub: 0.8,
          onLeave: (self) => {
            self.kill();
            gsap.to(timeline, { progress: 1, duration: 0.4, ease: "none" });
          },
        },
      });
      timeline
        .fromTo(
          "[data-quote-word]",
          { opacity: 0, yPercent: 35, filter: "blur(10px)" },
          {
            opacity: 1,
            yPercent: 0,
            filter: "blur(0px)",
            ease: "power2.out",
            stagger: 0.12,
          },
        )
        .fromTo(
          "[data-quote-author]",
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, ease: "power2.out" },
          "-=0.2",
        );
    }, root);
    return () => context.revert();
  }, []);

  return (
    <figure ref={rootRef} className={styles.root}>
      <blockquote lang="en" dir="ltr" className={styles.quote}>
        <p>
          {content.text.split(/(\s+)/).map((part, index) =>
            part.trim() ? (
              // biome-ignore lint/suspicious/noArrayIndexKey: static split of fixed copy
              <span key={index} className={styles.word} data-quote-word>
                {part}
              </span>
            ) : (
              // biome-ignore lint/suspicious/noArrayIndexKey: static split of fixed copy
              <Fragment key={index}>{part}</Fragment>
            ),
          )}
        </p>
      </blockquote>
      <figcaption
        lang="en"
        dir="ltr"
        className={styles.author}
        data-quote-author
      >
        — <cite>{content.author}</cite>
      </figcaption>
    </figure>
  );
}
