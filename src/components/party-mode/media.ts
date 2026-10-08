export const partyPoster = "/party-mode/disco-ball.webp";

// Apple WebKit uses HEVC alpha; Chromium's HEVC decoder does not preserve
// that alpha channel. All iOS browsers use the Apple decoder.
export function partyVideoSource() {
  const compact = !window.matchMedia("(min-width: 64rem)").matches;
  const appleMobile =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const safari =
    /AppleWebKit/.test(navigator.userAgent) &&
    !/Chrome|Chromium|Edg|OPR|Firefox/.test(navigator.userAgent);
  const hevc =
    (appleMobile || safari) &&
    document.createElement("video").canPlayType('video/mp4; codecs="hvc1"');
  return `/party-mode/disco-ball${compact ? "-mobile" : ""}.${hevc ? "mov" : "webm"}`;
}

export function warmPartyAssets() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const image = new Image();
    image.src = partyPoster;
    return () => {
      image.src = "";
    };
  }
  const image = new Image();
  image.src = partyPoster;
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "metadata";
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    clearTimeout(timeout);
    video.removeEventListener("loadedmetadata", release);
    video.removeEventListener("error", release);
    video.pause();
    video.removeAttribute("src");
    video.load();
  };
  const timeout = window.setTimeout(release, 6000);
  video.addEventListener("loadedmetadata", release, { once: true });
  video.addEventListener("error", release, { once: true });
  video.src = partyVideoSource();
  video.load();
  return release;
}
