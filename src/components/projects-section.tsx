import Image from "next/image";
import { type CSSProperties, Fragment } from "react";
import type { Project } from "@/content/projects";
import { type Locale, localeConfig } from "@/i18n/config";
import type { SiteContent } from "@/i18n/dictionaries";
import { PartyHeadingLight } from "./party-mode/party-heading-light";
import { LiquidLink } from "./ui/liquid-link";
import partyStyles from "./party-mode/party-mode.module.css";
import { ProjectMediaLink, ProjectMediaSoon } from "./project-media-link";
import { ProjectScrollSurface } from "./project-scroll-surface";
import styles from "./projects.module.css";
import { CategoryTags } from "./category-tags";
import Noise from "./react-bits/Noise";
import { CoverVideo } from "./cover-video";
import { ProjectHoverMedia } from "./project-hover-media";
import { ProjectLogo } from "./project-logo";

type ProjectLabels = Omit<SiteContent["projects"], "items">;

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
      {project.video ? (
        <CoverVideo
          src={project.video.src}
          poster={project.video.poster}
          label={project.image?.alt ?? project.title}
          className={styles.image}
          playing={!project.hoverMedia}
        />
      ) : project.image ? (
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
      {project.hoverMedia && (
        <ProjectHoverMedia
          key={project.hoverMedia.src}
          media={project.hoverMedia}
          sizes={
            large
              ? "(min-width: 1440px) 1344px, 94vw"
              : "(min-width: 960px) 54vw, 94vw"
          }
        />
      )}
    </div>
  );
}

export function ProjectHighlight({
  highlight,
}: {
  highlight: Project["highlight"];
}) {
  if (!highlight?.value) return null;
  return (
    <p className={styles.cardHighlight}>
      <bdi className={styles.cardHighlightValue}>{highlight.value}</bdi>
      <span>{highlight.label}</span>
    </p>
  );
}

export function ProjectsSection({
  locale,
  content,
  partyReaction = false,
  plain = false,
  projects,
}: {
  locale: Locale;
  content: ProjectLabels;
  partyReaction?: boolean;
  /** CMS previews: no homepage scroll surface (it needs the site theme). */
  plain?: boolean;
  projects: Project[];
}) {
  const contents = (
    <div className="site-container">
      <div
        className={`${styles.sectionHeader} ${styles.stackIntro}`}
        data-stack-intro=""
      >
        <Noise
          patternSize={340}
          patternScaleX={1}
          patternScaleY={0.3}
          patternRefreshInterval={2}
          patternAlpha={22}
        />
        <h2
          id="projects-heading"
          className={`${styles.heading}${partyReaction ? ` ${partyStyles.lightHeading}` : ""}`}
          data-party-react={partyReaction ? "heading" : undefined}
        >
          {content.heading}
          {partyReaction && <PartyHeadingLight text={content.heading} />}
        </h2>
        <LiquidLink
          href={`/${locale}/projects`}
          className={styles.allProjectsLink}
          variant="secondary"
          navigation="client"
        >
          {content.allLink}
        </LiquidLink>
      </div>
      <div className={`${styles.list} ${styles.stackList}`}>
        {projects.map((project, index) => {
          const id = `project-${project.slug ?? project.id}`;
          // An empty description shows nothing, not a placeholder.
          const description = project.description;
          // CMS cards: short description beside the title, project
          // description under it. Static items have one description.
          const cms = project.summary !== undefined;
          const summary = cms ? project.summary : description;
          return (
            // Strips and bodies are siblings so every strip sticks within
            // the whole list and the strips pile up while scrolling.
            <Fragment key={project.id ?? project.slug}>
              <header
                className={styles.stackHead}
                data-stack-head=""
                data-project-card={project.id}
                style={{ "--stack-index": index } as CSSProperties}
              >
                <Noise
                  patternSize={340}
                  patternScaleX={1}
                  patternScaleY={0.3}
                  patternRefreshInterval={2}
                  patternAlpha={22}
                />
                {project.logo ? (
                  <ProjectLogo src={project.logo.src} />
                ) : (
                  <span className={styles.stackLogo} aria-hidden="true" />
                )}
                <h3 id={id} className={styles.stackTitle}>
                  <bdi dir={localeConfig[locale].direction}>
                    {project.title}
                  </bdi>
                </h3>
                {summary && (
                  <p className={styles.stackDescription}>{summary}</p>
                )}
              </header>
              <div className={styles.stackBody} data-project-card={project.id}>
                <div className={styles.stackInfo}>
                  {summary && !(cms && summary === description) && (
                    <p className={styles.stackBodyDescription}>{summary}</p>
                  )}
                  {cms && description && (
                    <p className={styles.stackAbout}>{description}</p>
                  )}
                  <ProjectHighlight highlight={project.highlight} />
                  <CategoryTags
                    categories={project.categories ?? []}
                    className={styles.stackTags}
                  />
                </div>
                {project.slug ? (
                  <ProjectMediaLink
                    href={`/${locale}/projects/${project.slug}`}
                    label={content.viewProject}
                    title={project.title}
                  >
                    <ProjectMedia
                      project={project}
                      label={content.visualLabel}
                    />
                  </ProjectMediaLink>
                ) : (
                  <ProjectMediaSoon label={content.comingSoon}>
                    <ProjectMedia
                      project={project}
                      label={content.visualLabel}
                    />
                  </ProjectMediaSoon>
                )}
              </div>
            </Fragment>
          );
        })}
      </div>
      {/* Phones reach the archive link after the last project, not in the sticky intro. */}
      <LiquidLink
        href={`/${locale}/projects`}
        className={styles.allProjectsLinkEnd}
        variant="secondary"
        navigation="client"
      >
        {content.allLink}
      </LiquidLink>
    </div>
  );
  return plain ? (
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
