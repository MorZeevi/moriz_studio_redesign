"use client";

import Link from "next/link";
import { type ReactNode, useRef } from "react";
import { LiquidBadge } from "./ui/liquid-link";
import badgeStyles from "./media-badge.module.css";
import styles from "./projects.module.css";
import { useMediaBadge } from "./use-media-badge";

/** Project media as a link, with a pointer-following "view project" badge. */
export function ProjectMediaLink({
  href,
  label,
  title,
  children,
}: {
  href: string;
  label: string;
  title: string;
  children: ReactNode;
}) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const { active, onFocus, onBlur } = useMediaBadge(linkRef);

  return (
    <Link
      ref={linkRef}
      href={href}
      className={styles.mediaLink}
      aria-label={`${label}: ${title}`}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {children}
      <span className={badgeStyles.badge} aria-hidden="true">
        <LiquidBadge variant="secondary" open={active}>
          {label}
        </LiquidBadge>
      </span>
    </Link>
  );
}

/** Project media without a case study: the same badge says "coming soon". */
export function ProjectMediaSoon({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const { active } = useMediaBadge(boxRef);

  return (
    <div ref={boxRef} className={styles.mediaLink}>
      {children}
      <ComingSoonBadge label={label} open={active} />
    </div>
  );
}

/** Pointer-following on desktop; a fixed label on touch and phone widths. */
export function ComingSoonBadge({
  label,
  open,
}: {
  label: string;
  open: boolean;
}) {
  return (
    <span className={`${badgeStyles.badge} ${badgeStyles.soon}`}>
      <LiquidBadge variant="secondary" open={open} glyph={<ClockGlyph />}>
        {label}
      </LiquidBadge>
    </span>
  );
}

function ClockGlyph() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 5v3l2 1.5" />
    </svg>
  );
}
