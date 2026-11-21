"use client";

import { useEffect, useRef } from "react";
import partyStyles from "@/components/party-mode/party-mode.module.css";
import { PartyHeadingLight } from "@/components/party-mode/party-heading-light";
import type { SiteContent } from "@/i18n/dictionaries";

export function HeroHeading({
  content,
}: {
  content: SiteContent["hero"]["heading"];
}) {
  const heading = useRef<HTMLHeadingElement>(null);

  // A light follows the pointer inside the letters, like the one in the
  // header menu. Desktop pointers only; it eases toward the pointer.
  useEffect(() => {
    const element = heading.current;
    if (!element) return;
    const desktop = window.matchMedia(
      "(min-width: 64rem) and (hover: hover) and (pointer: fine)",
    );
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let inside = false;
    let px = 0;
    let py = 0;
    let gx = 0;
    let gy = 0;

    function paint() {
      // Each painted run of text: the services line and both headline halves.
      const lines = element?.querySelectorAll<HTMLElement>(
        "[data-hero-light-run]",
      );
      for (const line of lines ?? []) {
        const box = line.getBoundingClientRect();
        line.style.setProperty("--hero-light-x", `${gx - box.left}px`);
        line.style.setProperty("--hero-light-y", `${gy - box.top}px`);
      }
    }

    function tick() {
      gx += (px - gx) * 0.18;
      gy += (py - gy) * 0.18;
      paint();
      frame =
        inside && Math.abs(px - gx) + Math.abs(py - gy) > 0.5
          ? requestAnimationFrame(tick)
          : 0;
    }

    function track(event: PointerEvent) {
      if (
        event.pointerType === "touch" ||
        !desktop.matches ||
        reducedMotion.matches
      )
        return;
      px = event.clientX;
      py = event.clientY;
      if (!inside) {
        gx = px;
        gy = py;
      }
      inside = true;
      element?.setAttribute("data-hero-light", "");
      if (!frame) frame = requestAnimationFrame(tick);
    }

    function leave() {
      inside = false;
      element?.removeAttribute("data-hero-light");
    }

    element.addEventListener("pointerenter", track);
    element.addEventListener("pointermove", track);
    element.addEventListener("pointerleave", leave);
    element.addEventListener("pointercancel", leave);
    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener("pointerenter", track);
      element.removeEventListener("pointermove", track);
      element.removeEventListener("pointerleave", leave);
      element.removeEventListener("pointercancel", leave);
    };
  }, []);

  const text = (
    <>
      <span className="hero-heading-line hero-heading-split">
        <span className="hero-heading-outline" data-hero-light-run>
          {content.endParts[0]}
        </span>{" "}
        <span className="hero-heading-fill" data-hero-light-run>
          {content.endParts[1]}
        </span>
      </span>
      {content.start ? (
        <>
          {" "}
          <span
            className="hero-heading-line hero-heading-accent"
            data-hero-light-run
          >
            {content.start}
          </span>
        </>
      ) : null}
    </>
  );

  return (
    <h1
      ref={heading}
      id="hero-heading"
      className={`hero-heading ${partyStyles.lightHeading}`}
      data-party-react="heading"
    >
      {text}
      <PartyHeadingLight text={text} />
    </h1>
  );
}
