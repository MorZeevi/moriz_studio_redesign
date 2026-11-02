import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FontPreview } from "@/components/font-preview";
import { isEnabledLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { pageAlternates } from "@/lib/seo";
import { siteOpenGraph } from "@/lib/site";
import { danidin } from "@/styles/fonts";
import { futurism, manhattan, polin } from "@/styles/font-candidates";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isEnabledLocale(locale)) notFound();
  const content = await getDictionary(locale);
  const title = `${content.studioName} — ${content.fontPreview.title}`;
  const description = content.fontPreview.introduction;
  const url = `/${locale}/fonts`;
  return {
    title: { absolute: title },
    description,
    // Utility page. Its own URL, so it does not inherit the homepage canonical.
    alternates: pageAlternates(url),
    openGraph: { ...siteOpenGraph, title, description, url },
    robots: { index: false, follow: false },
  };
}

export default async function Fonts({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isEnabledLocale(locale)) notFound();
  const content = await getDictionary(locale);

  return (
    <FontPreview
      locale={locale}
      labels={content.fontPreview}
      hero={content.hero}
      samples={[
        {
          name: "Danidin CondensedBold",
          family: danidin.style.fontFamily,
          weight: 700,
        },
        {
          name: "Futurism Black",
          family: futurism.style.fontFamily,
          weight: 900,
        },
        {
          name: "Manhattan 650",
          family: manhattan.style.fontFamily,
          weight: 700,
        },
        { name: "Polin Bold", family: polin.style.fontFamily, weight: 700 },
        { name: "Polin Regular", family: polin.style.fontFamily, weight: 400 },
      ]}
    />
  );
}
