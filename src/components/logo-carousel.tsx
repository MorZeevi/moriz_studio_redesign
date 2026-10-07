"use client";

import {
  type CSSProperties,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
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
  const [paused, setPaused] = useState(false);
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
        {!reducedMotion && (
          <button
            type="button"
            className="logo-carousel-pause"
            aria-label={paused ? labels.resume : labels.pause}
            aria-pressed={paused}
            onClick={() => setPaused((value) => !value)}
          >
            <span aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span>
          </button>
        )}
        <div className="logo-carousel-window" dir="ltr">
          <LogoLoop
            logos={logos}
            speed={paused || reducedMotion ? 0 : 60}
            direction="left"
            style={
              {
                "--logoloop-logoHeight": "var(--space-12)",
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
