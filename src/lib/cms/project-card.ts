import type {
  ArchiveProject,
  Project as CardProject,
} from "@/content/projects";
import type { Locale } from "@/i18n/config";
import type { Project, ProjectMediaItem } from "@/types/project";
import { localized, termName } from "./localize";
import { isVideoSrc } from "./validation";

export function projectCard(
  project: Project,
  surface: "homepage" | "projects" | "cover",
  locale: Locale = "he",
): CardProject {
  const src =
    (surface === "homepage"
      ? project.homepage_image_url
      : surface === "projects"
        ? project.projects_image_url
        : null) ?? project.cover_image_url;
  const item = project.media.find((m) => m.src === src);
  const mainVideo = project.media.find(
    (m) => m.role === "main_video" && m.kind === "video",
  );
  const hover: ProjectMediaItem | undefined =
    surface === "cover"
      ? undefined
      : (project.media.find((m) =>
          surface === "homepage" ? m.hover_homepage : m.hover_projects,
        ) ??
        mainVideo ??
        (isVideoSrc(src) && src
          ? { src, kind: "video" as const, poster: item?.poster }
          : undefined));
  const title = localized(project, "title", locale);
  const alt = (item && localized(item, "alt", locale)) || title;
  const video = isVideoSrc(src) && src ? { src, poster: item?.poster } : null;
  const image =
    src && !video
      ? { src, alt }
      : video?.poster
        ? { src: video.poster, alt }
        : null;
  // The homepage shows the short description beside the title and the
  // project description under it; other cards show one description.
  const summary =
    surface === "homepage"
      ? localized(project, "short_description", locale) || null
      : undefined;
  const description =
    (surface === "projects" &&
      localized(project, "archive_description", locale)) ||
    ((surface === "cover" || surface === "homepage") &&
      localized(project, "description", locale)) ||
    (surface !== "homepage" &&
      (localized(project, "short_description", locale) ||
        localized(project, "description", locale))) ||
    null;
  const highlight =
    surface === "cover"
      ? undefined
      : project.highlights.find((h) =>
          surface === "homepage" ? h.on_homepage : h.on_archive,
        );
  return {
    id: project.id,
    slug: project.slug,
    title,
    description,
    summary,
    image,
    video,
    hoverMedia:
      hover && (hover.src !== src || hover.kind === "video")
        ? {
            src: hover.src,
            kind: hover.kind,
            poster:
              hover.poster || (hover.kind === "video" ? image?.src : undefined),
            alt: localized(hover, "alt", locale) || title,
          }
        : null,
    highlight: highlight
      ? { value: highlight.value, label: localized(highlight, "label", locale) }
      : null,
    type: project.type ? termName(project.type, locale) : null,
    details: project.content
      .flatMap((block, index) =>
        block.type === "text" &&
        block.collapsible &&
        block.title &&
        !block.hidden
          ? [
              {
                id: `block-${index}`,
                question: localized(block, "title", locale),
                answer: localized(block, "text", locale),
              },
            ]
          : [],
      )
      .slice(0, 4),
    categories: project.categories.map((c) => ({
      id: c.id,
      name: termName(c, locale),
    })),
  };
}

/** Projects-page card: the archive card plus filter and featured data. */
export function projectArchiveCard(
  project: Project,
  locale: Locale,
): ArchiveProject {
  return {
    ...projectCard(project, "projects", locale),
    id: project.id,
    href: project.slug ? `/${locale}/projects/${project.slug}` : null,
    featured: project.featured,
    year: project.year,
    categorySlugs: project.categories.map((c) => c.slug),
  };
}
