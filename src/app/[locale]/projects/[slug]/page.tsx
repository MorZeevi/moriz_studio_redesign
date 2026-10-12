import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectDetail } from "@/components/project-detail";
import { isEnabledLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getPublicProject } from "@/lib/cms/queries";
import type { ProjectContentBlock } from "@/types/project";

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
export default async function ProjectPage({
  params,
  searchParams,
}: PageParams & {
  searchParams: Promise<{ gallery?: string }>;
}) {
  const data = await load(params);
  const demo =
    process.env.NODE_ENV === "development" &&
    (await searchParams).gallery === "demo6";
  if (demo && data.project.cover_image_url) {
    const image = {
      src: data.project.cover_image_url,
      alt: data.project.title,
    };
    // Local presentation demo; the saved CMS content is never changed.
    const content: ProjectContentBlock[] = [
      ...data.project.content.filter((block) => block.type === "text"),
      { type: "image", ...image },
      { type: "image", ...image, layout: "center", spacing: "extra" },
      {
        type: "two_images",
        images: [{ ...image }, { ...image }],
        layout: "staggered",
        spacing: "extra",
      },
      { type: "image", ...image, layout: "end", spacing: "extra" },
      { type: "image", ...image, layout: "full", spacing: "extra" },
    ];
    data.project = { ...data.project, content };
  }
  return <ProjectDetail {...data} />;
}
