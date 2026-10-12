"use client";
import { useEffect, useRef, useSyncExternalStore } from "react";

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(callback: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const readMotion = () => window.matchMedia(motionQuery).matches;
const serverMotion = () => true;

/**
 * A muted, looping cover video that plays only while on screen, and stays on
 * its poster for readers who prefer reduced motion.
 */
export function CoverVideo({
  src,
  poster,
  label,
  className,
  loop = true,
}: {
  src: string;
  poster?: string;
  label: string;
  className?: string;
  loop?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    readMotion,
    serverMotion,
  );
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let visible = false;
    const sync = () => {
      const play = visible && !reducedMotion && !document.hidden;
      if (play && element.paused) element.play().catch(() => {});
      else if (!play && !element.paused) element.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [reducedMotion]);
  return (
    <video
      ref={video}
      className={className}
      src={src}
      poster={poster}
      muted
      loop={loop}
      playsInline
      preload={poster ? "none" : "metadata"}
      aria-label={label}
    />
  );
}
