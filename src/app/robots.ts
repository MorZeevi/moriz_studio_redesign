import type { MetadataRoute } from "next";
import { isIndexable, SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Preview deployments must never compete with the live site.
  if (!isIndexable) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /media stays crawlable: it serves the project and social images.
      disallow: [
        "/admin",
        "/api/",
        "/digital-audit",
        "/he/fonts",
        "/he/articles/preview",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
