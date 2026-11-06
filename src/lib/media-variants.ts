export const MEDIA_WIDTHS = [
  320, 640, 750, 1080, 1200, 1600, 1920, 2400,
] as const;
export function transformableMedia(src: string) {
  return /^\/media\/[a-f0-9-]+\/[a-f0-9-]+\.(png|jpe?g|webp|avif)$/i.test(src);
}
export function mediaVariant(src: string, width: number) {
  if (!transformableMedia(src)) return src;
  const preset = MEDIA_WIDTHS.find((value) => value >= width) ?? 2400;
  return `${src}?w=${preset}`;
}
export function mediaSrcSet(src: string) {
  return transformableMedia(src)
    ? MEDIA_WIDTHS.map((width) => `${mediaVariant(src, width)} ${width}w`).join(
        ", ",
      )
    : undefined;
}
export function parseMediaWidth(value: string | null): number | null {
  if (value === null) return null;
  if (!MEDIA_WIDTHS.some((width) => String(width) === value))
    throw new Error("Unsupported media width");
  return Number(value);
}
