import type { Metadata } from "next";
import type { ServiceDocument } from "@/content/services";
import type { EnabledLocale } from "@/i18n/config";
import { pageAlternates } from "@/lib/seo";
import { siteOpenGraph } from "@/lib/site";

export function serviceDocumentTitle(title: string, studioName: string) {
  return `${title} | ${studioName}`;
}

export function serviceMetadata(
  locale: EnabledLocale,
  page: ServiceDocument,
  studioName: string,
): Metadata {
  const title = serviceDocumentTitle(page.title, studioName);
  const url = `/${locale}${page.path}`;
  return {
    title: { absolute: title },
    description: page.description,
    keywords: [page.keyword],
    alternates: pageAlternates(url),
    openGraph: { ...siteOpenGraph, title, description: page.description, url },
    twitter: {
      card: "summary_large_image",
      title,
      description: page.description,
      images: [siteOpenGraph.images[0].url],
    },
  };
}
