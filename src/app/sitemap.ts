import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { serviceSitemapEntries } from "@/content/services";
import { enabledLocales, hasArticles } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { articleInstant } from "@/lib/articles/format";
import { getPublishedArticles } from "@/lib/articles/load";
import { getSitemapProjects } from "@/lib/cms/queries";
import { publicSitemapEntries } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

// Rendered per request, like the project pages, so new projects appear as
// soon as they are published. Draft articles stay out: getPublishedArticles
// already drops them. Every page is listed once per locale with hreflang
// alternates; the articles exist in Hebrew only and carry none.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  // A CMS outage must not fail the build or drop the static pages.
  const projects = await getSitemapProjects().catch((error: unknown) => {
    console.error("Sitemap projects unavailable.", error);
    return [];
  });
  const articles = getPublishedArticles().map((article) => ({
    slug: article.slug,
    updatedAt: articleInstant(article.updated ?? article.date),
  }));
  const perLocale = await Promise.all(
    enabledLocales.map(async (locale) => {
      const content = await getDictionary(locale);
      return publicSitemapEntries({
        siteUrl: SITE_URL,
        locale,
        projects,
        articles: hasArticles(locale) ? articles : null,
        privacyUpdatedOn: content.privacyPolicy.updatedOn,
        legal: [
          { path: "/terms-of-use", updatedOn: content.termsOfUse.updatedOn },
          {
            path: "/accessibility",
            updatedOn: content.accessibility.updatedOn,
          },
        ],
        services: serviceSitemapEntries(),
        alternateLocales: enabledLocales,
      });
    }),
  );
  return perLocale.flat();
}
