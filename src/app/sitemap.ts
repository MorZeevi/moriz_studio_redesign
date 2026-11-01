import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { defaultLocale } from "@/i18n/config";
import { he } from "@/i18n/dictionaries/he";
import { articleInstant } from "@/lib/articles/format";
import { getPublishedArticles } from "@/lib/articles/load";
import { getSitemapProjects } from "@/lib/cms/queries";
import { publicSitemapEntries } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

// Rendered per request, like the project pages, so new projects appear as
// soon as they are published. Draft articles stay out: getPublishedArticles
// already drops them.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  // A CMS outage must not fail the build or drop the static pages.
  const projects = await getSitemapProjects().catch((error: unknown) => {
    console.error("Sitemap projects unavailable.", error);
    return [];
  });
  return publicSitemapEntries({
    siteUrl: SITE_URL,
    locale: defaultLocale,
    projects,
    articles: getPublishedArticles().map((article) => ({
      slug: article.slug,
      updatedAt: articleInstant(article.updated ?? article.date),
    })),
    privacyUpdatedOn: he.privacyPolicy.updatedOn,
  });
}
