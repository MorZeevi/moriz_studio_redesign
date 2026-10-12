"use client";

import Link from "next/link";
import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
  useEffect,
  useId,
  type Ref,
  type RefObject,
  useRef,
} from "react";
import styles from "./liquid-link.module.css";

type LiquidLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  href: string;
  variant?: "primary" | "secondary";
  navigation?: "native" | "client";
  /** Replaces the arrow inside the round blob (e.g. a portrait). */
  icon?: ReactNode;
  /** "down" for links to a section further down the page. */
  arrow?: "forward" | "down";
  /** Drawn inside the round blob instead of the arrow. */
  glyph?: ReactNode;
};

type LiquidButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "secondary";
  /** Drawn inside the round blob instead of the arrow. */
  glyph?: ReactNode;
};

export function LiquidLink({
  className,
  children,
  style,
  variant = "primary",
  navigation = "native",
  icon,
  arrow = "forward",
  glyph,
  ...props
}: LiquidLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);
  const filterId = `liquid-link-${useId().replace(/:/g, "")}`;
  const LinkElement = navigation === "client" ? Link : "a";
  useLiquidMotion(linkRef, blurRef);

  const shapes = (
    <LiquidShapes icon={!icon} arrow={arrow} glyph={glyph}>
      {children}
    </LiquidShapes>
  );

  return (
    <>
      <LiquidFilter id={filterId} blurRef={blurRef} />
      <LinkElement
        {...props}
        ref={linkRef}
        className={`${className ?? ""} ${styles.link}${variant === "secondary" ? ` ${styles.secondary}` : ""}`}
        style={
          { ...style, "--lb-filter": `url("#${filterId}")` } as CSSProperties
        }
      >
        {icon ? (
          <>
            {/* Only the shapes melt together; the goo would smear the portrait. */}
            <span className={styles.shapes}>{shapes}</span>
            <span className={styles.portrait} aria-hidden="true">
              {icon}
            </span>
          </>
        ) : (
          shapes
        )}
      </LinkElement>
    </>
  );
}

/** The same liquid pill for actions that are not navigation. */
export function LiquidButton({
  className,
  children,
  style,
  variant = "primary",
  glyph,
  type = "button",
  ref,
  ...props
}: LiquidButtonProps & { ref?: Ref<HTMLButtonElement> }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);
  const filterId = `liquid-button-${useId().replace(/:/g, "")}`;
  useLiquidMotion(buttonRef, blurRef);

  return (
    <>
      <LiquidFilter id={filterId} blurRef={blurRef} />
      <button
        {...props}
        type={type}
        ref={(node) => {
          buttonRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        className={`${className ?? ""} ${styles.link}${variant === "secondary" ? ` ${styles.secondary}` : ""}`}
        style={
          { ...style, "--lb-filter": `url("#${filterId}")` } as CSSProperties
        }
      >
        <LiquidShapes icon arrow="forward" glyph={glyph}>
          {children}
        </LiquidShapes>
      </button>
    </>
  );
}

/** Widens the goo blur while the gap animates, and tracks the pressed state. */
function useLiquidMotion(
  linkRef: RefObject<HTMLElement | null>,
  blurRef: RefObject<SVGFEGaussianBlurElement | null>,
) {
  useEffect(() => {
    const link = linkRef.current;
    const blur = blurRef.current;
    if (!link || !blur) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let until = 0;

    function update() {
      // A click navigates away: the link may already be detached, and its
      // computed style is then empty (NaN), which SVG rejects.
      if (!link || !blur || !link.isConnected) {
        frame = 0;
        return;
      }
      const cs = getComputedStyle(link);
      const gap = parseFloat(cs.getPropertyValue("--lb-gap"));
      const open = parseFloat(cs.fontSize) * 1.35;
      const progress =
        Math.min(1, Math.max(0, (gap - 2) / (open - 2))) || 0;
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
  }, [linkRef, blurRef]);
}

/** Goo filter shared by every liquid shape; each instance needs its own id. */
function LiquidFilter({
  id,
  blurRef,
  blur = 3.5,
}: {
  id: string;
  blurRef?: Ref<SVGFEGaussianBlurElement>;
  /** Wider gaps need more blur to keep the neck connected. */
  blur?: number;
}) {
  return (
    <svg
      width="0"
      height="0"
      className={styles.filter}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter
          id={id}
          x="-10%"
          y="-50%"
          width="120%"
          height="200%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur
            ref={blurRef}
            in="SourceGraphic"
            stdDeviation={blur}
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
  );
}

function LiquidShapes({
  icon,
  arrow,
  glyph,
  children,
}: {
  /** Draws the arrow glyph inside the round blob. */
  icon: boolean;
  arrow: "forward" | "down";
  /** Replaces the arrow; it does not mirror or nudge on hover. */
  glyph?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <span
        className={styles.icon}
        data-liquid-shape
        data-liquid-icon
        aria-hidden="true"
      >
        {icon && glyph && <span className={styles.customGlyph}>{glyph}</span>}
        {icon && !glyph && (
          <svg
            className={`${styles.glyph}${arrow === "down" ? ` ${styles.down}` : ""}`}
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
        )}
        <span className={styles.bridge} data-liquid-shape data-liquid-bridge />
      </span>
      <span className={styles.label} data-liquid-shape data-liquid-label>
        {children}
      </span>
    </>
  );
}

/** Visual-only liquid button for use inside another interactive element. */
export function LiquidBadge({
  children,
  variant = "primary",
  open = false,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary";
  /** Shows the stretched hover silhouette. */
  open?: boolean;
}) {
  const filterId = `liquid-badge-${useId().replace(/:/g, "")}`;
  return (
    <>
      <LiquidFilter id={filterId} blur={open ? 7 : 3.5} />
      <span
        className={`${styles.link}${variant === "secondary" ? ` ${styles.secondary}` : ""}`}
        data-liquid-open={open ? "" : undefined}
        style={{ "--lb-filter": `url("#${filterId}")` } as CSSProperties}
      >
        <LiquidShapes icon arrow="forward">
          {children}
        </LiquidShapes>
      </span>
    </>
  );
}
