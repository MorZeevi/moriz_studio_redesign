import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectDetail } from "@/components/project-detail";
import { isEnabledLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getPublicProject } from "@/lib/cms/queries";

type PageParams = { params: Promise<{ locale: string; slug: string }> };
async function load(params: PageParams["params"]) {
  const { locale, slug } = await params;
  if (!isEnabledLocale(locale)) notFound();
  const [content, project] = await Promise.all([
    getDictionary(locale),
    getPublicProject(slug),
  ]);
  if (!project) notFound();
  return { locale, content, project };
}
export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { content, project } = await load(params);
  return {
    title: `${project.title} | ${content.studioName}`,
    description: project.short_description ?? project.description ?? undefined,
  };
}
export default async function ProjectPage({ params }: PageParams) {
  return <ProjectDetail {...(await load(params))} />;
}
