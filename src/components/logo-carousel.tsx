"use client";

import { type CSSProperties, useMemo, useSyncExternalStore } from "react";
import { homepageLogos } from "@/content/homepage-logos";
import type { SiteContent } from "@/i18n/dictionaries";
import LogoLoop, { type LogoItem } from "./react-bits/LogoLoop";

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(callback: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const readMotion = () => window.matchMedia(motionQuery).matches;
const serverMotion = () => true;

export function LogoCarousel({
  labels,
}: {
  labels: SiteContent["logoCarousel"];
}) {
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    readMotion,
    serverMotion,
  );
  const logos = useMemo<LogoItem[]>(
    () =>
      homepageLogos.length > 0
        ? homepageLogos.map(({ src, alt, ratio, scale, caption }) => {
            const style = {
              "--logo-src": `url(${src})`,
              "--logo-ratio": ratio,
              "--logo-scale": scale,
            } as CSSProperties;
            return {
              // An emblem with its name set beside it, read as one image.
              node: caption ? (
                <span
                  className="client-logo-lockup"
                  dir="rtl"
                  role="img"
                  aria-label={alt}
                >
                  <span className="client-logo" style={style} />
                  <span className="client-logo-caption" aria-hidden="true">
                    {caption.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </span>
                </span>
              ) : (
                <span
                  className="client-logo"
                  role="img"
                  aria-label={alt}
                  style={style}
                />
              ),
              title: alt,
            };
          })
        : Array.from({ length: 6 }, () => ({
            node: (
              <span className="logo-placeholder" dir="rtl">
                {labels.placeholder}
              </span>
            ),
          })),
    [labels.placeholder],
  );

  return (
    <div className="logo-carousel" data-logo-carousel>
      <div className="logo-carousel-shell">
        <div className="logo-carousel-window" dir="ltr">
          <LogoLoop
            logos={logos}
            speed={reducedMotion ? 0 : 12}
            direction="left"
            style={
              {
                "--logoloop-logoHeight": "var(--space-8)",
                "--logoloop-gap": "var(--space-16)",
              } as CSSProperties
            }
            hoverSpeed={0}
            ariaLabel={labels.label}
          />
        </div>
      </div>
    </div>
  );
}
