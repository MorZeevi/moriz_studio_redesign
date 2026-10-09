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
  type ResolvedTheme,
  THEME_MEDIA,
  THEME_STORAGE_KEY,
  type ThemePreference,
  themePreference,
} from "@/lib/theme";

type Snapshot = `${ThemePreference}:${ResolvedTheme}`;
let snapshot: Snapshot = "system:light";
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
    if (preference === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // An in-memory choice still works when storage is unavailable.
  }
  apply(preference);
}

type ThemeContext = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: typeof setPreference;
  toggle: () => void;
};
const Context = createContext<ThemeContext | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useLayoutEffect(() => {
    let preference = themePreference(
      document.documentElement.dataset.themePreference ?? null,
    );
    try {
      preference = themePreference(localStorage.getItem(THEME_STORAGE_KEY));
    } catch {}
    // Also restores pre-paint attributes after Next's development remount.
    apply(preference);
    const media = window.matchMedia(THEME_MEDIA);
    const onMedia = () => {
      if (snapshot.startsWith("system:")) apply("system");
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
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
  }, []);

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
  return <Context value={context}>{children}</Context>;
}

export function useTheme() {
  const context = useContext(Context);
  if (!context) throw new Error("Theme controls require ThemeProvider");
  return context;
}
