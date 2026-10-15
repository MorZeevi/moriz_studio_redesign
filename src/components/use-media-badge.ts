"use client";

import { type RefObject, useEffect, useState } from "react";

/**
 * The "view project" badge that follows a mouse pointer over project media
 * (fine pointers only; one write per animation frame).
 *
 * `host` is the link: it gets `data-pointer-inside` and owns focus. `area` is
 * the media the badge moves over (defaults to the host); it must be the
 * badge's positioned container. Pair with `media-badge.module.css`.
 */
export function useMediaBadge(
  host: RefObject<HTMLElement | null>,
  area: RefObject<HTMLElement | null> = host,
) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const link = host.current;
    const surface = area.current;
    if (!link || !surface) return;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;
    let x = 0;
    let y = 0;

    const place = () => {
      frame = 0;
      surface.style.setProperty("--badge-x", `${x}px`);
      surface.style.setProperty("--badge-y", `${y}px`);
    };
    const move = (event: PointerEvent) => {
      if (!finePointer.matches || event.pointerType !== "mouse") return;
      const bounds = surface.getBoundingClientRect();
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
      setActive(link.matches(":focus-visible"));
    };

    surface.addEventListener("pointerenter", enter);
    surface.addEventListener("pointermove", move);
    surface.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      surface.removeEventListener("pointerenter", enter);
      surface.removeEventListener("pointermove", move);
      surface.removeEventListener("pointerleave", leave);
    };
  }, [host, area]);

  return {
    active,
    onFocus: (event: React.FocusEvent<HTMLElement>) => {
      if (event.currentTarget.matches(":focus-visible")) setActive(true);
    },
    onBlur: () => {
      if (!host.current?.hasAttribute("data-pointer-inside")) setActive(false);
    },
  };
}
