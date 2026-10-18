import type { Highlight, ProjectMediaItem } from "@/types/project";

export type HoverSurface = "homepage" | "projects";
export function setHoverMedia(
  media: ProjectMediaItem[],
  surface: HoverSurface,
  src: string | null,
): ProjectMediaItem[] {
  const flag = surface === "homepage" ? "hover_homepage" : "hover_projects";
  return media.map((item) => ({
    ...item,
    [flag]: item.src === src ? true : undefined,
  }));
}

/** Reuse an existing user fact rather than creating a duplicate. */
export function userCountHighlight(highlights: Highlight[]) {
  return (
    highlights.find((h) => h.id === "user-count") ??
    highlights.find((h) => ["מספר משתמשים", "משתמשים"].includes(h.label.trim()))
  );
}

export function setUserCount(
  highlights: Highlight[],
  value: string,
): Highlight[] {
  const existing = userCountHighlight(highlights);
  if (!value.trim()) return highlights.filter((h) => h.id !== existing?.id);
  if (existing)
    return highlights.map((h) => (h.id === existing.id ? { ...h, value } : h));
  return [
    ...highlights,
    {
      id: "user-count",
      value,
      label: "משתמשים",
      label_en: "users",
      on_homepage: highlights.some((h) => h.on_homepage) ? undefined : true,
      on_archive: highlights.some((h) => h.on_archive) ? undefined : true,
    },
  ];
}
