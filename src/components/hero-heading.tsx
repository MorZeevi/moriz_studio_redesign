"use client";

import Image from "next/image";
import partyStyles from "@/components/party-mode/party-mode.module.css";
import { PartyHeadingLight } from "@/components/party-mode/party-heading-light";
import type { SiteContent } from "@/i18n/dictionaries";

export function HeroHeading({
  content,
}: {
  content: SiteContent["hero"]["heading"];
}) {
  const lines = (
    <>
      <span className="hero-heading-line">{content.first}</span>{" "}
      <span className="hero-heading-line">
        {content.second.start}{" "}
        <span className="hero-heading-accent">{content.second.accent}</span>
      </span>
    </>
  );

  return (
    <h1
      id="hero-heading"
      className={`hero-heading ${partyStyles.lightHeading}`}
      data-party-react="heading"
    >
      {/* One continuous name for crawlers and screen readers. */}
      <span className="sr-only">{content.label}</span>
      <span aria-hidden="true">{lines}</span>
      <PartyHeadingLight text={lines} />
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
