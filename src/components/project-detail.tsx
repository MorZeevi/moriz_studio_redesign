import Link from "next/link";
import { CategoryTags } from "@/components/category-tags";
import { CoverVideo } from "@/components/cover-video";
import { StudioLogo } from "@/components/studio-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ContentImage,
  Highlights,
  mediaLayout,
  ProjectContent,
} from "@/components/project-content";
import { ProjectArrow, ProjectMedia } from "@/components/projects-section";
import { FloatingActions } from "@/components/floating-actions";
import { defaultLocale, isEnabledLocale, type Locale } from "@/i18n/config";
import type { SiteContent } from "@/i18n/dictionaries";
import { projectCopy } from "@/i18n/project-copy";
import { localized, termName } from "@/lib/cms/localize";
import { projectCard, serviceNames } from "@/lib/cms/project-card";
import { galleryImages, mediaReferences } from "@/lib/cms/validation";
import type { Project } from "@/types/project";
import styles from "./projects.module.css";

export function ProjectDetail({
  project,
  locale,
  content,
  nextProject = null,
  preview = false,
}: {
  project: Project;
  locale: Locale;
  /** Site chrome (header, floating actions) stays on the site dictionary. */
  content: SiteContent;
  nextProject?: Pick<Project, "slug" | "title" | "title_en"> | null;
  preview?: boolean;
}) {
  const copy = projectCopy[locale];
  const Main = preview ? "section" : "main";
  const back = `/${locale}#projects`;
  const t = (key: Parameters<typeof localized<Project>>[1]) =>
    localized(project, key, locale);
  const title = t("title");
  const intro = t("description") || t("short_description");
  const services = serviceNames(project, locale);
  const logo = project.media.find((m) => m.role === "logo");
  const mainVideo = project.media.find((m) => m.role === "main_video");
  // Files already shown by the hero or a content block are not repeated below.
  const used = new Set(
    mediaReferences({
      ...project,
      homepage_image_url: null,
      projects_image_url: null,
      og_image_url: null,
      media: [],
    }),
  );
  const gallery = galleryImages(project.media).filter((m) => !used.has(m.src));
  const highlightsPlaced = project.content.some(
    (b) => b.type === "highlights" && !b.hidden,
  );
  const info: [string, string | number | null | undefined][] = [
    [copy.client, t("client")],
    [copy.year, project.year],
    [copy.type, project.type ? termName(project.type, locale) : null],
    [copy.services, services.join(" · ")],
    [copy.role, t("role")],
  ];
  const audience = t("target_audience");
  const audienceDescription = t("audience_description");
  return (
    <div className={styles.projectPage}>
      <div className="site-container">
        {!preview && (
          <header className={styles.pageHeader}>
            <StudioLogo
              name={content.studioName}
              locale={isEnabledLocale(locale) ? locale : defaultLocale}
              className={styles.wordmark}
            />
            <div className="project-header-actions">
              <ThemeToggle labels={content.theme} />
              <Link href={back} className={styles.backLink}>
                <ProjectArrow back />
                {copy.backLink}
              </Link>
            </div>
          </header>
        )}
        <Main id="project-content" tabIndex={-1}>
          <div className={styles.pageIntro}>
            {logo && (
              // biome-ignore lint/performance/noImgElement: Private media must bypass optimization; logos keep their own aspect ratio.
              <img
                src={logo.src}
                alt={localized(logo, "alt", locale) || title}
                width={logo.width}
                height={logo.height}
                className={styles.projectLogo}
              />
            )}
            <h1 className={styles.pageTitle}>
              <bdi>{title}</bdi>
            </h1>
            {t("headline") && (
              <p className={styles.pageDescription}>{t("headline")}</p>
            )}
            {intro && <p className={styles.pageDescription}>{intro}</p>}
            {!!services.length && (
              <CategoryTags
                label={copy.services}
                categories={services.map((name) => ({ id: name, name }))}
              />
            )}
            {project.website_url && (
              <a
                href={project.website_url}
                className={styles.websiteLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {copy.visitWebsite}
                <ProjectArrow />
              </a>
            )}
          </div>
          <ProjectMedia
            project={projectCard(project, "cover", locale)}
            label={copy.visualLabel}
            large
          />
          <section
            className={styles.infoSection}
            aria-labelledby="project-info"
          >
            <h2 id="project-info" className={styles.detailsHeading}>
              {copy.info}
            </h2>
            <dl className={styles.infoList}>
              {info
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              {project.website_url && (
                <div>
                  <dt>{copy.website}</dt>
                  <dd>
                    <a
                      href={project.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      dir="ltr"
                    >
                      {project.website_url.replace(/^https?:\/\//, "")}
                    </a>
                  </dd>
                </div>
              )}
              {/* Target audience appears only on the case study. */}
              {audience && (
                <div className={styles.infoWide}>
                  <dt>{copy.audience}</dt>
                  <dd>
                    {audience}
                    {audienceDescription && <p>{audienceDescription}</p>}
                  </dd>
                </div>
              )}
            </dl>
            <CategoryTags
              label={copy.categories}
              categories={project.categories.map((c) => ({
                id: c.id,
                name: termName(c, locale),
              }))}
            />
          </section>
          {!highlightsPlaced && !!project.highlights.length && (
            <section
              className={styles.highlightsSection}
              aria-label={copy.highlights}
            >
              <Highlights highlights={project.highlights} locale={locale} />
            </section>
          )}
          {mainVideo && !used.has(mainVideo.src) && (
            <section className={styles.mainVideoSection}>
              <CoverVideo
                src={mainVideo.src}
                poster={mainVideo.poster}
                label={localized(mainVideo, "alt", locale) || copy.video}
                className={styles.blockVideo}
                loop={mainVideo.loop ?? true}
              />
            </section>
          )}
          {project.content.some((b) => !b.hidden) && (
            <section
              className={styles.pageDetails}
              aria-label={copy.detailsHeading}
            >
              <h2 className={styles.detailsHeading}>{copy.detailsHeading}</h2>
              <ProjectContent
                blocks={project.content}
                group={`page-${project.id}`}
                locale={locale}
                media={project.media}
                highlights={project.highlights}
              />
            </section>
          )}
          {!!gallery.length && (
            <section className={styles.gallerySection} aria-label={title}>
              <div className={styles.mediaGrid}>
                {gallery.map((item) => (
                  <ContentImage
                    key={item.src}
                    image={{ src: item.src }}
                    context={{
                      locale,
                      media: new Map(project.media.map((m) => [m.src, m])),
                    }}
                    layout={mediaLayout(item)}
                  />
                ))}
              </div>
            </section>
          )}
          {nextProject?.slug && (
            <nav className={styles.nextProject} aria-label={copy.nextProject}>
              <p className={styles.nextLabel}>{copy.nextProject}</p>
              <Link href={`/${locale}/projects/${nextProject.slug}`}>
                <bdi>{localized(nextProject, "title", locale)}</bdi>
                <ProjectArrow />
              </Link>
            </nav>
          )}
          <section className={styles.contactCta}>
            <h2>{copy.contactHeading}</h2>
            <Link
              href={`/${locale}#contact`}
              className="button button--primary button--lg"
            >
              {copy.contactLink}
            </Link>
          </section>
        </Main>
        {!preview && (
          <footer className={styles.pageFooter}>
            <Link href={back} className={styles.backLink}>
              <ProjectArrow back />
              {copy.backLink}
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
