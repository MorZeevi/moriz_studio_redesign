import type { EnabledLocale } from "./config";
import type { he } from "./dictionaries/he";

export type SiteContent = typeof he;

const dictionaries = {
  he: () => import("./dictionaries/he").then((module) => module.he),
} satisfies Record<EnabledLocale, () => Promise<SiteContent>>;

export async function getDictionary(
  locale: EnabledLocale,
): Promise<SiteContent> {
  return dictionaries[locale]();
}
