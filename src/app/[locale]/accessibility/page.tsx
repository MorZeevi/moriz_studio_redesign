import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FloatingActions } from "@/components/floating-actions";
import { MainHeader } from "@/components/main-header";
import { LegalDocument } from "@/components/legal-document";
import { SiteFooter } from "@/components/site-footer";
import { isEnabledLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { pageAlternates } from "@/lib/seo";
import { siteOpenGraph } from "@/lib/site";

type PageParams = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { locale } = await params;
  if (!isEnabledLocale(locale)) notFound();
  const content = await getDictionary(locale);
  const { title, intro } = content.accessibility;
  const url = `/${locale}/accessibility`;
  return {
    title,
    description: intro,
    alternates: pageAlternates(url),
    openGraph: {
      ...siteOpenGraph,
      title: `${title} | ${content.studioName}`,
      description: intro,
      url,
    },
  };
}

export default async function AccessibilityPage({ params }: PageParams) {
  const { locale } = await params;
  if (!isEnabledLocale(locale)) notFound();
  const content = await getDictionary(locale);
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
        pageAnchors={["#contact"]}
      />
      <main id="main-content" tabIndex={-1}>
        <LegalDocument
          document={content.accessibility}
          contact={content.contact.details}
          locale={locale}
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
