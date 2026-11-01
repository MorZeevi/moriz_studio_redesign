import type { EnabledLocale, Locale } from "@/i18n/config";
import { projectCard } from "@/lib/cms/project-card";
import { getPublicProject } from "@/lib/cms/queries";
import { getArticle } from "./load.ts";
import {
  teaserFromProjectsHtml,
  type ProjectTeaser,
} from "./project-teaser.ts";
import type { Article } from "./schema.ts";
import { canViewArticle } from "./view.ts";

export type { ProjectTeaser };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type ArticleTeaser = {
  title: string;
  description: string;
  href: string;
};

export type ArticleEmbeds = {
  /** `null` means the slug is not a published project. `"unavailable"` means the CMS could not be read. */
  projects: Map<string, ProjectTeaser | "unavailable" | null>;
  articles: Map<string, ArticleTeaser>;
};

export async function loadArticleEmbeds(
  article: Article,
  locale: EnabledLocale,
  preview: boolean,
): Promise<ArticleEmbeds> {
  const projects = new Map<string, ProjectTeaser | "unavailable" | null>();
  for (const slug of componentSlugs(article.body, "ProjectCard")) {
    projects.set(slug, await projectTeaser(slug, locale));
  }
  const articles = new Map<string, ArticleTeaser>();
  for (const slug of componentSlugs(article.body, "RelatedArticle")) {
    const teaser = articleTeaser(slug, locale, preview);
    if (teaser) articles.set(slug, teaser);
  }
  return { projects, articles };
}

export function componentSlugs(body: string, name: "ProjectCard" | "RelatedArticle") {
  const found = new Set<string>();
  for (const match of body.matchAll(
    new RegExp(`<${name}\\b[^>]*slug\\s*=\\s*["']([^"']+)["']`, "g"),
  )) {
    if (SLUG.test(match[1])) found.add(match[1]);
  }
  return [...found];
}

async function projectTeaser(
  slug: string,
  locale: EnabledLocale,
): Promise<ProjectTeaser | "unavailable" | null> {
  if (!cmsConfigured()) {
    return (await devProjectTeaser(slug, locale)) ?? "unavailable";
  }
  try {
    const project = await getPublicProject(slug);
    if (!project?.slug) return null;
    return teaserFromCard(
      projectCard(project, "projects", locale as Locale),
      locale,
    );
  } catch (error) {
    if (isFrameworkSignal(error)) throw error;
    return (await devProjectTeaser(slug, locale)) ?? "unavailable";
  }
}

function teaserFromCard(
  card: ReturnType<typeof projectCard>,
  locale: EnabledLocale,
): ProjectTeaser | null {
  if (!card.slug || !card.title) return null;
  return {
    title: card.title,
    href: `/${locale}/projects/${card.slug}`,
    ...(card.image ? { image: card.image } : {}),
  };
}

function articleTeaser(
  slug: string,
  locale: EnabledLocale,
  preview: boolean,
): ArticleTeaser | null {
  const article = getArticle(slug);
  if (!article || !canViewArticle(article, preview)) return null;
  const href = `/${locale}/articles/${article.slug}`;
  return {
    title: article.title,
    description: article.description,
    href: article.draft ? `${href}?preview=1` : href,
  };
}

function cmsConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

/** Next postpones static rendering with a digest. That signal has to keep going. */
function isFrameworkSignal(error: unknown) {
  return typeof error === "object" && error !== null && "digest" in error;
}

/**
 * Development only, when the CMS is not configured: read the public projects
 * index so a local preview can show a real title and image. Production never
 * uses this. A miss stays a plain link.
 */
async function devProjectTeaser(
  slug: string,
  locale: EnabledLocale,
): Promise<ProjectTeaser | null> {
  if (process.env.NODE_ENV === "production") return null;
  try {
    const response = await fetch("https://moriz.studio/he/projects", {
      cache: "no-store",
    });
    if (!response.ok) return null;
    return teaserFromProjectsHtml(await response.text(), slug, locale);
  } catch {
    return null;
  }
}
