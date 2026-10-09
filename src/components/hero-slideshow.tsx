"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { SiteContent } from "@/i18n/dictionaries";
import styles from "./hero-slideshow.module.css";

const slides = [
  "snapset-0acc0316.webp",
  "snapset-4abd3d52.webp",
  "snapset-5c33be82.webp",
  "snapset-62743e99.webp",
  "snapset-a94b6730.webp",
  "snapset-6bb46da3.webp",
  "snapset-8b23a1d3.webp",
  "snapset-93c8d6a9.webp",
  "snapset-f676701b.webp",
];
const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(callback: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const readMotion = () => window.matchMedia(motionQuery).matches;
const serverMotion = () => true;

export function HeroSlideshow({
  labels,
}: {
  labels: SiteContent["hero"]["slideshow"];
}) {
  const frame = useRef<HTMLDivElement>(null);
  const loaded = useRef(new Set<number>());
  const failed = useRef(new Set<number>());
  const [active, setActive] = useState(0);
  const [manualPause, setManualPause] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    readMotion,
    serverMotion,
  );
  const paused = manualPause ?? reducedMotion;

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const bounds = element.getBoundingClientRect();
    let visible = bounds.bottom > 0 && bounds.top < innerHeight;
    const tick = () => {
      // Recheck at the tick as well: an observer callback can arrive after a
      // scroll or tab change, especially when the browser is busy.
      const bounds = element.getBoundingClientRect();
      if (document.hidden || bounds.bottom <= 0 || bounds.top >= innerHeight) {
        clearInterval(timer);
        timer = undefined;
        return;
      }
      setActive((current) => {
        for (let offset = 1; offset < slides.length; offset++) {
          const next = (current + offset) % slides.length;
          if (failed.current.has(next)) continue;
          // Keep the current image until its successor has loaded; no blank frame.
          return loaded.current.has(next) ? next : current;
        }
        return current;
      });
    };
    const sync = () => {
      const playing =
        visible &&
        !paused &&
        !document.hidden &&
        document.documentElement.dataset.pixelReveal !== "active";
      if (playing && timer === undefined) timer = setInterval(tick, 2000);
      else if (!playing && timer !== undefined) {
        clearInterval(timer);
        timer = undefined;
      }
    };
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    const opening = new MutationObserver(sync);
    visibility.observe(element);
    opening.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-pixel-reveal"],
    });
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      clearInterval(timer);
      visibility.disconnect();
      opening.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [paused]);

  return (
    <div
      ref={frame}
      className="hero-slideshow"
      data-hero-slideshow
      data-slide={active + 1}
    >
      {slides.map((name, index) => (
        <div
          key={name}
          className={styles.slide}
          data-active={index === active}
          aria-hidden={index !== active}
        >
          <Image
            src={`/images/hero-slideshow/${name}`}
            alt={labels.images[index]}
            fill
            sizes="(min-width: 1536px) 336px, (min-width: 1024px) 23vw, (min-width: 683px) 480px, 75vw"
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : undefined}
            className={styles.image}
            onLoad={() => loaded.current.add(index)}
            onError={() => failed.current.add(index)}
          />
        </div>
      ))}
      {ready && (
        <button
          type="button"
          className={styles.control}
          aria-label={paused ? labels.resume : labels.pause}
          title={paused ? labels.resume : labels.pause}
          onClick={() => setManualPause(!paused)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            {paused ? (
              <path d="m9 5 11 7-11 7Z" />
            ) : (
              <path d="M8 5v14M16 5v14" />
            )}
          </svg>
        </button>
      )}
    </div>
  );
}
