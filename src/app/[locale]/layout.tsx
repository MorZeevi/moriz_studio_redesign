import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { enabledLocales, isEnabledLocale, localeConfig } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { pixelRevealBootstrap } from "@/lib/pixel-reveal";
import { themeBootstrap } from "@/lib/theme";
import { ThemeProvider } from "@/components/theme-provider";
import Noise from "@/components/react-bits/Noise";
import { caveat, danidin, leon } from "@/styles/fonts";
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
    // Index the launched public site; preview builds remain excluded.
    metadataBase: new URL("https://moriz.studio"),
    robots: {
      index: process.env.VERCEL_ENV === "production",
      follow: process.env.VERCEL_ENV === "production",
    },
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
      data-public-site=""
      className={`${danidin.variable} ${leon.variable} ${caveat.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: First-party pre-paint theme initialization; no user input.
          dangerouslySetInnerHTML={{ __html: themeBootstrap }}
        />
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: First-party pre-paint initialization with a validated locale.
          dangerouslySetInnerHTML={{ __html: pixelRevealBootstrap(locale) }}
        />
      </head>
      <body id="top">
        <div className="page-grain" aria-hidden="true">
          <Noise
            patternSize={340}
            patternScaleX={1}
            patternScaleY={0.3}
            patternRefreshInterval={2}
            patternAlpha={22}
          />
        </div>
        <ThemeProvider>{children}</ThemeProvider>
        {developerTools}
      </body>
    </html>
  );
}
