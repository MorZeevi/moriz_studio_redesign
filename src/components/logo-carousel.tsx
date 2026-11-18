"use client";

import { type CSSProperties, useMemo, useSyncExternalStore } from "react";
import { homepageLogos } from "@/content/homepage-logos";
import { type EnabledLocale, localeConfig } from "@/i18n/config";
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

// Phones and tablets: a faster drift the visitor can swipe.
const mobileQuery = "(max-width: 63.999rem)";
function subscribeMobile(callback: () => void) {
  const query = window.matchMedia(mobileQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const readMobile = () => window.matchMedia(mobileQuery).matches;
const serverMobile = () => false;

export function LogoCarousel({
  labels,
  locale,
}: {
  labels: SiteContent["logoCarousel"];
  locale: EnabledLocale;
}) {
  // The strip itself runs left to right; lockups follow the page language.
  const direction = localeConfig[locale].direction;
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    readMotion,
    serverMotion,
  );
  const mobile = useSyncExternalStore(
    subscribeMobile,
    readMobile,
    serverMobile,
  );
  const logos = useMemo<LogoItem[]>(
    () =>
      homepageLogos.length > 0
        ? homepageLogos.map((logo) => {
            const { src, ratio, scale } = logo;
            const english = locale === "en";
            const alt = (english && logo.altEn) || logo.alt;
            const caption = (english && logo.captionEn) || logo.caption;
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
                  dir={direction}
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
              <span className="logo-placeholder" dir={direction}>
                {labels.placeholder}
              </span>
            ),
          })),
    [labels.placeholder, locale, direction],
  );

  return (
    <div className="logo-carousel" data-logo-carousel>
      <div className="logo-carousel-shell">
        <div className="logo-carousel-window" dir="ltr">
          <LogoLoop
            logos={logos}
            speed={reducedMotion ? 0 : mobile ? 36 : 12}
            direction="left"
            style={
              {
                "--logoloop-logoHeight": "var(--space-8)",
                "--logoloop-gap": "var(--space-16)",
              } as CSSProperties
            }
            // A tap counts as hover on touch screens; it would stall the strip.
            hoverSpeed={mobile ? undefined : 0}
            pauseOnHover={!mobile}
            draggable={mobile}
            ariaLabel={labels.label}
          />
        </div>
      </div>
    </div>
  );
}
