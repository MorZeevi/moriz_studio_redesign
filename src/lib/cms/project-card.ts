import type { Project as CardProject } from "@/content/projects";
import type { Project } from "@/types/project";
export function projectCard(
  project: Project,
  surface: "homepage" | "projects" | "cover",
): CardProject {
  const image =
    (surface === "homepage"
      ? project.homepage_image_url
      : surface === "projects"
        ? project.projects_image_url
        : null) ?? project.cover_image_url;
  return {
    slug: project.slug,
    title: project.title,
    description: project.short_description ?? project.description,
    contribution: project.services.length ? project.services.join(" · ") : null,
    image: image ? { src: image, alt: project.title } : null,
    details: project.content
      .flatMap((block, index) =>
        block.type === "text" && block.collapsible && block.title
          ? [
              {
                id: `block-${index}`,
                question: block.title,
                answer: block.text,
              },
            ]
          : [],
      )
      .slice(0, 4),
    categories: project.categories,
  };
}
