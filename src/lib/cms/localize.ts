import type { Locale } from "@/i18n/config";
import type { Term } from "@/types/project";

/**
 * Reads `<key>` (Hebrew) or `<key>_en`. English falls back to Hebrew field by
 * field, so a half-translated project still renders completely.
 */
export function localized<T extends object>(
  value: T,
  key: Extract<keyof T, string>,
  locale: Locale,
): string {
  const fields = value as Record<string, unknown>;
  const he = fields[key];
  const en = fields[`${key}_en`];
  if (locale === "en" && typeof en === "string" && en.trim()) return en;
  return typeof he === "string" ? he : "";
}
export function termName(
  term: Pick<Term, "name" | "name_en">,
  locale: Locale,
): string {
  return locale === "en" && term.name_en?.trim() ? term.name_en : term.name;
}
