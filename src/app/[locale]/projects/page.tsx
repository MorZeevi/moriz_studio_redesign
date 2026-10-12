import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/components/projects.module.css";
import { ProjectArrow, ProjectsSection } from "@/components/projects-section";
import { FloatingActions } from "@/components/floating-actions";
import { isEnabledLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { projectCopy } from "@/i18n/project-copy";
import { termName } from "@/lib/cms/localize";
import { getPublicProjects } from "@/lib/cms/queries";
import { projectCard } from "@/lib/cms/project-card";
import { CategoryTags } from "@/components/category-tags";
import { StudioLogo } from "@/components/studio-logo";
import { ThemeToggle } from "@/components/theme-toggle";

type PageParams = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
};

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { locale } = await params;
  if (!isEnabledLocale(locale)) notFound();
  const content = await getDictionary(locale);
  return { title: `${content.projects.allHeading} | ${content.studioName}` };
}

export default async function ProjectsPage({
  params,
  searchParams,
}: PageParams) {
  const { locale } = await params;
  if (!isEnabledLocale(locale)) notFound();
  const content = await getDictionary(locale);
  const copy = projectCopy[locale];
  const projects = await getPublicProjects("projects");
  const { category: selectedCategory } = await searchParams;
  const categories = [
    ...new Map(
      projects.flatMap((p) => p.categories).map((c) => [c.id, c]),
    ).values(),
  ].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  const filtered = selectedCategory
    ? projects.filter((p) =>
        p.categories.some((c) => c.slug === selectedCategory),
      )
    : projects;
  return (
    <div className={styles.projectPage}>
      <a
        href="#projects"
        className="sr-only focus:not-sr-only focus:absolute focus:start-5 focus:top-5 focus:z-30 focus:bg-background focus:p-4"
      >
        {content.skipToContent}
      </a>
      <div className="site-container">
        <header className={styles.pageHeader}>
          <StudioLogo
            name={content.studioName}
            locale={locale}
            className={styles.wordmark}
          />
          <div className="project-header-actions">
            <ThemeToggle labels={content.theme} />
            <Link href={`/${locale}#projects`} className={styles.backLink}>
              <ProjectArrow back />
              {content.projects.homeLink}
            </Link>
          </div>
        </header>
      </div>
      <main>
        {!!categories.length && (
          <nav
            className="site-container"
            aria-label={copy.filterLabel}
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--space-3)",
              paddingBlock: "var(--space-4)",
            }}
          >
            <Link
              href={`/${locale}/projects`}
              aria-current={!selectedCategory ? "page" : undefined}
            >
              {copy.all}
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/${locale}/projects?category=${encodeURIComponent(category.slug)}`}
                aria-current={
                  selectedCategory === category.slug ? "page" : undefined
                }
              >
                <CategoryTags
                  label={copy.categories}
                  categories={[
                    { id: category.id, name: termName(category, locale) },
                  ]}
                />
              </Link>
            ))}
          </nav>
        )}
        <ProjectsSection
          projects={filtered.map((project) =>
            projectCard(project, "projects", locale),
          )}
          locale={locale}
          content={content.projects}
          collection
        />
        {!filtered.length && <p className="site-container">{copy.empty}</p>}
      </main>
      <FloatingActions content={content.floatingActions} ask={content.askAi} />
    </div>
  );
}
