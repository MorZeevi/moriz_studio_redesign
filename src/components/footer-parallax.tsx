"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "./site-footer.module.css";

/** Reveal the footer beneath the contact section as that section leaves view. */
export function FooterParallax({ children }: { children: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const surface = surfaceRef.current;
    if (!stage || !surface) return;
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
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
        // Never rise further than the contact band above can cover, or the
        // footer would peek out over the section before it.
        {
          y: () => {
            const cover = stage.previousElementSibling;
            return -Math.min(
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
            // The footer can be shorter than the viewport, so its top may
            // never reach the top; settle when the page bottoms out instead.
            end: "bottom bottom",
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
      <div ref={surfaceRef} className={styles.footerSurface} data-footer-surface>
        {children}
      </div>
    </div>
  );
}
