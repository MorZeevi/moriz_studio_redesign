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
