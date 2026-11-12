"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import partyStyles from "@/components/party-mode/party-mode.module.css";
import { PartyHeadingLight } from "@/components/party-mode/party-heading-light";
import { usePartyMode } from "@/components/party-mode/party-mode-provider";
import RotatingText from "@/components/react-bits/RotatingText";
import type { SiteContent } from "@/i18n/dictionaries";

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(callback: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const readMotion = () => window.matchMedia(motionQuery).matches;
const serverMotion = () => true;

// The footer wordmark's picture, shown through the rotating phrase's glyphs.
const phraseFill = "/images/footer/wordmark-fill.webp";

/** Each letter clips its own copy of the picture; offsetting every copy by the
 * letter's untransformed position stitches them into one picture per phrase. */
function usePhraseFill(src: string) {
  const root = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let active = true;
    const image = new window.Image();
    const offset = (letter: HTMLElement) => {
      let left = 0;
      let top = 0;
      let node: HTMLElement | null = letter;
      while (node && node !== element) {
        left += node.offsetLeft;
        top += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }
      return { left, top };
    };
    const align = () => {
      if (!active || !image.naturalWidth) return;
      const width = element.offsetWidth;
      const height = (width * image.naturalHeight) / image.naturalWidth;
      element.style.setProperty("--fill-image", `url(${src})`);
      element.style.setProperty("--fill-w", `${width}px`);
      element.dataset.filled = "";
      const letters = element.querySelectorAll<HTMLElement>(
        ".text-rotate-element",
      );
      for (const letter of letters) {
        const { left, top } = offset(letter);
        letter.style.setProperty("--fill-x", `${-left}px`);
        letter.style.setProperty(
          "--fill-y",
          `${(element.offsetHeight - height) / 2 - top}px`,
        );
      }
    };
    image.addEventListener("load", align);
    image.src = src;
    // A new phrase mounts new letters; a resize moves them.
    const letters = new MutationObserver(align);
    letters.observe(element, { childList: true, subtree: true });
    const size = new ResizeObserver(align);
    size.observe(element);
    document.fonts.ready.then(align);
    return () => {
      active = false;
      image.removeEventListener("load", align);
      letters.disconnect();
      size.disconnect();
    };
  }, [src]);
  return root;
}

export function HeroHeading({
  content,
}: {
  content: SiteContent["hero"]["heading"];
}) {
  const [index, setIndex] = useState(0);
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    readMotion,
    serverMotion,
  );
  const { enabled, phase } = usePartyMode();
  // Party lights project a static copy of the heading; hold the phrase still
  // so the copy matches the live text.
  const partying = enabled || phase !== "idle";
  const rotatingRef = usePhraseFill(phraseFill);

  return (
    <h1
      id="hero-heading"
      className={`hero-heading ${partyStyles.lightHeading}`}
      data-party-react="heading"
    >
      {/* One continuous name for crawlers and screen readers. The rotation is visual only. */}
      <span className="sr-only">{content.label}</span>
      <span className="hero-heading-line" aria-hidden="true">
        {content.start}{" "}
        <span ref={rotatingRef} className="hero-heading-rotating">
          {reducedMotion ? (
            <span className="text-rotate-element">{content.rotating[0]}</span>
          ) : (
            <RotatingText
              texts={content.rotating}
              auto={!reducedMotion && !partying}
              rotationInterval={2500}
              staggerFrom="first"
              staggerDuration={0.025}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-120%" }}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              splitLevelClassName="hero-heading-rotating-word"
              onNext={setIndex}
            />
          )}
        </span>
      </span>
      <span className="hero-heading-line" aria-hidden="true">
        {content.end}
      </span>
      <PartyHeadingLight
        text={
          <>
            <span className="hero-heading-line">
              {content.start}{" "}
              <span className="hero-heading-rotating">
                {content.rotating[index]}
              </span>
            </span>
            <span className="hero-heading-line">{content.end}</span>
          </>
        }
      />
    </h1>
  );
}

// Mor's cutout beside the service line, phones only (see wireframe.css).
export function HeroAvatar() {
  return (
    <span className="hero-avatar" aria-hidden="true">
      <Image
        src="/images/mor-avatar-cutout.webp"
        alt=""
        width={600}
        height={600}
        sizes="64px"
      />
    </span>
  );
}
