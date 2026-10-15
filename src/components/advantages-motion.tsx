"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type ReactNode, useLayoutEffect, useRef } from "react";

/** Move the cards as a group on desktop, and on individual entry when stacked. */
export function AdvantagesMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const cards = [
      ...element.querySelectorAll<HTMLElement>(".advantages-card"),
    ];
    const desktop = window.matchMedia("(min-width: 64rem)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    gsap.registerPlugin(ScrollTrigger);
    let tweens: gsap.core.Tween[] = [];
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let active = true;

    const clear = () => {
      for (const tween of tweens) {
        tween.scrollTrigger?.kill();
        tween.kill();
      }
      tweens = [];
      gsap.set(cards, { clearProps: "transform" });
    };
    const refresh = () => {
      if (!active) return;
      for (const tween of tweens) {
        tween.scrollTrigger?.refresh();
        // Deep links and layout changes should start at the current scroll.
        tween.totalProgress(tween.scrollTrigger?.progress ?? 0);
      }
    };
    const build = () => {
      clear();
      if (reducedMotion.matches || !desktop.matches) return;
      if (desktop.matches) {
        // DOM order is the reading order: right to left on the Hebrew page.
        tweens.push(
          gsap.fromTo(
            cards,
            { y: 40 },
            {
              y: 0,
              duration: 1,
              stagger: 0.12,
              ease: "none",
              scrollTrigger: {
                trigger: element,
                start: "top 90%",
                end: "top 45%",
                scrub: 0.4,
              },
            },
          ),
        );
      }
      refresh();
    };
    const scheduleRefresh = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(refresh, 150);
    };

    build();
    desktop.addEventListener("change", build);
    reducedMotion.addEventListener("change", build);
    window.addEventListener("resize", scheduleRefresh);
    const size = new ResizeObserver(scheduleRefresh);
    size.observe(document.body);
    size.observe(element);
    document.fonts.ready.then(() => {
      if (active) scheduleRefresh();
    });
    return () => {
      active = false;
      clearTimeout(refreshTimer);
      size.disconnect();
      desktop.removeEventListener("change", build);
      reducedMotion.removeEventListener("change", build);
      window.removeEventListener("resize", scheduleRefresh);
      clear();
    };
  }, []);

  return (
    <div
      ref={root}
      className="advantages-grid grid gap-4 lg:grid-cols-3 lg:gap-6"
    >
      {children}
    </div>
  );
}
