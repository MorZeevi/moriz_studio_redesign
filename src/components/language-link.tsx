import { isEnabledLocale, type EnabledLocale } from "@/i18n/config";
import type { SiteContent } from "@/i18n/dictionaries";

export function LanguageLink({
  locale,
  content,
}: {
  locale: EnabledLocale;
  content: SiteContent["navigation"]["languages"];
}) {
  const language = locale === "he" ? "en" : "he";
  const available = isEnabledLocale(language);
  const labels = content[language];

  return (
    <a
      className="language-link"
      role={available ? undefined : "link"}
      href={available ? `/${language}` : undefined}
      aria-disabled={available ? undefined : true}
      aria-label={available ? labels.label : labels.unavailableLabel}
      title={available ? labels.label : labels.unavailableLabel}
    >
      <bdi lang={language} dir="ltr">
        {labels.shortLabel}
      </bdi>
    </a>
  );
}
