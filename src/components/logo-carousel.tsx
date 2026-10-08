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
        ? homepageLogos
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
      <div className="hero-shell logo-carousel-shell">
        <div className="logo-carousel-window" dir="ltr">
          <LogoLoop
            logos={logos}
            speed={reducedMotion ? 0 : 60}
            direction="left"
            style={
              {
                "--logoloop-logoHeight": "var(--space-12)",
                "--logoloop-gap": "var(--space-16)",
              } as CSSProperties
            }
            hoverSpeed={0}
            fadeOut
            fadeOutColor="var(--color-background)"
            ariaLabel={labels.label}
          />
        </div>
      </div>
    </div>
  );
}
