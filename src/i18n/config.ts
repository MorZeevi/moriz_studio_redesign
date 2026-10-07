export const locales = ["he", "en"] as const;
export type Locale = (typeof locales)[number];

// English is planned, but must not be enabled before its content is supplied.
export const enabledLocales = ["he"] as const satisfies readonly Locale[];
export type EnabledLocale = (typeof enabledLocales)[number];
export const defaultLocale = "he" satisfies Locale;

export const localeConfig = {
  he: { direction: "rtl" },
  en: { direction: "ltr" },
} as const satisfies Record<Locale, { direction: "rtl" | "ltr" }>;

export function isEnabledLocale(value: string): value is EnabledLocale {
  return enabledLocales.some((locale) => locale === value);
}
