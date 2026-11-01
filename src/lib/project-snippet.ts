import type { Locale } from "@/i18n/config";
import { projectCopy } from "@/i18n/project-copy";
import { userCountHighlight } from "@/lib/cms/card-options";
import { localized, termName } from "@/lib/cms/localize";
import type { ProjectSnippetFields } from "@/lib/seo";
import type { Project, ProjectContentBlock } from "@/types/project";

function blockPassages(block: ProjectContentBlock, locale: Locale) {
  if (block.type !== "text" || block.hidden) return [];
  return [
    localized(block, "text", locale),
    ...(block.subsections ?? []).map((subsection) =>
      localized(subsection, "text", locale),
    ),
  ];
}

/** Every stored string a project snippet is allowed to use. */
export function projectSnippetInput(
  project: Project,
  locale: Locale,
): ProjectSnippetFields {
  const categories = project.categories
    .map((category) => termName(category, locale))
    .filter(Boolean);
  const users = userCountHighlight(project.highlights)?.value.trim() ?? "";
  return {
    seo: localized(project, "seo_description", locale),
    headline: localized(project, "headline", locale),
    short: localized(project, "short_description", locale),
    body: localized(project, "description", locale),
    archive: localized(project, "archive_description", locale),
    audience: [
      localized(project, "target_audience", locale),
      localized(project, "audience_description", locale),
    ]
      .filter((part) => part.trim())
      .join("\n\n"),
    passages: [
      ...project.content.flatMap((block) => blockPassages(block, locale)),
      ...project.highlights.map((highlight) =>
        localized(highlight, "description", locale),
      ),
    ],
    facts: [
      localized(project, "role", locale),
      project.type ? termName(project.type, locale) : "",
      categories.join(", "),
      localized(project, "client", locale),
      project.year ? String(project.year) : "",
      users ? `${users} ${projectCopy[locale].users}` : "",
    ],
  };
}
