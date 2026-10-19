"use client";

import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
  type Ref,
  type RefObject,
  useEffect,
  useId,
  useRef,
} from "react";
import { attachLiquidMotion } from "../js/liquid-motion.js";

type Variant = "primary" | "secondary";

export type LiquidLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  href: string;
  variant?: Variant;
  /** The link element. Pass next/link's Link (or another router link) for
   * client navigation; defaults to a native anchor. */
  as?: ElementType;
  /** Replaces the arrow blob with a portrait-style image. */
  icon?: ReactNode;
  /** "down" for links to a section further down the page. */
  arrow?: "forward" | "down";
  /** Drawn inside the blob instead of the arrow; it does not mirror. */
  glyph?: ReactNode;
};

export type LiquidButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: Variant;
  glyph?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
};

/** Navigation CTA. Use LiquidButton for actions. */
export function LiquidLink({
  className,
  children,
  style,
  variant = "primary",
  as: Component = "a",
  icon,
  arrow = "forward",
  glyph,
  ...props
}: LiquidLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);
  const filterId = `liquid-link-${useId().replace(/:/g, "")}`;
  useLiquidMotion(linkRef, blurRef);

  const shapes = (
    <LiquidShapes icon={!icon} arrow={arrow} glyph={glyph}>
      {children}
    </LiquidShapes>
  );

  return (
    <>
      <LiquidFilter id={filterId} blurRef={blurRef} />
      <Component
        {...props}
        ref={linkRef}
        className={liquidClassName(variant, className)}
        style={{ ...style, "--liquid-filter": `url("#${filterId}")` }}
      >
        {icon ? (
          <>
            {/* Only the shapes melt together; the goo would smear the image. */}
            <span className="liquid__shapes">{shapes}</span>
            <span className="liquid__portrait" aria-hidden="true">
              {icon}
            </span>
          </>
        ) : (
          shapes
        )}
      </Component>
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
}: LiquidButtonProps) {
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
        className={liquidClassName(variant, className)}
        style={
          {
            ...style,
            "--liquid-filter": `url("#${filterId}")`,
          } as CSSProperties
        }
      >
        <LiquidShapes icon arrow="forward" glyph={glyph}>
          {children}
        </LiquidShapes>
      </button>
    </>
  );
}

/** Visual-only liquid pill for use inside another interactive element. */
export function LiquidBadge({
  children,
  variant = "primary",
  open = false,
  glyph,
}: {
  children: ReactNode;
  variant?: Variant;
  /** Shows the stretched hover silhouette. */
  open?: boolean;
  /** Replaces the forward arrow. */
  glyph?: ReactNode;
}) {
  const filterId = `liquid-badge-${useId().replace(/:/g, "")}`;
  return (
    <>
      <LiquidFilter id={filterId} blur={open ? 7 : 3.5} />
      <span
        className={liquidClassName(variant)}
        data-liquid-open={open ? "" : undefined}
        style={{ "--liquid-filter": `url("#${filterId}")` } as CSSProperties}
      >
        <LiquidShapes icon arrow="forward" glyph={glyph}>
          {children}
        </LiquidShapes>
      </span>
    </>
  );
}

/** Goo filter shared by every liquid shape; each instance needs its own id. */
export function LiquidFilter({
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
      className="liquid__filter"
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

function liquidClassName(variant: Variant, className?: string) {
  return `liquid${variant === "secondary" ? " liquid--secondary" : ""}${className ? ` ${className}` : ""}`;
}

function useLiquidMotion(
  controlRef: RefObject<HTMLElement | null>,
  blurRef: RefObject<SVGFEGaussianBlurElement | null>,
) {
  useEffect(() => {
    const control = controlRef.current;
    const blur = blurRef.current;
    if (!control || !blur) return;
    return attachLiquidMotion(control, blur);
  }, [controlRef, blurRef]);
}

function LiquidShapes({
  icon,
  arrow,
  glyph,
  children,
}: {
  icon: boolean;
  arrow: "forward" | "down";
  glyph?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <span className="liquid__icon" aria-hidden="true">
        {icon && glyph && <span className="liquid__custom-glyph">{glyph}</span>}
        {icon && !glyph && (
          <svg
            className={`liquid__glyph${arrow === "down" ? " liquid__glyph--down" : ""}`}
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
        <span className="liquid__bridge" />
      </span>
      <span className="liquid__label">{children}</span>
    </>
  );
}
