import { connection } from "next/server";
import { defaultLocale } from "@/i18n/config";
import { he } from "@/i18n/dictionaries/he";
import { getPublishedArticles } from "@/lib/articles/load";
import { localized } from "@/lib/cms/localize";
import { getPublicProjects } from "@/lib/cms/queries";
import { renderLlmsTxt } from "@/lib/llms";
import { projectSnippetInput } from "@/lib/project-snippet";
import { projectSearchDescription } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { WHATSAPP_URL } from "@/lib/whatsapp";
import type { Project } from "@/types/project";

async function publishedProjects(): Promise<Project[]> {
  const load = (surface: "projects" | "homepage") =>
    getPublicProjects(surface).catch((error: unknown) => {
      console.error(`llms.txt ${surface} projects unavailable.`, error);
      return [] as Project[];
    });
  const [archive, home] = await Promise.all([
    load("projects"),
    load("homepage"),
  ]);
  const seen = new Set<string>();
  const projects: Project[] = [];
  for (const project of [...archive, ...home]) {
    if (!project.slug || seen.has(project.id)) continue;
    seen.add(project.id);
    projects.push(project);
  }
  return projects;
}

export async function GET() {
  await connection();
  const projects = await publishedProjects();
  const text = renderLlmsTxt({
    content: he,
    siteUrl: SITE_URL,
    locale: defaultLocale,
    whatsappUrl: WHATSAPP_URL,
    projects: projects.map((project) => ({
      title: localized(project, "title", defaultLocale),
      slug: project.slug ?? "",
      description: projectSearchDescription(
        projectSnippetInput(project, defaultLocale),
      ),
    })),
    articles: getPublishedArticles().map((article) => ({
      title: article.title,
      slug: article.slug,
      description: article.description,
    })),
  });
  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
