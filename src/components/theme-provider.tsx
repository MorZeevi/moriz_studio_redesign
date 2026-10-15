import type { ReactNode } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import { ThemeProvider as KitThemeProvider } from "../../design-system/react/theme";

export { useTheme } from "../../design-system/react/theme";

/** The design-system provider on the site's storage key. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <KitThemeProvider storageKey={THEME_STORAGE_KEY}>
      {children}
    </KitThemeProvider>
  );
}
