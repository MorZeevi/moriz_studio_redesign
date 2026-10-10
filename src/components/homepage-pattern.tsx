"use client";

import { type ReactNode, useLayoutEffect, useRef } from "react";
import styles from "./homepage-pattern.module.css";

/** A clipped background for the hero and advantages, ending before Projects. */
export function HomepagePattern({ children }: { children: ReactNode }) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const scope = scopeRef.current;
    const layer = layerRef.current;
    if (!scope || !layer) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let rate = 0;
    let scopeTop = 0;
    let scopeHeight = 0;
    let visible = true;
    let active = true;

    const update = () => {
      frame = 0;
      // The single wordmark travels slightly more slowly than the content.
      const localScroll = Math.max(
        0,
        Math.min(scopeHeight, window.scrollY - scopeTop),
      );
      const shift = reducedMotion.matches ? 0 : localScroll * rate;
      layer.style.setProperty("--pattern-shift", `${shift}px`);
    };

    const schedule = () => {
      if (visible && !document.hidden && !reducedMotion.matches && !frame) {
        frame = requestAnimationFrame(update);
      }
    };

    const measure = () => {
      cancelAnimationFrame(frame);
      const bounds = scope.getBoundingClientRect();
      scopeTop = bounds.top + window.scrollY;
      scopeHeight = bounds.height;
      visible = bounds.bottom > 0 && bounds.top < window.innerHeight;
      const style = getComputedStyle(layer);
      rate = Number.parseFloat(style.getPropertyValue("--pattern-rate")) || 0;
      update();
    };

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (reducedMotion.matches) update();
      else schedule();
    };

    // Initialize restored/deep-link scroll positions before the first paint.
    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(scope);
    resizeObserver.observe(layer);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    visibilityObserver.observe(scope);
    document.fonts.ready.then(() => {
      if (active) measure();
    });
    window.addEventListener("scroll", schedule, { passive: true });
    reducedMotion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);

    return () => {
      active = false;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      window.removeEventListener("scroll", schedule);
      reducedMotion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <div ref={scopeRef} className={styles.scope} data-homepage-pattern-scope>
      <div className={styles.viewport} data-homepage-pattern aria-hidden="true">
        <div ref={layerRef} className={styles.layer} />
      </div>
      {children}
    </div>
  );
}
