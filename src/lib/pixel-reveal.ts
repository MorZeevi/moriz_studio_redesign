export const PIXEL_REVEAL_STORAGE_KEY = "moriz:pixel-reveal";
export const PIXEL_REVEAL_DEADLINE = 3000;

/** Static, first-party initialization: runs in the head before the cover paints. */
export function pixelRevealBootstrap(locale: string) {
  const homepage = JSON.stringify(`/${locale}`);
  const key = JSON.stringify(PIXEL_REVEAL_STORAGE_KEY);
  return `(() => {
    if (location.pathname !== ${homepage} && location.pathname !== ${homepage} + "/") return;
    let seen = false;
    try { seen = !!sessionStorage.getItem(${key}); } catch {}
    const skip = seen || (location.hash && location.hash !== "#top") ||
      matchMedia("(prefers-reduced-motion: reduce)").matches || document.hidden;
    document.documentElement.dataset.pixelReveal = skip ? "skip" : "active";
    if (!skip) document.documentElement.dataset.pixelRevealStarted = String(performance.now());
  })()`;
}
