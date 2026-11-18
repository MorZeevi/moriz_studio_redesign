import type { EnabledLocale } from "./config";
import type { he } from "./dictionaries/he";

// `he` is a plain object (not `as const`), so its strings are typed `string`
// and the English dictionary satisfies the same shape.
export type SiteContent = typeof he;

const dictionaries = {
  he: () => import("./dictionaries/he").then((module) => module.he),
  en: () => import("./dictionaries/en").then((module) => module.en),
} satisfies Record<EnabledLocale, () => Promise<SiteContent>>;

export async function getDictionary(
  locale: EnabledLocale,
): Promise<SiteContent> {
  return dictionaries[locale]();
}
