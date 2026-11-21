"use client";

import partyStyles from "@/components/party-mode/party-mode.module.css";
import { PartyHeadingLight } from "@/components/party-mode/party-heading-light";
import type { SiteContent } from "@/i18n/dictionaries";

export function HeroHeading({
  content,
}: {
  content: SiteContent["hero"]["heading"];
}) {
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
      id="hero-heading"
      className={`hero-heading ${partyStyles.lightHeading}`}
      data-party-react="heading"
    >
      {text}
      <PartyHeadingLight text={text} />
    </h1>
  );
}
