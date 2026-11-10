import partyStyles from "@/components/party-mode/party-mode.module.css";
import { PartyHeadingLight } from "@/components/party-mode/party-heading-light";
import type { SiteContent } from "@/i18n/dictionaries";

/** One fixed promise; the closing phrase carries the accent colour. */
export function HeroHeading({
  content,
}: {
  content: SiteContent["hero"]["heading"];
}) {
  const text = (
    <>
      {content.start}{" "}
      {/* The accent keeps the earlier phrase's class so the themes still tint it. */}
      <span className="hero-heading-accent hero-heading-rotating">
        {content.accent}
      </span>
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
