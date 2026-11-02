import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { enabledLocales, isEnabledLocale, localeConfig } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { pixelRevealBootstrap } from "@/lib/pixel-reveal";
import { pageAlternates } from "@/lib/seo";
import { isIndexable, SITE_URL, siteOpenGraph } from "@/lib/site";
import { themeBootstrap } from "@/lib/theme";
import { ClarityAnalytics } from "@/components/clarity";
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
  const { title, description } = content.metadata;
  return {
    title: { default: title, template: `%s | ${content.studioName}` },
    description,
    metadataBase: new URL(SITE_URL),
    // Default for the locale home. Pages that set `alternates` replace this
    // entirely, and must keep Hebrew plus x-default only — English is not enabled.
    alternates: pageAlternates(`/${locale}`),
    openGraph: { ...siteOpenGraph, title, description, url: `/${locale}` },
    twitter: { card: "summary_large_image" },
    // Search Console: the previous site's token and the current one.
    verification: {
      google: [
        "xO6LYWGPw9X4BfBOz8e1Zwbb15voRIleYgqwqAmp6W4",
        "O849dYcTqlkDRxzJoO16ei1ObwdFd4inKLcSOFTpxkQ",
      ],
    },
    // Index the launched public site; preview builds remain excluded.
    robots: {
      index: isIndexable,
      follow: isIndexable,
      googleBot: {
        index: isIndexable,
        follow: isIndexable,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
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
      {/* Public pages only: the admin and diagnostic areas have their own root
          layouts, so the admin secret in their URLs never reaches analytics. */}
      {isIndexable ? (
        <>
          <GoogleAnalytics gaId="G-R1KN0P3K42" />
          <ClarityAnalytics projectId="z1751pirhl" />
        </>
      ) : null}
    </html>
  );
}
