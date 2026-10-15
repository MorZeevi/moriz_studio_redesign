"use client";

import { type ReactNode, useLayoutEffect, useRef } from "react";

// --color-secondary (#dddc8c) as channels, for the ink choice below.
const SECONDARY = [221, 220, 140];

const channelsOf = (color: string) =>
  (color.match(/[\d.]+/g) ?? ["251", "251", "255"]).slice(0, 3).map(Number);

const luminance = (channels: number[]) =>
  channels.reduce((sum, channel, index) => {
    const value = channel / 255;
    const linear =
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    return sum + linear * [0.2126, 0.7152, 0.0722][index];
  }, 0);

/**
 * Fades the canvas to the secondary colour while its sections cross the
 * viewport, with the same entry/exit curve as Projects. The fill is a fixed
 * layer under the site grain, so the grain stays on top and the canvas
 * variables Projects owns are left alone. The reveal and ink live on <body>
 * so the whole main column takes the ink while the fill is up.
 */
export function SecondaryScrollSurface({ children }: { children: ReactNode }) {
  const surfaceRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia("(max-width: 63.999rem)");
    const body = document.body;
    let frame = 0;
    let reveal = 0;
    let target = 0;
    let lastTime = 0;
    let geometryDirty = true;
    let nearby = false;

    const measure = () => {
      geometryDirty = false;
      const { top, bottom } = surface.getBoundingClientRect();
      const height = window.innerHeight;
      // Near the end of the page the bottom edge cannot travel up to 15%, so
      // the exit also completes at the furthest point the page can scroll to.
      const remaining =
        document.documentElement.scrollHeight - height - window.scrollY;
      const exitEdge = Math.max(height * 0.15, bottom - remaining);
      const progress = Math.max(
        0,
        Math.min(
          1,
          (height * 0.85 - top) / (height * 0.45),
          (bottom - exitEdge) / (height * 0.45),
        ),
      );
      target = reducedMotion.matches
        ? progress >= 0.5
          ? 1
          : 0
        : progress * progress * (3 - 2 * progress);
    };
    const update = (time: number) => {
      frame = 0;
      if (geometryDirty) measure();
      const elapsed = Math.min(64, Math.max(0, time - lastTime));
      lastTime = time;
      reveal = reducedMotion.matches || mobile.matches
        ? target
        : reveal + (target - reveal) * (1 - Math.exp(-elapsed / 100));
      const settling = !mobile.matches && Math.abs(target - reveal) > 0.001;
      if (!settling) reveal = target;
      // The canvas under the layer is whatever the theme and Projects left.
      const base = channelsOf(getComputedStyle(body).backgroundColor);
      const channels = base.map(
        (channel, index) => channel + (SECONDARY[index] - channel) * reveal,
      );
      if (reveal === 0) {
        // Fully out: the rest of the page keeps its own colours.
        body.removeAttribute("data-secondary-ink");
        body.style.removeProperty("--secondary-reveal");
        body.style.removeProperty("--secondary-surface");
      } else {
        body.style.setProperty("--secondary-reveal", reveal.toFixed(4));
        body.style.setProperty(
          "--secondary-surface",
          `rgb(${channels.map(Math.round).join(" ")})`,
        );
        body.dataset.secondaryInk =
          luminance(channels) < 0.179 ? "light" : "dark";
      }
      if (settling && !document.hidden) frame = requestAnimationFrame(update);
    };
    const schedule = (force = false) => {
      if (!force && !nearby) return;
      geometryDirty = true;
      if (!frame) {
        lastTime = performance.now();
        frame = requestAnimationFrame(update);
      }
    };
    // Restore deep links immediately; only subsequent movement interpolates.
    measure();
    reveal = target;
    update(performance.now());
    const onScroll = () => schedule();
    const onEnvironmentChange = () => schedule(true);
    const intersection = new IntersectionObserver(
      ([entry]) => {
        nearby = entry.isIntersecting;
        schedule(true);
      },
      { rootMargin: "100% 0px" },
    );
    intersection.observe(surface);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onEnvironmentChange);
    reducedMotion.addEventListener("change", onEnvironmentChange);
    mobile.addEventListener("change", onEnvironmentChange);
    document.addEventListener("visibilitychange", onEnvironmentChange);
    // Theme switches change the canvas under the layer.
    const themeObserver = new MutationObserver(onEnvironmentChange);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(onEnvironmentChange);
    resizeObserver?.observe(surface);
    return () => {
      cancelAnimationFrame(frame);
      intersection.disconnect();
      themeObserver.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onEnvironmentChange);
      reducedMotion.removeEventListener("change", onEnvironmentChange);
      mobile.removeEventListener("change", onEnvironmentChange);
      document.removeEventListener("visibilitychange", onEnvironmentChange);
      body.removeAttribute("data-secondary-ink");
      body.style.removeProperty("--secondary-reveal");
      body.style.removeProperty("--secondary-surface");
    };
  }, []);

  return (
    <div ref={surfaceRef} className="secondary-surface">
      <div className="secondary-backdrop" aria-hidden="true" />
      {children}
    </div>
  );
}
