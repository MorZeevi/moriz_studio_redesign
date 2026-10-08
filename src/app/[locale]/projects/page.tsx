import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/components/projects.module.css";
import { ProjectArrow, ProjectsSection } from "@/components/projects-section";
import { FloatingWhatsApp } from "@/components/wireframe";
import { isEnabledLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

type PageParams = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { locale } = await params;
  if (!isEnabledLocale(locale)) notFound();
  const content = await getDictionary(locale);
  return { title: `${content.projects.allHeading} | ${content.studioName}` };
}

export default async function ProjectsPage({ params }: PageParams) {
  const { locale } = await params;
  if (!isEnabledLocale(locale)) notFound();
  const content = await getDictionary(locale);
  return (
    <div className={styles.projectPage}>
      <a
        href="#projects"
        className="sr-only focus:not-sr-only focus:absolute focus:start-5 focus:top-5 focus:z-30 focus:bg-background focus:p-4 focus:text-dark"
      >
        {content.skipToContent}
      </a>
      <div className="site-container">
        <header className={styles.pageHeader}>
          <Link href={`/${locale}`} className={styles.wordmark}>
            <bdi>{content.studioName}</bdi>
          </Link>
          <Link href={`/${locale}#projects`} className={styles.backLink}>
            <ProjectArrow back />
            {content.projects.homeLink}
          </Link>
        </header>
      </div>
      <main>
        <ProjectsSection
          locale={locale}
          content={content.projects}
          collection
        />
      </main>
      <FloatingWhatsApp labels={content.whatsapp} />
    </div>
  );
}
