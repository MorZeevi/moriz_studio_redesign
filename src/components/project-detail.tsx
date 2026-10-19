import type { CSSProperties } from "react";
import Link from "next/link";
import { CategoryTags } from "@/components/category-tags";
import { ProjectArrow } from "@/components/projects-section";
import { ProjectGallery } from "@/components/project-gallery";
import Noise from "@/components/react-bits/Noise";
import { FloatingActions } from "@/components/floating-actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { type Locale, localeConfig } from "@/i18n/config";
import type { SiteContent } from "@/i18n/dictionaries";
import { projectCopy } from "@/i18n/project-copy";
import { localized, termName } from "@/lib/cms/localize";
import { projectCard } from "@/lib/cms/project-card";
import {
  panelSurface,
  projectGallery,
  projectHighlights,
  projectInformation,
  projectUserCount,
} from "@/lib/project-presentation";
import type { Project } from "@/types/project";
import styles from "./projects.module.css";
import detail from "./project-detail.module.css";

export function ProjectDetail({
  project,
  locale,
  content,
  nextProject = null,
  preview = false,
}: {
  project: Project;
  locale: Locale;
  /** Site chrome (theme toggle, floating actions) uses the site dictionary. */
  content: SiteContent;
  nextProject?: Project | null;
  preview?: boolean;
}) {
  const copy = projectCopy[locale];
  const labels = copy.caseStudy;
  const Main = preview ? "section" : "main";
  const back = `/${locale}/projects`;
  const t = (key: Parameters<typeof localized<Project>>[1]) =>
    localized(project, key, locale);
  const title = t("title");
  const information = projectInformation(
    project,
    copy.detailsHeading,
    labels.additionalInfo,
    locale,
    copy.audience,
  );
  const gallery = projectGallery(project, locale, labels.video);
  const headline = t("headline");
  const short = t("short_description");
  const intro = headline || short;
  const surface = panelSurface(project);
  const logo = project.media.find((m) => m.role === "logo");
  const nextCover = nextProject
    ? projectCard(nextProject, "cover", locale).image
    : null;
  // Highlights sit in the panel unless a highlights block places them.
  const highlights = project.content.some(
    (b) => b.type === "highlights" && !b.hidden,
  )
    ? []
    : projectHighlights(project, locale);
  // Same order as the editor's project details; empty facts are left out.
  const metadata: [string, string | number | null][] = [
    [labels.client, t("client") || null],
    [labels.year, project.year],
    [copy.role, t("role") || null],
    [copy.users, projectUserCount(project)],
    [copy.type, project.type ? termName(project.type, locale) : null],
  ];
  return (
    <div
      className={detail.page}
      dir={localeConfig[locale].direction}
      lang={locale}
      data-project-detail
    >
      <div className="site-container">
        <Main id="project-content" tabIndex={-1} className={detail.composition}>
          <aside
            className={detail.panel}
            aria-label={copy.detailsHeading}
            data-surface={surface ? "" : undefined}
            style={
              surface
                ? ({
                    "--case-background": surface.background,
                    "--case-foreground": surface.foreground,
                  } as CSSProperties)
                : undefined
            }
          >
            {surface && (
              <div className={detail.panelBackdrop} aria-hidden="true">
                <Noise
                  patternSize={340}
                  patternScaleX={1}
                  patternScaleY={0.3}
                  patternRefreshInterval={2}
                  patternAlpha={22}
                />
              </div>
            )}
            <div className={detail.panelScroll}>
              {!preview && (
                <div className={detail.panelNavigation}>
                  <Link href={back} className={styles.backLink}>
                    <ProjectArrow back />
                    {copy.backLink}
                  </Link>
                  <ThemeToggle labels={content.theme} />
                </div>
              )}
              <div className={detail.identity}>
                {logo && (
                  // biome-ignore lint/performance/noImgElement: private CMS media bypasses the optimizer; logos keep their own ratio.
                  <img
                    src={logo.src}
                    alt={localized(logo, "alt", locale) || title}
                    width={logo.width}
                    height={logo.height}
                    className={detail.logo}
                  />
                )}
                <h1 className={detail.title}>
                  <bdi>{title}</bdi>
                </h1>
              </div>
              {intro && <p className={detail.intro}>{intro}</p>}
              {headline && short && headline !== short && (
                <p className={detail.intro}>{short}</p>
              )}
              {metadata.some(([, value]) => value) && (
                <dl className={detail.metadata}>
                  {metadata
                    .filter(([, value]) => value)
                    .map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>
                          <bdi>{value}</bdi>
                        </dd>
                      </div>
                    ))}
                </dl>
              )}
              <CategoryTags
                label={copy.categories}
                categories={project.categories.map((c) => ({
                  id: c.id,
                  name: termName(c, locale),
                }))}
              />
              {!!highlights.length && (
                <dl
                  className={detail.panelHighlights}
                  aria-label={copy.highlights}
                >
                  {highlights.map((h) => (
                    <div key={h.id}>
                      <dt>{h.label}</dt>
                      <dd className={detail.highlightValue}>
                        <bdi>{h.value}</bdi>
                      </dd>
                      {h.description && <dd>{h.description}</dd>}
                    </div>
                  ))}
                </dl>
              )}
              {information.map((section, index) => (
                <details
                  key={`${project.id}-${section.id}`}
                  className={detail.accordion}
                  name={`project-${project.id}`}
                  open={index === 0}
                >
                  <summary className={detail.summary}>
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
                  {section.text && (
                    <p className={detail.answer}>{section.text}</p>
                  )}
                  {section.subsections.map((sub, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: Subsections render in their saved order.
                    <div key={i} className={detail.subsection}>
                      {sub.title && <h3>{sub.title}</h3>}
                      {sub.text && <p className={detail.answer}>{sub.text}</p>}
                    </div>
                  ))}
                </details>
              ))}
            </div>
            {project.website_url && (
              <div className={detail.panelFooter}>
                <a
                  href={project.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={detail.websiteLink}
                >
                  <svg
                    className={detail.websiteOutline}
                    viewBox="0 0 320 60"
                    preserveAspectRatio="none"
                    fill="none"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      vectorEffect="non-scaling-stroke"
                      d="M21 1H238C247 1 251 8 256 8S265 1 274 1H299Q319 1 319 21V39Q319 59 299 59H274C265 59 261 52 256 52S247 59 238 59H21Q1 59 1 39V21Q1 1 21 1Z"
                    />
                  </svg>
                  <span className={detail.websiteArrow} aria-hidden="true">
                    <ProjectArrow />
                  </span>
                  <span className={detail.websiteLabel}>{copy.visitWebsite}</span>
                </a>
              </div>
            )}
          </aside>
          <ProjectGallery key={project.id} {...gallery} labels={labels} />
          {!preview && (
            <footer className={detail.footer}>
              {nextProject?.slug && (
                <nav
                  className={styles.nextProject}
                  aria-label={copy.nextProject}
                >
                  <p className={styles.nextLabel}>{copy.nextProject}</p>
                  <Link href={`/${locale}/projects/${nextProject.slug}`}>
                    {nextCover && (
                      // biome-ignore lint/performance/noImgElement: private CMS media bypasses the optimizer; this thumbnail uses the next project's cover or video poster.
                      <img
                        className={styles.nextPreview}
                        src={nextCover.src}
                        alt=""
                        width={320}
                        height={200}
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <bdi>{localized(nextProject, "title", locale)}</bdi>
                    <ProjectArrow />
                  </Link>
                </nav>
              )}
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
