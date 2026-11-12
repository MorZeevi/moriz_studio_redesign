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
      {content.map((point) => (
        <span key={point.emphasis} className="hero-description-line">
          <strong>{point.emphasis}</strong> {point.text}
        </span>
      ))}
    </p>
  );
}
