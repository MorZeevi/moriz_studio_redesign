"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "./site-footer.module.css";

/**
 * Reveal the footer beneath the contact section as that section leaves view.
 * Desktop only: on phones the scrubbed footer shook, so it stays static there.
 */
export function FooterParallax({ children }: { children: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const surface = surfaceRef.current;
    if (!stage || !surface) return;
    const motion = window.matchMedia(
      "(min-width: 64rem) and (prefers-reduced-motion: no-preference)",
    );
    let tween: gsap.core.Tween | undefined;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let active = true;

    const refresh = () => {
      if (!active) return;
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => tween?.scrollTrigger?.refresh(), 100);
    };

    const setup = () => {
      tween?.scrollTrigger?.kill();
      tween?.kill();
      gsap.set(surface, { clearProps: "transform" });
      if (!motion.matches) return;
      gsap.registerPlugin(ScrollTrigger);
      tween = gsap.fromTo(
        surface,
        // Keep the reveal within the empty top gutter. Moving navigation
        // under the contact band makes links unreachable when focused or
        // scrolled into view, especially in a footer taller than the viewport.
        {
          y: () => {
            const cover = stage.previousElementSibling;
            const footer = surface.querySelector("footer");
            const gutter = footer
              ? Number.parseFloat(getComputedStyle(footer).paddingBlockStart)
              : 0;
            return -Math.min(
              gutter,
              window.innerHeight,
              cover instanceof HTMLElement
                ? cover.offsetHeight
                : window.innerHeight,
            );
          },
        },
        {
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: stage,
            start: "top bottom",
            // A tall mobile footer must settle when its top reaches the
            // viewport; otherwise the contact band covers its first links.
            // Short footers settle at the bottom of the document instead.
            end: () =>
              stage.offsetHeight >= window.innerHeight
                ? "top top"
                : "bottom bottom",
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
      refresh();
    };

    const pageSize = new ResizeObserver(refresh);
    pageSize.observe(document.body);
    document.fonts.ready.then(refresh);
    window.addEventListener("load", refresh);
    setup();
    motion.addEventListener("change", setup);
    return () => {
      active = false;
      clearTimeout(refreshTimer);
      pageSize.disconnect();
      window.removeEventListener("load", refresh);
      motion.removeEventListener("change", setup);
      tween?.scrollTrigger?.kill();
      tween?.kill();
      gsap.set(surface, { clearProps: "transform" });
    };
  }, []);

  return (
    <div ref={stageRef} className={styles.footerStage} data-footer-stage>
      <div
        ref={surfaceRef}
        className={styles.footerSurface}
        data-footer-surface
      >
        {children}
      </div>
    </div>
  );
}
