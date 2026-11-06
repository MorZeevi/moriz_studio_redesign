export const PIXEL_REVEAL_STORAGE_KEY = "moriz:pixel-reveal";
export const PIXEL_REVEAL_DEADLINE = 3000;
/** Keep the hero layout ready without covering first content. */
export function pixelRevealBootstrap(_locale: string) {
  return `document.documentElement.dataset.pixelReveal = "skip";`;
}
