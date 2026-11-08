import "server-only";
import { connection } from "next/server";
import {
  type ServiceDocument,
  services,
  servicesChrome,
} from "@/content/services";
import type { EnabledLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getPublishedArticles } from "@/lib/articles/load";
import { localized } from "@/lib/cms/localize";
import { getPublicProjects } from "@/lib/cms/queries";
import { projectSnippetInput } from "@/lib/project-snippet";
import { projectSearchDescription } from "@/lib/seo";
import { serviceStructuredData } from "@/lib/services/structured-data";

export type ServiceLink = {
  href: string;
  title: string;
  description?: string;
};

// Titles of projects that are on the public site today. Used only when the
// CMS cannot be read, so the page still links to real work.
const fallbackTitles: Record<string, string> = {
  guesto: "Guesto",
  "chabad-club": "חב״ד קלאב",
  practicalai: "AI פרקטי",
  awscience: "Awescience",
  hatchly: "Hatchly",
  וורדעל: "וורדעל",
};

async function loadProjects(
  slugs: string[],
  locale: EnabledLocale,
): Promise<ServiceLink[]> {
  const published = await getPublicProjects("projects").catch(
    (error: unknown) => {
      console.error("Service page projects unavailable.", error);
      return null;
    },
  );
  if (!published) {
    return slugs.flatMap((slug) => {
      const title = fallbackTitles[slug];
      if (!title) return [];
      return [{ href: `/${locale}/projects/${slug}`, title }];
    });
  }
  return slugs.flatMap((slug) => {
    const project = published.find((item) => item.slug === slug);
    if (!project?.slug) return [];
    const title = localized(project, "title", locale).trim();
    if (!title) return [];
    const description = projectSearchDescription(
      projectSnippetInput(project, locale),
    );
    return [
      {
        href: `/${locale}/projects/${project.slug}`,
        title,
        ...(description ? { description } : {}),
      },
    ];
  });
}

function loadArticles(slugs: string[], locale: EnabledLocale): ServiceLink[] {
  const published = new Map(
    getPublishedArticles().map((article) => [article.slug, article]),
  );
  return slugs.flatMap((slug) => {
    const article = published.get(slug);
    if (!article) return [];
    return [
      {
        href: `/${locale}/articles/${article.slug}`,
        title: article.title,
        description: article.description,
      },
    ];
  });
}

export async function loadServicePage(
  page: ServiceDocument,
  locale: EnabledLocale,
) {
  // Opt into request-time rendering before the CMS call. Catching the
  // connection() signal would hide it and log a false outage at build time.
  await connection();
  const bySlug = new Map(
    services.flatMap((service) =>
      service.slug ? [[service.slug, service] as const] : [],
    ),
  );
  const [content, projects] = await Promise.all([
    getDictionary(locale),
    loadProjects(page.projectSlugs, locale),
  ]);
  const articles = loadArticles(page.articleSlugs, locale);
  const related = page.relatedSlugs.flatMap((slug) => {
    const service = bySlug.get(slug);
    if (!service) return [];
    return [
      {
        href: `/${locale}${service.path}`,
        title: service.heading,
        description: service.description,
      },
    ];
  });
  const catalog = page.showCatalog
    ? services.map((service) => ({
        href: `/${locale}${service.path}`,
        title: service.heading,
        description: service.description,
      }))
    : [];
  return {
    projects,
    articles,
    related,
    catalog,
    content,
    data: serviceStructuredData({
      locale,
      studioName: content.studioName,
      servicesLabel: servicesChrome.label,
      page,
      catalog: page.showCatalog ? [...services] : [],
    }),
  };
}
