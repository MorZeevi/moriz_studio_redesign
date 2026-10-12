import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectDetail } from "@/components/project-detail";
import { ProjectsSection } from "@/components/projects-section";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { projectCopy } from "@/i18n/project-copy";
import { projectCard } from "@/lib/cms/project-card";
import { getAdminProject } from "@/lib/cms/queries";

const VIEWS = {
  case: "עמוד הפרויקט",
  home: "כרטיס בעמוד הבית",
  archive: "כרטיס בעמוד הפרויקטים",
} as const;
type View = keyof typeof VIEWS;
/** The last saved version, behind the admin gate; drafts never go public. */
export default async function Preview({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string; locale?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const view: View =
    query.view && query.view in VIEWS ? (query.view as View) : "case";
  const locale: Locale = query.locale === "en" ? "en" : "he";
  const project = await getAdminProject(id);
  if (!project) notFound();
  const link = (next: { view?: View; locale?: Locale }) =>
    `/admin/projects/${id}/preview?view=${next.view ?? view}&locale=${next.locale ?? locale}`;
  return (
    <>
      <p>תצוגה מקדימה פרטית — הגרסה השמורה</p>
      <nav
        aria-label="אפשרויות תצוגה מקדימה"
        style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)" }}
      >
        <Link href={`/admin/projects/${id}`}>חזרה לעריכה</Link>
        {(Object.keys(VIEWS) as View[]).map((v) => (
          <Link
            key={v}
            href={link({ view: v })}
            aria-current={v === view ? "page" : undefined}
          >
            {VIEWS[v]}
          </Link>
        ))}
        <Link href={link({ locale: locale === "he" ? "en" : "he" })}>
          {locale === "he" ? "English" : "עברית"}
        </Link>
      </nav>
      <div dir={locale === "en" ? "ltr" : "rtl"} lang={locale}>
        {view === "case" ? (
          <ProjectDetail
            project={project}
            locale={locale}
            content={await getDictionary("he")}
            preview
          />
        ) : (
          <ProjectsSection
            locale={locale}
            content={projectCopy[locale]}
            plain
            collection={view === "archive"}
            projects={[
              projectCard(
                project,
                view === "home" ? "homepage" : "projects",
                locale,
              ),
            ]}
          />
        )}
      </div>
    </>
  );
}
