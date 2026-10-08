"use client";

import Link from "next/link";
import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  useEffect,
  useId,
  useRef,
} from "react";
import styles from "./liquid-link.module.css";

type LiquidLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  href: string;
  variant?: "primary" | "secondary";
  navigation?: "native" | "client";
};

export function LiquidLink({
  className,
  children,
  style,
  variant = "primary",
  navigation = "native",
  ...props
}: LiquidLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);
  const filterId = `liquid-link-${useId().replace(/:/g, "")}`;
  const LinkElement = navigation === "client" ? Link : "a";

  useEffect(() => {
    const link = linkRef.current;
    const blur = blurRef.current;
    if (!link || !blur) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let until = 0;

    function update() {
      if (!link || !blur) return;
      const cs = getComputedStyle(link);
      const gap = parseFloat(cs.getPropertyValue("--lb-gap"));
      const open = parseFloat(cs.fontSize) * 1.35;
      const progress = Math.min(1, Math.max(0, (gap - 2) / (open - 2)));
      blur.setAttribute("stdDeviation", (3.5 + 3.5 * progress).toFixed(2));
      frame = performance.now() < until ? requestAnimationFrame(update) : 0;
    }

    function kick() {
      if (reduced.matches) return;
      until = performance.now() + 900;
      if (!frame) frame = requestAnimationFrame(update);
    }

    function press() {
      link?.setAttribute("data-liquid-pressed", "");
      kick();
    }
    function release() {
      if (!link?.hasAttribute("data-liquid-pressed")) return;
      link?.removeAttribute("data-liquid-pressed");
      kick();
    }
    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
      link?.removeAttribute("data-liquid-pressed");
      blur?.setAttribute("stdDeviation", "3.5");
    }

    link.addEventListener("pointerdown", press);
    link.addEventListener("pointerleave", release);
    link.addEventListener("blur", release);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    const events = ["pointerenter", "pointerleave", "focus", "blur"] as const;
    for (const event of events) link.addEventListener(event, kick);
    reduced.addEventListener("change", stop);
    return () => {
      stop();
      link.removeEventListener("pointerdown", press);
      link.removeEventListener("pointerleave", release);
      link.removeEventListener("blur", release);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      for (const event of events) link.removeEventListener(event, kick);
      reduced.removeEventListener("change", stop);
    };
  }, []);

  return (
    <>
      <svg
        width="0"
        height="0"
        className={styles.filter}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <filter
            id={filterId}
            x="-10%"
            y="-50%"
            width="120%"
            height="200%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur
              ref={blurRef}
              in="SourceGraphic"
              stdDeviation="3.5"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 22 -10"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
      <LinkElement
        {...props}
        ref={linkRef}
        className={`${className ?? ""} ${styles.link}${variant === "secondary" ? ` ${styles.secondary}` : ""}`}
        style={
          { ...style, "--lb-filter": `url("#${filterId}")` } as CSSProperties
        }
      >
        <span className={styles.icon} data-liquid-shape aria-hidden="true">
          <svg
            className={styles.glyph}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            focusable="false"
            aria-hidden="true"
          >
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
          <span className={styles.bridge} data-liquid-shape />
        </span>
        <span className={styles.label} data-liquid-shape>
          {children}
        </span>
      </LinkElement>
    </>
  );
}
