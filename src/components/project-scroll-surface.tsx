"use client";

import { type ReactNode, useLayoutEffect, useRef } from "react";
import { useTheme } from "./theme-provider";
import styles from "./projects.module.css";

export function ProjectScrollSurface({ children }: { children: ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const { resolvedTheme } = useTheme();

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const dark =
      (document.documentElement.dataset.theme ?? resolvedTheme) === "dark";

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const body = document.body;
    const properties = [
      "--home-project-surface",
      "--home-project-foreground",
      "--home-project-secondary",
    ];
    const previous = properties.map((property) =>
      body.style.getPropertyValue(property),
    );
    const previousTheme = body.getAttribute("data-project-backdrop");
    body.setAttribute("data-project-backdrop", "");
    let frame = 0;
    let reveal = 0;
    let target = 0;
    let lastTime = 0;
    let geometryDirty = true;

    const measure = () => {
      geometryDirty = false;
      const { top, bottom } = section.getBoundingClientRect();
      const height = window.innerHeight;
      // The reference changes the whole canvas while crossing into Work.
      // Give entry/exit almost half a viewport instead of a narrow edge fade.
      const progress = Math.max(
        0,
        Math.min(
          1,
          (height * 0.85 - top) / (height * 0.45),
          (bottom - height * 0.15) / (height * 0.45),
        ),
      );
      target = dark
        ? 1
        : reducedMotion.matches
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
      reveal = reducedMotion.matches
        ? target
        : reveal + (target - reveal) * (1 - Math.exp(-elapsed / 100));
      const settling = Math.abs(target - reveal) > 0.001;
      if (!settling) reveal = target;
      const channels = [251, 251, 255].map(
        (light) => light + (38 - light) * reveal,
      );
      const luminance = channels.reduce((sum, channel, index) => {
        const value = channel / 255;
        const linear =
          value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        return sum + linear * [0.2126, 0.7152, 0.0722][index];
      }, 0);
      const lightText = luminance < 0.179;
      const foreground =
        reveal <= 0.2
          ? "var(--color-dark)"
          : reveal >= 0.85
            ? "var(--color-light)"
            : lightText
              ? "#fff"
              : "#000";

      section.dataset.projectTheme = lightText ? "dark" : "light";
      const background = `rgb(${channels.map(Math.round).join(" ")})`;
      const secondary =
        reveal > 0.2 && reveal < 0.85
          ? foreground
          : "color-mix(in srgb, var(--home-project-foreground) 80%, var(--home-project-surface))";
      body.style.setProperty("--home-project-surface", background);
      body.style.setProperty("--home-project-foreground", foreground);
      body.style.setProperty("--home-project-secondary", secondary);
      section.style.setProperty("--project-reveal", reveal.toFixed(4));
      section.style.setProperty("--project-foreground", foreground);
      section.style.setProperty("--project-background", background);
      section.style.setProperty(
        "--project-secondary",
        reveal > 0.2 && reveal < 0.85
          ? foreground
          : "color-mix(in srgb, var(--project-foreground) 80%, var(--project-background))",
      );
      section.style.setProperty("--project-hover", foreground);
      if (settling && !document.hidden) frame = requestAnimationFrame(update);
    };
    const schedule = () => {
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
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reducedMotion.addEventListener("change", schedule);
    document.addEventListener("visibilitychange", schedule);
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(schedule);
    resizeObserver?.observe(section);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reducedMotion.removeEventListener("change", schedule);
      document.removeEventListener("visibilitychange", schedule);
      if (previousTheme === null) body.removeAttribute("data-project-backdrop");
      else body.setAttribute("data-project-backdrop", previousTheme);
      properties.forEach((property, index) => {
        if (previous[index]) body.style.setProperty(property, previous[index]);
        else body.style.removeProperty(property);
      });
    };
  }, [resolvedTheme]);

  // Pin each project strip below the heading and every earlier strip.
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof ResizeObserver === "undefined") return;
    const intro = section.querySelector<HTMLElement>("[data-stack-intro]");
    const heads = [
      ...section.querySelectorAll<HTMLElement>("[data-stack-head]"),
    ];
    const measure = () => {
      section.style.setProperty(
        "--stack-intro",
        `${intro?.offsetHeight ?? 0}px`,
      );
      let offset = 0;
      for (const head of heads) {
        head.style.setProperty("--stack-offset", `${offset}px`);
        offset += head.offsetHeight;
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (intro) observer.observe(intro);
    for (const head of heads) observer.observe(head);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="projects"
      aria-labelledby="projects-heading"
      className={`${styles.section} ${styles.scrollSurface}`}
      data-wireframe-section="projects"
      data-project-theme="light"
    >
      {children}
    </section>
  );
}
