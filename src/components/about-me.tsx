"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { Fragment, useEffect, useRef, useSyncExternalStore } from "react";
import type { SiteContent } from "@/i18n/dictionaries";
import styles from "./about-me.module.css";

const subscribeNothing = () => () => {};

// Latin runs such as "H.I.T" or "Web" stay isolated inside the Hebrew text.
const latinRun = /([A-Za-z](?:[A-Za-z.]*[A-Za-z])?)/;

function Isolated({ text }: { text: string }) {
  return text.split(latinRun).map((part, index) =>
    index % 2 ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: static split of fixed copy
      <bdi key={index}>{part}</bdi>
    ) : (
      // biome-ignore lint/suspicious/noArrayIndexKey: static split of fixed copy
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function AboutMe({ content }: { content: SiteContent["about"] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  // Without JavaScript every phrase is highlighted and nothing is dimmed.
  const enhanced = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

  // Reading focus follows the scroll: the paragraph nearest the eye line is
  // full strength, and each bold phrase is marked once as it is read.
  useEffect(() => {
    const root = rootRef.current;
    if (!enhanced || !root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const paragraphs = [
      ...root.querySelectorAll<HTMLElement>("[data-about-paragraph]"),
    ];
    const inks = [...root.querySelectorAll<HTMLElement>("[data-about-ink]")];
    const drawn = inks.map(() => 0);

    const update = (progress: number) => {
      const viewport = window.innerHeight;
      const eye = viewport * 0.45;
      let active = 0;
      let nearest = Number.POSITIVE_INFINITY;
      paragraphs.forEach((paragraph, index) => {
        const box = paragraph.getBoundingClientRect();
        const distance = Math.abs(box.top + box.height / 2 - eye);
        if (distance < nearest) {
          nearest = distance;
          active = index;
        }
      });
      paragraphs.forEach((paragraph, index) => {
        paragraph.toggleAttribute("data-active", index === active);
      });
      // A phrase starts at 80% of the viewport and is fully marked once its
      // last line passes 55%; it never un-draws when scrolling back.
      inks.forEach((ink, index) => {
        const box = ink.getBoundingClientRect();
        const start = viewport * 0.8;
        const span = viewport * 0.25 + box.height;
        drawn[index] = Math.max(drawn[index], clamp((start - box.top) / span));
        ink.style.setProperty("--ink", drawn[index].toFixed(3));
      });
      root.style.setProperty("--about-progress", progress.toFixed(3));
    };

    gsap.registerPlugin(ScrollTrigger);
    root.setAttribute("data-reading", "");
    const trigger = ScrollTrigger.create({
      trigger: root,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => update(self.progress),
      onRefresh: (self) => update(self.progress),
    });
    update(trigger.progress);
    return () => {
      trigger.kill();
      root.removeAttribute("data-reading");
      root.style.removeProperty("--about-progress");
      for (const paragraph of paragraphs)
        paragraph.removeAttribute("data-active");
      for (const ink of inks) ink.style.removeProperty("--ink");
    };
  }, [enhanced]);

  return (
    <div ref={rootRef} className={styles.root} data-about-me>
      <div className={styles.text}>
        {content.paragraphs.map((segments) => (
          <p
            key={segments[0].text}
            className={styles.paragraph}
            data-about-paragraph
          >
            {segments.map((segment) =>
              segment.strong ? (
                <strong
                  key={segment.text}
                  className={styles.ink}
                  data-about-ink
                >
                  <Isolated text={segment.text} />
                </strong>
              ) : (
                <Isolated key={segment.text} text={segment.text} />
              ),
            )}
          </p>
        ))}
        <p className={styles.note}>{content.linkPlaceholder}</p>
      </div>
      <figure className={styles.portrait}>
        <div className={styles.frame}>
          <span className={styles.blob} aria-hidden="true" />
          <Image
            className={styles.photo}
            src={content.portrait.src}
            alt={content.portrait.alt}
            width={content.portrait.width}
            height={content.portrait.height}
            sizes="(min-width: 64rem) 22.5rem, 14rem"
          />
        </div>
      </figure>
    </div>
  );
}
