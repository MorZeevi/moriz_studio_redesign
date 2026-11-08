import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlesFrame } from "@/components/articles/articles-frame";
import { JsonLd } from "@/components/json-ld";
import { ServicesView } from "@/components/services/services-view";
import { servicesHubDocument } from "@/content/services";
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
  return serviceMetadata(locale, servicesHubDocument, content.studioName);
}

export default async function ServicesPage({ params }: PageParams) {
  const { locale } = await params;
  if (!isEnabledLocale(locale)) notFound();
  const loaded = await loadServicePage(servicesHubDocument, locale);
  return (
    <ArticlesFrame content={loaded.content} locale={locale}>
      <JsonLd data={loaded.data} />
      <ServicesView
        locale={locale}
        studioName={loaded.content.studioName}
        contactLabel={loaded.content.navigation.contactLink.label}
        page={servicesHubDocument}
        catalog={loaded.catalog}
        articles={loaded.articles}
        projects={loaded.projects}
        related={loaded.related}
      />
    </ArticlesFrame>
  );
}
