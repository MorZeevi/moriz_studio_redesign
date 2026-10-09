"use client";

import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { SiteContent } from "@/i18n/dictionaries";
import styles from "./hero-video.module.css";

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(callback: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const readMotion = () => window.matchMedia(motionQuery).matches;
const serverMotion = () => true;

export function HeroVideo({ labels }: { labels: SiteContent["hero"]["video"] }) {
  const slot = useRef<HTMLDivElement>(null);
  const target = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [manualPause, setManualPause] = useState<boolean | null>(null);
  const [playing, setPlaying] = useState(false);
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
    const element = video.current;
    if (!element) return;
    const bounds = element.getBoundingClientRect();
    let visible = bounds.bottom > 0 && bounds.top < innerHeight;
    const sync = () => {
      const shouldPlay =
        visible &&
        !paused &&
        !document.hidden &&
        document.documentElement.dataset.pixelReveal !== "active";
      if (shouldPlay && element.paused) element.play().catch(() => {});
      else if (!shouldPlay && !element.paused) element.pause();
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
      visibility.disconnect();
      opening.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [paused]);

  useEffect(() => {
    const start = slot.current;
    const element = target.current;
    const end = document.querySelector<HTMLElement>("[data-hero-video-end]");
    // Keyed on React's motion state, not gsap.matchMedia: a matchMedia change
    // reverts and refreshes every ScrollTrigger and drops the reader to the top.
    if (!start || !element || !end || reducedMotion) return;
    gsap.registerPlugin(Flip, ScrollTrigger);
    let timeline: gsap.core.Timeline | undefined;
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    let active = true;
    const build = () => {
      // A late fonts.ready after cleanup would leave an orphan timeline fighting this one.
      if (!active) return;
      timeline?.kill();
      // Flip measures both slots, so start from the unscaled hero box.
      gsap.set(element, { clearProps: "all" });
      timeline = gsap.timeline({
        scrollTrigger: {
          trigger: start,
          // The corner slot is already in view at load; grow from the first scroll.
          start: "clamp(top bottom)",
          endTrigger: end,
          end: "center center",
          scrub: 0.25,
        },
      });
      timeline.add(
        Flip.fit(element, end, {
          duration: 1,
          ease: "none",
          scale: false,
        }) as gsap.core.Tween,
      );
    };
    const rebuild = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 150);
    };
    // The end slot is hidden until data-pixel-reveal exists (set on client
    // navigation by PixelReveal), so remeasure when it changes.
    const opening = new MutationObserver(rebuild);
    opening.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-pixel-reveal"],
    });
    build();
    document.fonts.ready.then(build);
    window.addEventListener("resize", rebuild);
    return () => {
      active = false;
      opening.disconnect();
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", rebuild);
      timeline?.kill();
      gsap.set(element, { clearProps: "all" });
    };
  }, [reducedMotion]);

  return (
    <div className="hero-video">
      <div ref={slot} className="hero-video-slot" data-hero-video>
        <div ref={target} className={styles.target} data-hero-video-target>
          <video
            ref={video}
            className={styles.video}
            src="/videos/hero-showreel.mp4"
            poster="/videos/hero-showreel-poster.jpg"
            aria-label={labels.label}
            muted
            loop
            playsInline
            preload="metadata"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
          {ready && (
            <button
              type="button"
              className={styles.control}
              aria-label={playing ? labels.pause : labels.resume}
              title={playing ? labels.pause : labels.resume}
              onClick={() => setManualPause(playing)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                {playing ? (
                  <path d="M8 5v14M16 5v14" />
                ) : (
                  <path d="m9 5 11 7-11 7Z" />
                )}
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
