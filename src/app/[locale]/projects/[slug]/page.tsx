import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { ProjectDetail } from "@/components/project-detail";
import { isEnabledLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { localized } from "@/lib/cms/localize";
import { getNextProject, getPublicProject } from "@/lib/cms/queries";
import { isVideoSrc } from "@/lib/cms/validation";
import { siteOpenGraph } from "@/lib/site";
import { projectStructuredData } from "@/lib/structured-data";
import type { Project, ProjectContentBlock } from "@/types/project";

type PageParams = { params: Promise<{ locale: string; slug: string }> };
async function load(params: PageParams["params"]) {
  const { locale, slug } = await params;
  if (!isEnabledLocale(locale)) notFound();
  // Metadata can receive an encoded segment while the page receives decoded
  // params. Both must look up the same stored slug, including Hebrew URLs.
  let projectSlug: string;
  try {
    projectSlug = decodeURIComponent(slug);
  } catch {
    notFound();
  }
  const [content, project] = await Promise.all([
    getDictionary(locale),
    getPublicProject(projectSlug),
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
  const image = socialImage(project);
  const url = projectPath(locale, project.slug);
  return {
    // CMS titles already carry the studio name; skip the layout template.
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      ...siteOpenGraph,
      title,
      description,
      url,
      type: "article",
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}
// Social image: the chosen one, else the hero when it is an image.
function socialImage(project: Project) {
  return (
    project.og_image_url ??
    (project.cover_image_url && !isVideoSrc(project.cover_image_url)
      ? project.cover_image_url
      : null)
  );
}
function projectPath(locale: string, slug: string | null) {
  return `/${locale}/projects/${encodeURIComponent(slug ?? "")}`;
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
  const nextProject = await getNextProject(data.project);
  const { locale, content, project } = data;
  return (
    <>
      <JsonLd
        data={projectStructuredData({
          content,
          locale,
          slug: project.slug ?? "",
          name: localized(project, "title", locale),
          description:
            localized(project, "short_description", locale) || undefined,
          image: socialImage(project),
        })}
      />
      <ProjectDetail {...data} nextProject={nextProject} />
    </>
  );
}
