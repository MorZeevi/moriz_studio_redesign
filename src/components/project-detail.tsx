import Link from "next/link";
import { CategoryTags } from "@/components/category-tags";
import { StudioLogo } from "@/components/studio-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProjectContent } from "@/components/project-content";
import { ProjectArrow, ProjectMedia } from "@/components/projects-section";
import { FloatingActions } from "@/components/floating-actions";
import type { EnabledLocale } from "@/i18n/config";
import type { SiteContent } from "@/i18n/dictionaries";
import type { Project } from "@/types/project";
import { projectCard } from "@/lib/cms/project-card";
import styles from "./projects.module.css";

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
  return (
    <div className={styles.projectPage}>
      <div className="site-container">
        {!preview && (
          <header className={styles.pageHeader}>
            <StudioLogo
              name={content.studioName}
              locale={locale}
              className={styles.wordmark}
            />
            <div className="project-header-actions">
              <ThemeToggle labels={content.theme} />
              <Link href={back} className={styles.backLink}>
                <ProjectArrow back />
                {content.projects.backLink}
              </Link>
            </div>
          </header>
        )}
        <Main id="project-content" tabIndex={-1}>
          <div className={styles.pageIntro}>
            <h1 className={styles.pageTitle}>
              <bdi>{project.title}</bdi>
            </h1>
            {project.headline && (
              <p className={styles.pageDescription}>{project.headline}</p>
            )}
            {(project.description || project.short_description) && (
              <p className={styles.pageDescription}>
                {project.description || project.short_description}
              </p>
            )}
            {(project.client || project.year) && (
              <p>
                {[project.client, project.year].filter(Boolean).join(" · ")}
              </p>
            )}
            <CategoryTags categories={project.categories} />
            {!!project.services.length && (
              <p className={styles.contribution}>
                {project.services.join(" · ")}
              </p>
            )}
          </div>
          <ProjectMedia
            project={projectCard(project, "cover")}
            label={content.projects.visualLabel}
            large
          />
          <section
            className={styles.pageDetails}
            aria-label={content.projects.detailsHeading}
          >
            <h2 className={styles.detailsHeading}>
              {content.projects.detailsHeading}
            </h2>
            <ProjectContent
              blocks={project.content}
              group={`page-${project.id}`}
            />
          </section>
        </Main>
        {!preview && (
          <footer className={styles.pageFooter}>
            <Link href={back} className={styles.backLink}>
              <ProjectArrow back />
              {content.projects.backLink}
            </Link>
          </footer>
        )}
      </div>
      {!preview && (
        <FloatingActions
          content={content.floatingActions}
          ask={content.askAi}
        />
      )}
    </div>
  );
}
