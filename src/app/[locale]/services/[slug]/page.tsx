import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlesFrame } from "@/components/articles/articles-frame";
import { JsonLd } from "@/components/json-ld";
import { ServicesView } from "@/components/services/services-view";
import { getService, services } from "@/content/services";
import { isEnabledLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { loadServicePage } from "@/lib/services/load";
import { serviceMetadata } from "@/lib/services/metadata";

type PageParams = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return services.flatMap((service) =>
    service.slug ? [{ slug: service.slug }] : [],
  );
}

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isEnabledLocale(locale)) notFound();
  const page = getService(slug);
  if (!page) notFound();
  const content = await getDictionary(locale);
  return serviceMetadata(locale, page, content.studioName);
}

export default async function ServicePage({ params }: PageParams) {
  const { locale, slug } = await params;
  if (!isEnabledLocale(locale)) notFound();
  const page = getService(slug);
  if (!page) notFound();
  const loaded = await loadServicePage(page, locale);
  return (
    <ArticlesFrame content={loaded.content} locale={locale}>
      <JsonLd data={loaded.data} />
      <ServicesView
        locale={locale}
        studioName={loaded.content.studioName}
        contactLabel={loaded.content.navigation.contactLink.label}
        page={page}
        catalog={loaded.catalog}
        articles={loaded.articles}
        projects={loaded.projects}
        related={loaded.related}
      />
    </ArticlesFrame>
  );
}
