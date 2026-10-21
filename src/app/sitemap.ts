import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { defaultLocale } from "@/i18n/config";
import { getSitemapProjects } from "@/lib/cms/queries";
import { SITE_URL } from "@/lib/site";

// Rendered per request, like the project pages, so new projects appear as
// soon as they are published.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const base = `${SITE_URL}/${defaultLocale}`;
  const pages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/projects`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/privacy-policy`, changeFrequency: "yearly", priority: 0.2 },
  ];
  // A CMS outage must not fail the build or drop the static pages.
  const projects = await getSitemapProjects().catch((error: unknown) => {
    console.error("Sitemap projects unavailable.", error);
    return [];
  });
  return [
    ...pages,
    ...projects.map((p) => ({
      url: `${base}/projects/${encodeURIComponent(p.slug)}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
