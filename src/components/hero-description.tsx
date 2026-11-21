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
      <strong>{content.emphasis}</strong> {content.body}
    </p>
  );
}
