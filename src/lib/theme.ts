export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "moriz:theme";
export const THEME_MEDIA = "(prefers-color-scheme: dark)";

export function themePreference(value: string | null): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}

// Runs synchronously in the public root's head, before CSS paints the canvas.
export const themeBootstrap = `(()=>{let p="system";try{const v=localStorage.getItem("${THEME_STORAGE_KEY}");if(v==="light"||v==="dark")p=v}catch{}const r=p==="system"?(matchMedia("${THEME_MEDIA}").matches?"dark":"light"):p;const h=document.documentElement;h.dataset.theme=r;h.dataset.themePreference=p})()`;
