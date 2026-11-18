import type { Metadata } from "next";
import type { ServiceDocument } from "@/content/services";
import type { EnabledLocale } from "@/i18n/config";
import { pageAlternates } from "@/lib/seo";
import { openGraphFor } from "@/lib/site";

export function serviceDocumentTitle(title: string, studioName: string) {
  return `${title} | ${studioName}`;
}

/**
 * Service pages exist in every enabled locale at the same path, so the
 * alternates list each locale (x-default: Hebrew) and Open Graph follows the
 * page locale.
 */
export function serviceMetadata(
  locale: EnabledLocale,
  page: ServiceDocument,
  studioName: string,
): Metadata {
  const title = serviceDocumentTitle(page.title, studioName);
  const url = `/${locale}${page.path}`;
  const openGraph = openGraphFor(locale);
  return {
    title: { absolute: title },
    description: page.description,
    keywords: [page.keyword],
    alternates: pageAlternates(url),
    openGraph: { ...openGraph, title, description: page.description, url },
    twitter: {
      card: "summary_large_image",
      title,
      description: page.description,
      images: [openGraph.images[0].url],
    },
  };
}
