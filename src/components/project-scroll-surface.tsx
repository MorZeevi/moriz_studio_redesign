"use client";

import { type ReactNode, useEffect, useRef } from "react";
import styles from "./projects.module.css";

export function ProjectScrollSurface({ children }: { children: ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      frame = 0;
      const { top, bottom } = section.getBoundingClientRect();
      const height = window.innerHeight;
      // Shift entry earlier and exit later without changing the fade span.
      const triggerOffset = height * 0.4;
      const distance = Math.min(
        triggerOffset - top,
        bottom - height + triggerOffset,
      );
      const progress = Math.max(0, Math.min(1, distance / (height * 0.12)));
      const reveal = reducedMotion.matches
        ? progress >= 0.5
          ? 1
          : 0
        : progress * progress * (3 - 2 * progress);
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
      section.style.setProperty("--project-reveal", reveal.toFixed(4));
      section.style.setProperty("--project-foreground", foreground);
      section.style.setProperty(
        "--project-background",
        `rgb(${channels.map(Math.round).join(" ")})`,
      );
      section.style.setProperty(
        "--project-secondary",
        reveal > 0.2 && reveal < 0.85
          ? foreground
          : "color-mix(in srgb, var(--project-foreground) 80%, var(--project-background))",
      );
      section.style.setProperty("--project-hover", foreground);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reducedMotion.addEventListener("change", schedule);
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
    };
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
