"use client";

import gsap from "gsap";
import { type ReactNode, useEffect, useRef, useSyncExternalStore } from "react";

const motionQuery = "(prefers-reduced-motion: reduce)";
// The header is sticky at every width; it only slides away from this width.
const desktopQuery = "(min-width: 64rem)";

function mediaStore(query: string) {
  return {
    subscribe(callback: () => void) {
      const list = window.matchMedia(query);
      list.addEventListener("change", callback);
      return () => list.removeEventListener("change", callback);
    },
    read: () => window.matchMedia(query).matches,
  };
}
const motion = mediaStore(motionQuery);
const desktop = mediaStore(desktopQuery);

// Clearance past the viewport edge, so shadows and outlines leave too.
const margin = 16;
// Share of the viewport height the header always stays for.
const revealZone = 0.7;
// Ignore scroll jitter smaller than this before changing direction.
const threshold = 4;

/** Rect without the slide offset this component applies. */
function restingBox(element: Element) {
  const box = element.getBoundingClientRect();
  const x = Number(gsap.getProperty(element, "x")) || 0;
  const y = Number(gsap.getProperty(element, "y")) || 0;
  return {
    left: box.left - x,
    right: box.right - x,
    bottom: box.bottom - y,
  };
}

/**
 * After 70% of a screen height (70vh), scrolling down sends the header out: the brand to its own
 * side, the pills up one by one and the actions to the other side. Any
 * upward scroll brings them back.
 */
export function SiteHeader({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const reducedMotion = useSyncExternalStore(
    motion.subscribe,
    motion.read,
    () => true,
  );
  const isDesktop = useSyncExternalStore(
    desktop.subscribe,
    desktop.read,
    () => false,
  );

  useEffect(() => {
    const header = root.current;
    // Keyed on React's media state, not gsap.matchMedia: a matchMedia change
    // reverts and refreshes every ScrollTrigger on the page.
    if (!header || !isDesktop) return;
    const brand = header.querySelector<HTMLElement>(".header-brand");
    const actions = header.querySelector<HTMLElement>(".header-actions");
    if (!brand || !actions) return;
    const pills = Array.from(
      header.querySelectorAll<HTMLElement>(".desktop-navigation-links > li"),
    );
    // The cell stays in place (party mode measures it); its children move.
    const actionParts = Array.from(actions.children) as HTMLElement[];
    const targets = [brand, ...pills, ...actionParts];

    let hidden = false;
    // Off-screen offsets, measured from where each part rests.
    const offsets = () => {
      const rtl = getComputedStyle(header).direction === "rtl";
      const width = window.innerWidth;
      const brandBox = restingBox(brand);
      const cell = actions.getBoundingClientRect();
      const toRight = (box: { left: number }) => width - box.left + margin;
      const toLeft = (box: { right: number }) => -(box.right + margin);
      return {
        brand: rtl ? toRight(brandBox) : toLeft(brandBox),
        actions: rtl ? toLeft(cell) : toRight(cell),
        pill: (_index: number, pill: HTMLElement) =>
          -(restingBox(pill).bottom + margin),
      };
    };

    // Both ways run in the same order, from the brand's side, as in the
    // reference: out in about 0.3s, back in decelerating.
    const hide = () => {
      if (hidden) return;
      hidden = true;
      header.dataset.headerHidden = "";
      if (reducedMotion) {
        gsap.to(targets, { opacity: 0, duration: 0.2, overwrite: true });
        return;
      }
      const away = offsets();
      const out = { duration: 0.25, ease: "power2.inOut", overwrite: true };
      gsap.to(brand, { ...out, x: away.brand });
      gsap.to(actionParts, { ...out, x: away.actions });
      gsap.to(pills, { ...out, duration: 0.2, y: away.pill, stagger: 0.03 });
    };
    const show = () => {
      if (!hidden) return;
      hidden = false;
      delete header.dataset.headerHidden;
      if (reducedMotion) {
        gsap.to(targets, { opacity: 1, duration: 0.2, overwrite: true });
        return;
      }
      const back = { duration: 0.3, ease: "power2.out", overwrite: true };
      gsap.to(brand, { ...back, x: 0 });
      gsap.to(actionParts, { ...back, x: 0 });
      gsap.to(pills, { ...back, duration: 0.25, y: 0, stagger: 0.05 });
    };
    // A resize while hidden moves the resting places; keep the parts clear.
    const reposition = () => {
      if (!hidden || reducedMotion) return;
      gsap.killTweensOf(targets);
      const away = offsets();
      gsap.set(brand, { x: away.brand });
      gsap.set(actionParts, { x: away.actions });
      gsap.set(pills, { y: away.pill });
    };

    // Hydration can finish after a restored scroll or an early reader gesture.
    // Start from the page top so that initial position is reconciled as well.
    let anchor = 0;
    let frame = 0;
    // A jump from one of the header's own links is not the reader scrolling
    // away from it, so the header stays for that one step.
    let holdJump = false;
    const update = () => {
      frame = 0;
      const position = window.scrollY;
      if (holdJump) {
        holdJump = false;
        anchor = position;
        return;
      }
      // The first 70vh keep the header, before the hero video grows.
      if (position <= window.innerHeight * revealZone) {
        anchor = position;
        show();
        return;
      }
      if (Math.abs(position - anchor) < threshold) return;
      if (position > anchor) hide();
      else show();
      anchor = position;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(reposition, 150);
    };

    const holdForJump = (event: MouseEvent) => {
      const link = (event.target as Element).closest("a[href^='#']");
      if (link) holdJump = true;
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    // Keyboard focus never lands on a control that is off screen.
    header.addEventListener("focusin", show);
    header.addEventListener("click", holdForJump);
    update();

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(resizeTimer);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      header.removeEventListener("focusin", show);
      header.removeEventListener("click", holdForJump);
      gsap.killTweensOf(targets);
      delete header.dataset.headerHidden;
      gsap.set(targets, { clearProps: "transform,opacity" });
    };
  }, [isDesktop, reducedMotion]);

  // Phones keep the header in place; it only gains a surface once the page
  // has moved, so the opening shows through it at rest.
  useEffect(() => {
    const header = root.current;
    if (!header || isDesktop) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      header.toggleAttribute("data-header-stuck", window.scrollY > threshold);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      header.removeAttribute("data-header-stuck");
    };
  }, [isDesktop]);

  return (
    <header ref={root} className="site-header">
      {children}
    </header>
  );
}
