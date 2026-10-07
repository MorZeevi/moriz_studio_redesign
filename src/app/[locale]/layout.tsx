import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { enabledLocales, isEnabledLocale, localeConfig } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { danidin, leon } from "@/styles/fonts";
import "../globals.css";

type LocaleParams = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return enabledLocales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  if (!isEnabledLocale(locale)) notFound();
  const content = await getDictionary(locale);
  return {
    ...content.metadata,
    // Local prototype only. Production indexing remains a separate decision.
    robots: { index: false, follow: false },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode }> & LocaleParams) {
  const { locale } = await params;
  if (!isEnabledLocale(locale)) notFound();
  const developerTools =
    process.env.NODE_ENV === "development"
      ? await import("@/components/devtools/developer-toolbar").then(
          ({ DeveloperToolbar }) => <DeveloperToolbar />,
        )
      : null;
  return (
    <html
      lang={locale}
      dir={localeConfig[locale].direction}
      className={`${danidin.variable} ${leon.variable}`}
    >
      <body>
        {children}
        {developerTools}
      </body>
    </html>
  );
}
