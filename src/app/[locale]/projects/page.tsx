import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FloatingActions } from "@/components/floating-actions";
import { MainHeader } from "@/components/main-header";
import {
  type ArchiveType,
  ProjectsArchive,
} from "@/components/projects-archive";
import { projectLayoutBootstrap } from "@/components/projects-grid-config";
import { ProjectsHero } from "@/components/projects-hero";
import { SiteFooter } from "@/components/site-footer";
import { isEnabledLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { projectCopy } from "@/i18n/project-copy";
import { demoArchive, demoEnabled } from "@/lib/cms/demo-projects";
import { termName } from "@/lib/cms/localize";
import { projectArchiveCard } from "@/lib/cms/project-card";
import { getPublicProjects } from "@/lib/cms/queries";

type PageParams = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string; demo?: string }>;
};

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { locale } = await params;
  if (!isEnabledLocale(locale)) notFound();
  const content = await getDictionary(locale);
  const archive = content.projects.archive;
  return {
    title: `${archive.heading} | ${content.studioName}`,
  };
}

export default async function ProjectsPage({
  params,
  searchParams,
}: PageParams) {
  const { locale } = await params;
  if (!isEnabledLocale(locale)) notFound();
  const content = await getDictionary(locale);
  const copy = projectCopy[locale];
  const { type, demo } = await searchParams;
  const published = await getPublicProjects("projects");

  // Filters come from the project types used by published projects.
  const terms = new Map(
    published.flatMap((p) => (p.type ? [[p.type.id, p.type] as const] : [])),
  );
  let types: ArchiveType[] = [...terms.values()]
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
    .map((t) => ({
      slug: t.slug,
      name: termName(t, locale),
      count: published.filter((p) => p.type?.id === t.id).length,
    }));
  let projects = published.map((p) => projectArchiveCard(p, locale));

  if (demoEnabled(demo)) {
    const fixture = demoArchive(
      locale,
      projects.find((p) => p.href)?.href ?? null,
    );
    projects = [...projects, ...fixture.projects];
    types = [
      ...types,
      ...fixture.types.map((t) => ({
        ...t,
        count: projects.filter((p) => p.typeSlug === t.slug).length,
      })),
    ];
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-5 focus:top-5 focus:z-30 focus:bg-background focus:p-4"
      >
        {content.skipToContent}
      </a>
      <MainHeader
        content={content}
        locale={locale}
        pageAnchors={["#projects", "#contact"]}
      />
      <main id="main-content" tabIndex={-1}>
        <ProjectsHero heading={content.projects.archive.heading} />
        {/* Applies the saved grid layout before the grid paints. */}
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: First-party pre-paint layout preference; no user input.
          dangerouslySetInnerHTML={{ __html: projectLayoutBootstrap }}
        />
        <ProjectsArchive
          projects={projects}
          types={types}
          initialType={type ?? null}
          contactHref="#contact"
          labels={{
            ...content.projects.archive,
            allHeading: content.projects.allHeading,
            filterLabel: copy.filterLabel,
            all: copy.all,
            empty: copy.empty,
            viewProject: content.projects.viewProject,
            comingSoon: content.projects.comingSoon,
          }}
        />
      </main>
      <SiteFooter content={content} locale={locale} homepage={false} />
      <FloatingActions
        content={content.floatingActions}
        ask={content.askAi}
        mobileWhatsappOnly
      />
    </>
  );
}
