"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { LiquidBadge } from "./ui/liquid-link";
import styles from "./projects.module.css";

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
  const [active, setActive] = useState(false);

  useEffect(() => {
    const link = linkRef.current;
    if (!link) return;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;
    let x = 0;
    let y = 0;

    // The badge follows the pointer; one write per animation frame.
    const place = () => {
      frame = 0;
      link.style.setProperty("--badge-x", `${x}px`);
      link.style.setProperty("--badge-y", `${y}px`);
    };
    const move = (event: PointerEvent) => {
      if (!finePointer.matches || event.pointerType !== "mouse") return;
      const bounds = link.getBoundingClientRect();
      x = event.clientX - bounds.left;
      y = event.clientY - bounds.top;
      if (!frame) frame = requestAnimationFrame(place);
    };
    const enter = (event: PointerEvent) => {
      if (!finePointer.matches || event.pointerType !== "mouse") return;
      move(event);
      link.setAttribute("data-pointer-inside", "");
      setActive(true);
    };
    const leave = () => {
      link.removeAttribute("data-pointer-inside");
      setActive(false);
    };

    link.addEventListener("pointerenter", enter);
    link.addEventListener("pointermove", move);
    link.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      link.removeEventListener("pointerenter", enter);
      link.removeEventListener("pointermove", move);
      link.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <Link
      ref={linkRef}
      href={href}
      className={styles.mediaLink}
      aria-label={`${label}: ${title}`}
      onFocus={(event) => {
        if (event.currentTarget.matches(":focus-visible")) setActive(true);
      }}
      onBlur={() => {
        if (!linkRef.current?.hasAttribute("data-pointer-inside")) {
          setActive(false);
        }
      }}
    >
      {children}
      <span className={styles.mediaBadge} aria-hidden="true">
        <LiquidBadge variant="secondary" open={active}>
          {label}
        </LiquidBadge>
      </span>
    </Link>
  );
}
