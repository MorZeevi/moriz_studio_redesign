"use client";

import { type CSSProperties, useEffect, useId, useRef, useState } from "react";
import type { SiteContent } from "@/i18n/dictionaries";
import styles from "./liquid-navigation.module.css";

export function LiquidNavigation({
  links,
}: {
  links: SiteContent["navigation"]["desktopLinks"];
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const filterId = `liquid-goo-${useId().replace(/:/g, "")}`;
  const [activeHref, setActiveHref] = useState<string | null>(null);

  useEffect(() => {
    const header = listRef.current?.closest("header");
    if (!header) return;

    const desktop = window.matchMedia("(min-width: 64rem)");
    const root = document.documentElement;
    const previousHeight = root.style.getPropertyValue("--site-header-height");
    const previousNavSize = root.style.getPropertyValue(
      "--site-nav-inline-size",
    );
    const menu = header.querySelector<HTMLElement>(".desktop-navigation");
    const sections = links.flatMap(({ href }) => {
      const element = document.getElementById(href.slice(1));
      return element ? [{ href, element }] : [];
    });
    let frame = 0;

    function update() {
      frame = 0;
      const bounds = header?.getBoundingClientRect();
      if (!bounds) return;
      root.style.setProperty("--site-header-height", `${bounds.height}px`);

      if (!desktop.matches) {
        setActiveHref(null);
        return;
      }

      const activationLine = bounds.bottom + 16;
      // Page order is independent of the order of links in the menu.
      const positions = sections
        .map(({ href, element }) => ({
          href,
          top: element.getBoundingClientRect().top,
        }))
        .sort((a, b) => a.top - b.top);
      let current: string | null = null;
      for (const section of positions) {
        if (section.top <= activationLine + 1) current = section.href;
      }
      if (
        window.scrollY > 0 &&
        window.scrollY + window.innerHeight >= root.scrollHeight - 2
      ) {
        current = positions.at(-1)?.href ?? current;
      }
      // The hero grid lines up with the header's centered menu column. Measure
      // only with no active link (the hero's state): the active pill widens the
      // menu. The observer re-measures once the pill is gone.
      if (menu && current === null) {
        root.style.setProperty(
          "--site-nav-inline-size",
          getComputedStyle(menu).width,
        );
      }
      setActiveHref(current);
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    const observer = new ResizeObserver(schedule);
    observer.observe(header);
    if (menu) observer.observe(menu);
    const main = document.getElementById("main-content");
    if (main) observer.observe(main);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    desktop.addEventListener("change", schedule);
    schedule();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
      desktop.removeEventListener("change", schedule);
      if (previousHeight) {
        root.style.setProperty("--site-header-height", previousHeight);
      } else {
        root.style.removeProperty("--site-header-height");
      }
      if (previousNavSize) {
        root.style.setProperty("--site-nav-inline-size", previousNavSize);
      } else {
        root.style.removeProperty("--site-nav-inline-size");
      }
    };
  }, [links]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const shapes = Array.from(
      list.querySelectorAll<HTMLElement>("[data-liquid-shape]"),
    );
    const desktop = window.matchMedia("(min-width: 64rem)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let px = 0;
    let py = 0;
    let gx = 0;
    let gy = 0;
    let inside = false;
    let leftAt = 0;
    let frame = 0;

    function tick() {
      gx += (px - gx) * 0.18;
      gy += (py - gy) * 0.18;
      // Read all bounds before writing styles, including moving bridges.
      const positions = shapes.map((element) =>
        element.getBoundingClientRect(),
      );
      shapes.forEach((element, index) => {
        element.style.setProperty(
          "--liquid-gx",
          `${(gx - positions[index].left).toFixed(1)}px`,
        );
        element.style.setProperty(
          "--liquid-gy",
          `${(gy - positions[index].top).toFixed(1)}px`,
        );
      });
      frame =
        inside || performance.now() - leftAt < 700
          ? requestAnimationFrame(tick)
          : 0;
    }

    function trackPointer(event: PointerEvent) {
      if (
        event.pointerType === "touch" ||
        !desktop.matches ||
        reducedMotion.matches
      )
        return;
      px = event.clientX;
      py = event.clientY;
      if (!inside) {
        gx = px;
        gy = py;
      }
      inside = true;
      if (!frame) frame = requestAnimationFrame(tick);
    }

    function leave() {
      inside = false;
      leftAt = performance.now();
    }

    function stop() {
      inside = false;
      cancelAnimationFrame(frame);
      frame = 0;
      for (const element of shapes) {
        element.style.removeProperty("--liquid-gx");
        element.style.removeProperty("--liquid-gy");
      }
    }

    list.addEventListener("pointerenter", trackPointer);
    list.addEventListener("pointermove", trackPointer);
    list.addEventListener("pointerleave", leave);
    list.addEventListener("pointercancel", stop);
    desktop.addEventListener("change", stop);
    reducedMotion.addEventListener("change", stop);

    return () => {
      stop();
      list.removeEventListener("pointerenter", trackPointer);
      list.removeEventListener("pointermove", trackPointer);
      list.removeEventListener("pointerleave", leave);
      list.removeEventListener("pointercancel", stop);
      desktop.removeEventListener("change", stop);
      reducedMotion.removeEventListener("change", stop);
    };
  }, []);

  return (
    <>
      <ul
        ref={listRef}
        className={`${styles.list} desktop-navigation-links`}
        style={{ "--liquid-filter": `url("#${filterId}")` } as CSSProperties}
      >
        {links.map(({ href, label }) => (
          <li className={styles.item} key={href}>
            <a
              className={styles.pill}
              href={href}
              aria-current={activeHref === href ? "location" : undefined}
              data-liquid-shape
            >
              <span className={styles.label}>{label}</span>
              <span
                className={styles.bridge}
                aria-hidden="true"
                data-liquid-shape
              />
            </a>
          </li>
        ))}
      </ul>
      <svg
        className={styles.filter}
        width="0"
        height="0"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <filter
            id={filterId}
            x="-5%"
            y="-50%"
            width="110%"
            height="200%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
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
    </>
  );
}
