import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectDetail } from "@/components/project-detail";
import { isEnabledLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { localized } from "@/lib/cms/localize";
import { getNextProject, getPublicProject } from "@/lib/cms/queries";
import { isVideoSrc } from "@/lib/cms/validation";

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
  const { locale, content, project } = await load(params);
  const title =
    localized(project, "seo_title", locale) ||
    `${localized(project, "title", locale)} | ${content.studioName}`;
  const description =
    localized(project, "seo_description", locale) ||
    localized(project, "short_description", locale) ||
    localized(project, "description", locale) ||
    undefined;
  // Social image: the chosen one, else the hero when it is an image.
  const image =
    project.og_image_url ??
    (project.cover_image_url && !isVideoSrc(project.cover_image_url)
      ? project.cover_image_url
      : null);
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}
export default async function ProjectPage({ params }: PageParams) {
  const data = await load(params);
  const nextProject = await getNextProject(data.project);
  return <ProjectDetail {...data} nextProject={nextProject} />;
}
