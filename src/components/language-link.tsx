"use client";

import { type MouseEvent, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  type EnabledLocale,
  isEnabledLocale,
  isLinkAvailable,
} from "@/i18n/config";
import type { SiteContent } from "@/i18n/dictionaries";

/**
 * The same page in `target`: swaps the first path segment and keeps the rest,
 * the query string and the hash. A page the target language does not have
 * (the Hebrew-only articles) leads to the target homepage instead.
 */
export function languageSwitchHref(
  pathname: string,
  target: EnabledLocale,
  suffix = "",
) {
  const segments = pathname.split("/");
  if (!segments[1] || !isEnabledLocale(segments[1])) return `/${target}`;
  segments[1] = target;
  const path = segments.join("/");
  if (!isLinkAvailable(path, target)) return `/${target}`;
  return `${path}${suffix}`;
}

/**
 * Language toggle (EN on Hebrew pages, HE on English pages). A plain anchor,
 * so the switch is a full page load: `<html lang dir>`, the theme script and
 * the scroll animations all start clean in the new direction.
 */
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
  const pathname = usePathname() ?? `/${locale}`;
  // The server render has no query string; add it once the page is live.
  const [suffix, setSuffix] = useState("");
  useEffect(() => {
    setSuffix(window.location.search + window.location.hash);
  }, []);
  const href = available
    ? languageSwitchHref(pathname, language, suffix)
    : undefined;

  // The URL may have changed since mount (a filter, an in-page anchor).
  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!available) return;
    event.currentTarget.href = languageSwitchHref(
      window.location.pathname,
      language,
      window.location.search + window.location.hash,
    );
  }

  return (
    <a
      className="language-link"
      role={available ? undefined : "link"}
      href={href}
      hrefLang={available ? language : undefined}
      onClick={onClick}
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
