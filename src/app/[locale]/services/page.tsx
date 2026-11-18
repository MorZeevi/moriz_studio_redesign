import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlesFrame } from "@/components/articles/articles-frame";
import { JsonLd } from "@/components/json-ld";
import { ServicesView } from "@/components/services/services-view";
import { servicesHubFor } from "@/content/services";
import { isEnabledLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { loadServicePage } from "@/lib/services/load";
import { serviceMetadata } from "@/lib/services/metadata";

type PageParams = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { locale } = await params;
  if (!isEnabledLocale(locale)) notFound();
  const content = await getDictionary(locale);
  return serviceMetadata(locale, servicesHubFor(locale), content.studioName);
}

export default async function ServicesPage({ params }: PageParams) {
  const { locale } = await params;
  if (!isEnabledLocale(locale)) notFound();
  const page = servicesHubFor(locale);
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
