import { themeBootstrap as kitThemeBootstrap } from "../../design-system/react/theme-script";

export type {
  ResolvedTheme,
  ThemePreference,
} from "../../design-system/react/theme-script";
export {
  THEME_MEDIA,
  themePreference,
} from "../../design-system/react/theme-script";

/** The site's key; keeps readers' saved choices from before the kit. */
export const THEME_STORAGE_KEY = "moriz:theme";

// Runs synchronously in the public root's head, before CSS paints the canvas.
export const themeBootstrap = kitThemeBootstrap(THEME_STORAGE_KEY);
