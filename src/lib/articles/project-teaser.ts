import type { EnabledLocale } from "@/i18n/config";

export type ProjectTeaser = {
  title: string;
  href: string;
  image?: { src: string; alt: string };
};

/** Pull a public card out of the rendered projects index. Titles and images only. */
export function teaserFromProjectsHtml(
  html: string,
  slug: string,
  locale: EnabledLocale,
): ProjectTeaser | null {
  const href = `/${locale}/projects/${slug}`;
  const at = html.indexOf(`href="${href}"`);
  if (at < 0) return null;
  const window = html.slice(at, at + 4000);
  const title = window.match(/<h[23][^>]*>([^<]+)<\/h[23]>/)?.[1]?.trim();
  if (!title) return null;
  const src = window.match(/src="(\/media\/[^"]+)"/)?.[1];
  const alt = window.match(/alt="([^"]*)"/)?.[1]?.trim() || title;
  return {
    title,
    href,
    ...(src ? { image: { src: `https://moriz.studio${src}`, alt } } : {}),
  };
}
