"use client";

import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from "react";
import Noise from "@/components/react-bits/Noise";
import { LiquidFilter } from "@/components/ui/liquid-link";
import styles from "./site-footer.module.css";

const grain = {
  patternSize: 340,
  patternScaleX: 1,
  patternScaleY: 0.3,
  patternRefreshInterval: 2,
  patternAlpha: 22,
};

/** The contact panel uses the button's two-lobe, goo-connected silhouette.
 * Only its background moves; the form and links remain still and sharp. */
export function FooterContactShell({ children }: { children: ReactNode }) {
  const shellRef = useRef<HTMLDivElement>(null);
  const shapeRef = useRef<HTMLDivElement>(null);
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);
  const filterId = `contact-shell-${useId().replaceAll(":", "")}`;

  useEffect(() => {
    const shell = shellRef.current;
    const shape = shapeRef.current;
    const blur = blurRef.current;
    if (!shell || !shape || !blur) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 64rem)");
    let frame = 0;
    let until = 0;

    const update = () => {
      if (reduceMotion.matches || !desktop.matches) {
        blur.setAttribute("stdDeviation", "3.5");
      } else {
        const gap = Number.parseFloat(getComputedStyle(shape).getPropertyValue("--liquid-gap"));
        const progress = Math.min(1, Math.max(0, (gap - 2) / 30));
        blur.setAttribute("stdDeviation", (3.5 + progress * 3.5).toFixed(2));
      }
      if (performance.now() < until) frame = requestAnimationFrame(update);
    };

    const animate = () => {
      cancelAnimationFrame(frame);
      until = performance.now() + 700;
      frame = requestAnimationFrame(update);
    };

    shell.addEventListener("pointerenter", animate);
    shell.addEventListener("pointerleave", animate);
    shell.addEventListener("focusin", animate);
    shell.addEventListener("focusout", animate);
    reduceMotion.addEventListener("change", animate);
    desktop.addEventListener("change", animate);
    animate();

    return () => {
      cancelAnimationFrame(frame);
      shell.removeEventListener("pointerenter", animate);
      shell.removeEventListener("pointerleave", animate);
      shell.removeEventListener("focusin", animate);
      shell.removeEventListener("focusout", animate);
      reduceMotion.removeEventListener("change", animate);
      desktop.removeEventListener("change", animate);
    };
  }, []);

  return (
    <div ref={shellRef} className={styles.contactShell}>
      <LiquidFilter id={filterId} blurRef={blurRef} />
      <div
        ref={shapeRef}
        className={styles.shellShape}
        style={{ "--liquid-filter": `url(#${filterId})` } as CSSProperties}
        aria-hidden="true"
      >
        <span className={`${styles.shellLobe} ${styles.shellFirst}`}>
          <Noise {...grain} />
        </span>
        <span className={`${styles.shellLobe} ${styles.shellSecond}`}>
          <Noise {...grain} />
        </span>
        <span className={styles.shellBridge}>
          <Noise {...grain} />
        </span>
      </div>
      {children}
    </div>
  );
}
