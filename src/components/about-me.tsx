"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { Fragment, useEffect, useRef } from "react";
import type { SiteContent } from "@/i18n/dictionaries";
import styles from "./about-me.module.css";

// Latin runs such as "H.I.T", "UI/UX" or "Front-End" stay isolated, whole,
// inside the Hebrew text.
const latinRun = /([A-Za-z](?:[A-Za-z./\- ]*[A-Za-z])?)/;

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

// Each word is its own span so the scroll can fill it in reading order.
function Words({ text }: { text: string }) {
  return text.split(/(\s+)/).map((part, index) =>
    part.trim() ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: static split of fixed copy
      <span key={index} data-about-word>
        <Isolated text={part} />
      </span>
    ) : (
      // biome-ignore lint/suspicious/noArrayIndexKey: static split of fixed copy
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}

export function AboutMe({ content }: { content: SiteContent["about"] }) {
  const rootRef = useRef<HTMLDivElement>(null);

  // The bio fills in word by word as it scrolls up, from the background tone
  // to full ink, and the portrait settles into place. Without JS, or with
  // reduced motion, everything is shown at rest.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(max-width: 63.999rem)").matches
    )
      return;
    gsap.registerPlugin(ScrollTrigger);
    const setProgress = (progress: number) =>
      root.style.setProperty("--about-progress", progress.toFixed(3));
    const context = gsap.context(() => {
      const section = ScrollTrigger.create({
        trigger: root,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => setProgress(self.progress),
        onRefresh: (self) => setProgress(self.progress),
      });
      setProgress(section.progress);
      gsap.fromTo(
        "[data-about-word]",
        { opacity: 0.16 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.1,
          scrollTrigger: {
            trigger: "[data-about-copy]",
            start: "top 85%",
            end: "bottom 70%",
            scrub: 0.4,
          },
        },
      );
    }, root);
    return () => {
      context.revert();
      root.style.removeProperty("--about-progress");
    };
  }, []);

  return (
    <div ref={rootRef} className={styles.root} data-about-me>
      <div className={styles.text}>
        <div className={styles.copy} data-about-copy>
          {content.paragraphs.map((segments) => (
            <p key={segments[0].text} className={styles.paragraph}>
              {segments.map((segment) =>
                segment.strong ? (
                  <strong key={segment.text} className={styles.strong}>
                    <Words text={segment.text} />
                  </strong>
                ) : (
                  <Words key={segment.text} text={segment.text} />
                ),
              )}
            </p>
          ))}
        </div>
        <dl className={styles.credentials}>
          {content.credentials.map((credential) => (
            <div key={credential.value} className={styles.credential}>
              <dt className={styles.credentialValue}>
                <bdi>{credential.value}</bdi>
              </dt>
              <dd className={styles.credentialLabel}>
                <Isolated text={credential.label} />
              </dd>
              {credential.detail ? (
                <dd className={styles.credentialDetail}>
                  <Isolated text={credential.detail} />
                </dd>
              ) : null}
            </div>
          ))}
        </dl>
      </div>
      <figure className={styles.portrait}>
        <div className={styles.frame}>
          <Image
            className={styles.photo}
            src={content.portrait.src}
            alt={content.portrait.alt}
            width={content.portrait.width}
            height={content.portrait.height}
            sizes="(min-width: 64rem) 24rem, 16rem"
          />
        </div>
      </figure>
    </div>
  );
}
