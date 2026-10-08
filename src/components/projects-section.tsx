import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/content/projects";
import type { EnabledLocale } from "@/i18n/config";
import type { SiteContent } from "@/i18n/dictionaries";
import { PartyHeadingLight } from "./party-mode/party-heading-light";
import partyStyles from "./party-mode/party-mode.module.css";
import { ProjectScrollSurface } from "./project-scroll-surface";
import styles from "./projects.module.css";

type ProjectLabels = SiteContent["projects"];

export function ProjectArrow({ back = false }: { back?: boolean }) {
  return (
    <svg
      className={back ? styles.backArrow : styles.arrow}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M19 12H5m7-7-7 7 7 7" />
    </svg>
  );
}

export function ProjectMedia({
  project,
  label,
  large = false,
}: {
  project: Project;
  label: string;
  large?: boolean;
}) {
  return (
    <div className={styles.media}>
      {project.image ? (
        <Image
          src={project.image.src}
          alt={project.image.alt}
          fill
          sizes={
            large
              ? "(min-width: 1440px) 1344px, 94vw"
              : "(min-width: 960px) 54vw, 94vw"
          }
          className={styles.image}
        />
      ) : (
        <div className={styles.mediaPlaceholder}>
          <span>{label}</span>
        </div>
      )}
    </div>
  );
}

export function ProjectAccordion({
  project,
  labels,
  group,
}: {
  project: Project;
  labels: ProjectLabels;
  group: string;
}) {
  return (
    <div className={styles.accordion}>
      {project.details.map((detail) => (
        <details key={detail.id} name={group} className={styles.detail}>
          <summary className={styles.question}>
            <span>{detail.question}</span>
            <svg
              className={styles.plus}
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M2 8h12" />
              <path className={styles.plusStem} d="M8 2v12" />
            </svg>
          </summary>
          <p className={styles.answer}>
            {detail.answer ?? labels.answerPlaceholder}
          </p>
        </details>
      ))}
    </div>
  );
}

export function ProjectsSection({
  locale,
  content,
  collection = false,
  partyReaction = false,
}: {
  locale: EnabledLocale;
  content: ProjectLabels;
  collection?: boolean;
  partyReaction?: boolean;
}) {
  const Heading = collection ? "h1" : "h2";
  const contents = (
    <div className="site-container">
      <div className={styles.sectionHeader}>
        <Heading
          id="projects-heading"
          className={`${styles.heading}${partyReaction ? ` ${partyStyles.lightHeading}` : ""}`}
          data-party-react={partyReaction ? "heading" : undefined}
        >
          {collection ? content.allHeading : content.heading}
          {partyReaction && <PartyHeadingLight text={content.heading} />}
        </Heading>
        {!collection && (
          <Link
            href={`/${locale}/projects`}
            className={`${styles.projectLink} ${styles.allProjectsLink}`}
          >
            {content.allLink}
            <ProjectArrow />
          </Link>
        )}
      </div>
      <div className={styles.list}>
        {content.items.map((project) => (
          <article
            key={project.slug}
            className={styles.row}
            aria-labelledby={`project-${project.slug}`}
          >
            <h3 id={`project-${project.slug}`} className={styles.title}>
              <bdi>{project.title}</bdi>
            </h3>
            <ProjectMedia project={project} label={content.visualLabel} />
            <div className={styles.information}>
              <p className={styles.description}>
                {project.description ?? content.descriptionPlaceholder}
              </p>
              <p className={styles.contribution}>
                {project.contribution ?? content.contributionPlaceholder}
              </p>
              <div className={styles.rowDetails}>
                <ProjectAccordion
                  project={project}
                  labels={content}
                  group={`home-${project.slug}`}
                />
                <Link
                  href={`/${locale}/projects/${project.slug}`}
                  className={styles.projectLink}
                  aria-label={`${content.projectLink}: ${project.title}`}
                >
                  {content.projectLink}
                  <ProjectArrow />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
  return collection ? (
    <section
      id="projects"
      aria-labelledby="projects-heading"
      className={styles.section}
    >
      {contents}
    </section>
  ) : (
    <ProjectScrollSurface>{contents}</ProjectScrollSurface>
  );
}
