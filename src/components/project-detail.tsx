import Link from "next/link";
import { CategoryTags } from "@/components/category-tags";
import { ProjectArrow } from "@/components/projects-section";
import { ProjectGallery } from "@/components/project-gallery";
import { FloatingActions } from "@/components/floating-actions";
import { ThemeToggle } from "@/components/theme-toggle";
import type { EnabledLocale } from "@/i18n/config";
import type { SiteContent } from "@/i18n/dictionaries";
import type { Project } from "@/types/project";
import { localeConfig } from "@/i18n/config";
import { projectGallery, projectInformation } from "@/lib/project-presentation";
import styles from "./projects.module.css";
import detail from "./project-detail.module.css";

export function ProjectDetail({
  project,
  locale,
  content,
  preview = false,
}: {
  project: Project;
  locale: EnabledLocale;
  content: SiteContent;
  preview?: boolean;
}) {
  const Main = preview ? "section" : "main";
  const back = `/${locale}#projects`;
  const labels = content.projects.caseStudy;
  const information = projectInformation(
    project,
    content.projects.detailsHeading,
    labels.additionalInfo,
  );
  const gallery = projectGallery(project);
  const intro = project.headline || project.short_description;
  return (
    <div
      className={detail.page}
      dir={localeConfig[locale].direction}
      data-project-detail
    >
      <div className="site-container">
        <Main id="project-content" tabIndex={-1} className={detail.composition}>
          <aside
            className={detail.panel}
            aria-label={content.projects.detailsHeading}
          >
            {!preview && (
              <div className={detail.panelNavigation}>
                <Link href={back} className={styles.backLink}>
                  <ProjectArrow back />
                  {content.projects.backLink}
                </Link>
                <ThemeToggle labels={content.theme} />
              </div>
            )}
            <h1 className={detail.title}>
              <bdi>{project.title}</bdi>
            </h1>
            {intro && <p className={detail.intro}>{intro}</p>}
            {project.headline &&
              project.short_description &&
              project.headline !== project.short_description && (
                <p className={detail.intro}>{project.short_description}</p>
              )}
            {(project.client || project.year) && (
              <dl className={detail.metadata}>
                {project.client && (
                  <div>
                    <dt>{labels.client}</dt>
                    <dd>
                      <bdi>{project.client}</bdi>
                    </dd>
                  </div>
                )}
                {project.year && (
                  <div>
                    <dt>{labels.year}</dt>
                    <dd>
                      <bdi>{project.year}</bdi>
                    </dd>
                  </div>
                )}
              </dl>
            )}
            <CategoryTags categories={project.categories} />
            {!!project.services.length && (
              <p className={detail.services}>
                <span className="sr-only">{labels.services}: </span>
                {project.services.join(" · ")}
              </p>
            )}
            {information.map((section, index) => (
              <details
                key={`${project.id}-${section.id}`}
                className={detail.accordion}
                name={`project-${project.id}`}
                open={index === 0}
              >
                <summary className={detail.summary}>
                  <span className={detail.number} aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2>{section.title}</h2>
                  <span className={detail.plus} aria-hidden="true">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M2 8h12" />
                      <path className={detail.vertical} d="M8 2v12" />
                    </svg>
                  </span>
                </summary>
                <p className={detail.answer}>{section.text}</p>
              </details>
            ))}
          </aside>
          <ProjectGallery key={project.id} {...gallery} labels={labels} />
          {!preview && (
            <footer className={detail.footer}>
              <Link href={back} className={styles.backLink}>
                <ProjectArrow back />
                {content.projects.backLink}
              </Link>
            </footer>
          )}
        </Main>
      </div>
      {!preview && (
        <FloatingActions
          content={content.floatingActions}
          ask={content.askAi}
          compactOnMobile
        />
      )}
    </div>
  );
}
