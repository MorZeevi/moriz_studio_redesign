// Server-safe theme helpers. No "use client" here, so a Server Component
// layout can call themeBootstrap() and inline its result in <head>.

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const DEFAULT_THEME_STORAGE_KEY = "mz:theme";
export const THEME_MEDIA = "(prefers-color-scheme: dark)";

export function themePreference(
  value: string | null | undefined,
): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}

/**
 * Inline script for <head>, before CSS paints. It sets <html data-theme> so
 * there is no flash of the wrong theme. Use the same key as ThemeProvider.
 */
export function themeBootstrap(storageKey = DEFAULT_THEME_STORAGE_KEY) {
  const key = JSON.stringify(storageKey);
  return `(()=>{let p="system";try{const v=localStorage.getItem(${key});if(v==="light"||v==="dark")p=v}catch{}const r=p==="system"?(matchMedia("${THEME_MEDIA}").matches?"dark":"light"):p;const h=document.documentElement;h.dataset.theme=r;h.dataset.themePreference=p})()`;
}
