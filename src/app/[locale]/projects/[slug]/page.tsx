import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/components/projects.module.css";
import {
  ProjectAccordion,
  ProjectArrow,
  ProjectMedia,
} from "@/components/projects-section";
import { FloatingWhatsApp } from "@/components/wireframe";
import { isEnabledLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

type ProjectParams = { params: Promise<{ locale: string; slug: string }> };

async function getProject(params: ProjectParams["params"]) {
  const { locale, slug } = await params;
  if (!isEnabledLocale(locale)) notFound();
  const content = await getDictionary(locale);
  const project = content.projects.items.find((item) => item.slug === slug);
  if (!project) notFound();
  return { locale, content, project };
}

export async function generateStaticParams({
  params,
}: {
  params: { locale: string };
}) {
  if (!isEnabledLocale(params.locale)) return [];
  const content = await getDictionary(params.locale);
  return content.projects.items.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: ProjectParams): Promise<Metadata> {
  const { content, project } = await getProject(params);
  return {
    title: `${project.title} | ${content.studioName}`,
    description: project.description ?? content.projects.descriptionPlaceholder,
  };
}

export default async function ProjectPage({ params }: ProjectParams) {
  const { locale, content, project } = await getProject(params);
  const projectsHref = `/${locale}#projects`;
  return (
    <div className={styles.projectPage}>
      <a
        href="#project-content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-5 focus:top-5 focus:z-30 focus:bg-background focus:p-4 focus:text-dark"
      >
        {content.skipToContent}
      </a>
      <div className="site-container">
        <header className={styles.pageHeader}>
          <Link href={`/${locale}`} className={styles.wordmark}>
            <bdi>{content.studioName}</bdi>
          </Link>
          <Link href={projectsHref} className={styles.backLink}>
            <ProjectArrow back />
            {content.projects.backLink}
          </Link>
        </header>
        <main id="project-content">
          <div className={styles.pageIntro}>
            <h1 className={styles.pageTitle}>
              <bdi>{project.title}</bdi>
            </h1>
            <p className={styles.pageDescription}>
              {project.description ?? content.projects.descriptionPlaceholder}
            </p>
          </div>
          <ProjectMedia
            project={project}
            label={content.projects.visualLabel}
            large
          />
          <section
            className={styles.pageDetails}
            aria-labelledby="project-details-heading"
          >
            <h2 id="project-details-heading" className={styles.detailsHeading}>
              {content.projects.detailsHeading}
            </h2>
            <div>
              <p className={styles.contribution}>
                {project.contribution ??
                  content.projects.contributionPlaceholder}
              </p>
              <ProjectAccordion
                project={project}
                labels={content.projects}
                group={`page-${project.slug}`}
              />
            </div>
          </section>
        </main>
        <footer className={styles.pageFooter}>
          <Link href={projectsHref} className={styles.backLink}>
            <ProjectArrow back />
            {content.projects.backLink}
          </Link>
        </footer>
      </div>
      <FloatingWhatsApp labels={content.whatsapp} />
    </div>
  );
}
