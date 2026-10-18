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
const mobileQuery = "(max-width: 63.999rem)";
function subscribeMobile(callback: () => void) {
  const query = window.matchMedia(mobileQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const readMobile = () => window.matchMedia(mobileQuery).matches;
const serverMobile = () => true;

export function HeroVideo({
  labels,
}: {
  labels: SiteContent["hero"]["video"];
}) {
  const slot = useRef<HTMLDivElement>(null);
  const target = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [manualPause, setManualPause] = useState<boolean | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [mobileStarted, setMobileStarted] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    readMotion,
    serverMotion,
  );
  const paused = manualPause ?? reducedMotion;
  const mobile = useSyncExternalStore(
    subscribeMobile,
    readMobile,
    serverMobile,
  );

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
        (!mobile || mobileStarted) &&
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
  }, [paused, mobile, mobileStarted]);

  useEffect(() => {
    const start = slot.current;
    const element = target.current;
    const end = document.querySelector<HTMLElement>("[data-hero-video-end]");
    const stage = end?.parentElement;
    const logos = start
      ?.closest("#hero")
      ?.querySelector<HTMLElement>("[data-logo-carousel]");
    // Keyed on React's motion state, not gsap.matchMedia: a matchMedia change
    // reverts and refreshes every ScrollTrigger and drops the reader to the top.
    if (!start || !element || !end || reducedMotion || mobile) return;
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
      if (logos) gsap.set(logos, { clearProps: "transform" });
      stage?.style.removeProperty("--hero-logo-height");
      // Preserve the strip's original hero position at scroll zero. Its own
      // space is reserved after the end slot as it follows the growing video.
      const logoShift =
        logos && stage
          ? end.getBoundingClientRect().bottom +
            Number.parseFloat(getComputedStyle(stage).paddingBottom) -
            logos.getBoundingClientRect().top
          : 0;
      if (logos && stage) {
        stage.style.setProperty(
          "--hero-logo-height",
          `${logos.offsetHeight}px`,
        );
      }
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
      if (logos) {
        timeline.to(logos, { y: logoShift, duration: 1, ease: "none" }, 0);
      }
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
      if (logos) gsap.set(logos, { clearProps: "transform" });
      stage?.style.removeProperty("--hero-logo-height");
    };
  }, [reducedMotion, mobile]);

  return (
    <div className="hero-video">
      <div ref={slot} className="hero-video-slot" data-hero-video>
        <div ref={target} className={styles.target} data-hero-video-target>
          <video
            ref={video}
            className={styles.video}
            src={
              !mobile || mobileStarted ? "/videos/hero-showreel.mp4" : undefined
            }
            poster={
              mobile
                ? "/videos/hero-showreel-poster-mobile.webp"
                : "/videos/hero-showreel-poster.webp"
            }
            aria-label={labels.label}
            muted
            loop
            playsInline
            preload={mobile && !mobileStarted ? "none" : "metadata"}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
          {ready && mobile && !mobileStarted && (
            <button
              type="button"
              className={styles.posterPlay}
              aria-label={labels.resume}
              onClick={() => {
                setManualPause(false);
                setMobileStarted(true);
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m8 4 12 8-12 8V4Z" fill="currentColor" />
              </svg>
            </button>
          )}
          {ready && (!mobile || mobileStarted) && (
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
