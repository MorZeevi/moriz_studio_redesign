"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

import {
  DEFAULT_THEME_STORAGE_KEY,
  type ResolvedTheme,
  THEME_MEDIA,
  type ThemePreference,
  themePreference,
} from "./theme-script";

type Snapshot = `${ThemePreference}:${ResolvedTheme}`;
let snapshot: Snapshot = "system:light";
let storageKey = DEFAULT_THEME_STORAGE_KEY;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const getSnapshot = () => snapshot;
const getServerSnapshot = (): Snapshot => "system:light";

function apply(preference: ThemePreference) {
  const resolved =
    preference === "system"
      ? window.matchMedia(THEME_MEDIA).matches
        ? "dark"
        : "light"
      : preference;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themePreference = preference;
  const next: Snapshot = `${preference}:${resolved}`;
  if (next !== snapshot) {
    snapshot = next;
    for (const listener of listeners) listener();
  }
}

function setPreference(preference: ThemePreference) {
  try {
    if (preference === "system") localStorage.removeItem(storageKey);
    else localStorage.setItem(storageKey, preference);
  } catch {
    // An in-memory choice still works when storage is unavailable.
  }
  apply(preference);
}

type ThemeContextValue = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
  toggle: () => void;
};
const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Follows the OS until the reader picks a theme; syncs across tabs. Needs
 * css/theme.css and the themeBootstrap script. */
export function ThemeProvider({
  children,
  storageKey: key = DEFAULT_THEME_STORAGE_KEY,
}: {
  children: ReactNode;
  storageKey?: string;
}) {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useLayoutEffect(() => {
    storageKey = key;
    let preference = themePreference(
      document.documentElement.dataset.themePreference,
    );
    try {
      preference = themePreference(localStorage.getItem(key));
    } catch {}
    // Also restores pre-paint attributes after a development remount.
    apply(preference);
    const media = window.matchMedia(THEME_MEDIA);
    const onMedia = () => {
      if (snapshot.startsWith("system:")) apply("system");
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key && event.key !== null) return;
      try {
        if (event.storageArea !== localStorage) return;
      } catch {
        return;
      }
      apply(themePreference(event.newValue));
    };
    media.addEventListener("change", onMedia);
    window.addEventListener("storage", onStorage);
    return () => {
      media.removeEventListener("change", onMedia);
      window.removeEventListener("storage", onStorage);
    };
  }, [key]);

  const context = useMemo(() => {
    const [preference, resolvedTheme] = value.split(":") as [
      ThemePreference,
      ResolvedTheme,
    ];
    return {
      preference,
      resolvedTheme,
      setPreference,
      toggle: () => setPreference(resolvedTheme === "dark" ? "light" : "dark"),
    };
  }, [value]);
  return <ThemeContext value={context}>{children}</ThemeContext>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("Theme controls require ThemeProvider");
  return context;
}

/** Light/dark icon toggle. Labels name the action, in the page language. */
export function ThemeToggle({
  labels,
  className,
}: {
  labels: { switchToLight: string; switchToDark: string };
  className?: string;
}) {
  const { resolvedTheme, toggle } = useTheme();
  const action =
    resolvedTheme === "dark" ? labels.switchToLight : labels.switchToDark;

  return (
    <button
      type="button"
      className={`theme-toggle${className ? ` ${className}` : ""}`}
      data-theme-controls
      aria-label={action}
      title={action}
      aria-pressed={resolvedTheme === "dark"}
      onClick={toggle}
    >
      <svg
        className="theme-toggle__moon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z" />
      </svg>
      <svg
        className="theme-toggle__sun"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
      </svg>
    </button>
  );
}
