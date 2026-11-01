/** Noon UTC keeps the written calendar day stable in feeds and the sitemap. */
export function articleInstant(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

export function formatArticleDate(isoDate: string) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(articleInstant(isoDate));
}

export function readingTimeLabel(minutes: number, one: string, many: string) {
  return minutes === 1 ? one : `${minutes} ${many}`;
}
