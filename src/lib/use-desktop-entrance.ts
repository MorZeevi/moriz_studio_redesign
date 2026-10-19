"use client";

import gsap from "gsap";
import { type RefObject, useEffect } from "react";

/** Enhance visible content once; phones and reduced motion keep the resting state. */
export function useDesktopEntrance(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const media = window.matchMedia(
      "(min-width: 64rem) and (prefers-reduced-motion: no-preference)",
    );
    let played = false;
    let observer: IntersectionObserver | undefined;
    let tween: gsap.core.Tween | undefined;
    const settle = () => {
      observer?.disconnect();
      tween?.kill();
      gsap.set(element, { clearProps: "transform,opacity" });
    };
    const setup = () => {
      settle();
      if (!media.matches || played) return;
      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          played = true;
          observer?.disconnect();
          // Never pre-hide offscreen content: a missed intersection stays readable.
          tween = gsap.fromTo(
            element,
            { y: 12, opacity: 0.6 },
            {
              y: 0,
              opacity: 1,
              duration: 0.45,
              ease: "power2.out",
              clearProps: "transform,opacity",
            },
          );
        },
        { rootMargin: "0px 0px -15% 0px" },
      );
      observer.observe(element);
    };
    setup();
    media.addEventListener("change", setup);
    return () => {
      media.removeEventListener("change", setup);
      settle();
    };
  }, [ref]);
}
