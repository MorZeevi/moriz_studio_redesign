import type { SiteContent } from "@/i18n/dictionaries";

export function HeroDescription({
  content,
  className,
}: {
  content: SiteContent["hero"]["description"];
  className?: string;
}) {
  return (
    <p className={className}>
      <span className="hero-description-line">
        <strong>{content.emphasis}</strong>
      </span>{" "}
      <span className="hero-description-line">{content.firstLine}</span>{" "}
      <span className="hero-description-line">{content.secondLine}</span>{" "}
      <span className="hero-description-line">{content.thirdLine}</span>
    </p>
  );
}
