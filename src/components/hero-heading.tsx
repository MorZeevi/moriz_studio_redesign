"use client";

import Image from "next/image";
import { useState, useSyncExternalStore } from "react";
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

  return (
    <h1
      id="hero-heading"
      className={`hero-heading ${partyStyles.lightHeading}`}
      data-party-react="heading"
      // The rotation is visual only; the name lists every option.
      aria-label={content.label}
    >
      <span className="hero-heading-line">
        {content.start}{" "}
        <span className="hero-heading-rotating" aria-hidden="true">
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
        </span>
      </span>
      <span className="hero-heading-line">
        {content.end}
        <HeadingAvatar />
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
            <span className="hero-heading-line">
              {content.end}
              {/* Keeps the light copy's line width matching the live heading. */}
              <span className="hero-heading-avatar" />
            </span>
          </>
        }
      />
    </h1>
  );
}

// Phones only (see wireframe.css); the heading's aria-label carries the name.
function HeadingAvatar() {
  return (
    <span className="hero-heading-avatar" aria-hidden="true">
      <Image
        src="/images/mor-avatar-cutout.webp"
        alt=""
        width={600}
        height={600}
        sizes="64px"
        priority
      />
    </span>
  );
}
