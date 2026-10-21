"use client";

import gsap from "gsap";
import { Observer } from "gsap/Observer";
import Image from "next/image";
import { useEffect, useRef, useSyncExternalStore } from "react";
import type { SiteContent } from "@/i18n/dictionaries";
import styles from "./about-gallery.module.css";

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(callback: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const readMotion = () => window.matchMedia(motionQuery).matches;
const serverMotion = () => true;

/**
 * An endless strip of images that drifts on its own and can be dragged; while
 * held, the cards loosen into a scattered tilt. Based on mwg_008.
 * `reverse` mirrors its tilt and drift and starts halfway through the set,
 * so two strips on one page never show the same images side by side.
 */
export function AboutGallery({
  content,
  reverse = false,
}: {
  content: SiteContent["aboutGallery"];
  reverse?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useSyncExternalStore(
    subscribeMotion,
    readMotion,
    serverMotion,
  );
  const shift = reverse ? Math.ceil(content.images.length / 2) : 0;
  const images = [
    ...content.images.slice(shift),
    ...content.images.slice(0, shift),
  ];

  useEffect(() => {
    const track = trackRef.current;
    if (!track || reduced) return;
    gsap.registerPlugin(Observer);
    const section = track.closest("section") ?? track;
    section.setAttribute("data-gallery-enhanced", "");
    const cards = [
      ...track.querySelectorAll<HTMLElement>("[data-gallery-card]"),
    ];
    const count = cards.length / 2;
    // The strip holds the set twice; wrapping at half its width loops it.
    let half = track.offsetWidth / 2;
    let total = 0;
    let visible = false;
    // Drift leftward in RTL and rightward in LTR; the reversed strip goes
    // the other way.
    const drift =
      (getComputedStyle(section).direction === "rtl" ? -1 : 1) *
      (reverse ? -1 : 1);

    const xTo = gsap.quickTo(track, "x", {
      duration: 0.5,
      ease: "power3",
      modifiers: {
        x: (x: string) =>
          `${gsap.utils.wrap(-half, 0, Number.parseFloat(x))}px`,
      },
    });

    const tilt = Array.from(
      { length: count },
      () => (Math.random() - 0.5) * 20,
    );
    const scatter = gsap.timeline({ paused: true }).to(cards, {
      rotate: (index: number) => tilt[index % count],
      xPercent: (index: number) => tilt[index % count],
      yPercent: (index: number) => tilt[index % count],
      scale: 0.95,
      duration: 0.5,
      ease: "back.inOut(3)",
    });

    const observer = Observer.create({
      target: track,
      type: "pointer,touch",
      lockAxis: true,
      dragMinimum: 8,
      onDragStart: (self) => {
        if (self.axis === "x") scatter.play();
      },
      onDrag: (self) => {
        if (self.axis !== "x") return;
        total += self.deltaX;
        xTo(total);
      },
      onRelease: () => {
        scatter.reverse();
      },
      onStop: () => {
        scatter.reverse();
      },
    });

    // Only drift while on screen, and never with reduced motion.
    const tick = (_time: number, deltaTime: number) => {
      if (!visible || document.hidden) return;
      total += (drift * deltaTime) / 10;
      xTo(total);
    };
    let tickerAttached = false;

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !tickerAttached) {
        gsap.ticker.add(tick);
        tickerAttached = true;
      } else if (!visible && tickerAttached) {
        gsap.ticker.remove(tick);
        tickerAttached = false;
      }
    });
    intersection.observe(track);
    const measure = () => {
      half = track.offsetWidth / 2;
    };
    window.addEventListener("resize", measure);

    return () => {
      if (tickerAttached) gsap.ticker.remove(tick);
      observer.kill();
      scatter.kill();
      intersection.disconnect();
      window.removeEventListener("resize", measure);
      gsap.killTweensOf(track);
      gsap.set([track, ...cards], { clearProps: "all" });
      section.removeAttribute("data-gallery-enhanced");
    };
  }, [reduced, reverse]);

  return (
    <section
      className={`${styles.root}${reverse ? ` ${styles.reverse}` : ""}`}
      aria-label={content.label}
      data-wireframe-section={
        reverse ? "about-gallery-reverse" : "about-gallery"
      }
    >
      <div className={styles.viewport}>
        <div ref={trackRef} className={styles.track}>
          {[...images, ...images].map((image, index) => {
            const copy = index >= images.length;
            return (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: the set repeats by design
                key={index}
                className={styles.card}
                data-gallery-card
                data-copy={copy || undefined}
                aria-hidden={copy || undefined}
              >
                <Image
                  src={image.src}
                  alt={copy ? "" : image.alt}
                  width={1440}
                  height={810}
                  sizes="(max-width: 48rem) 72vw, (max-width: 64rem) 55vw, 32vw"
                  draggable={false}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
