"use client";

import Image from "next/image";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";
import type { SiteContent } from "@/i18n/dictionaries";
import styles from "./testimonials.module.css";

type TestimonialsContent = SiteContent["testimonials"];
type Item = TestimonialsContent["items"][number];

const subscribeNothing = () => () => {};

// Phones stack every review as a card instead of the tabbed spotlight.
const stackedQuery = "(max-width: 63.999rem)";
function subscribeStacked(callback: () => void) {
  const query = window.matchMedia(stackedQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const readStacked = () => window.matchMedia(stackedQuery).matches;
const serverStacked = () => false;
const noneOpen: ReadonlySet<number> = new Set();

function Avatar({ item, size }: { item: Item; size: number }) {
  return (
    <span className={styles.avatar} data-kind={item.image.kind}>
      <Image
        src={item.image.src}
        alt=""
        width={size}
        height={size}
        sizes={`${size}px`}
        style={{ objectPosition: item.image.objectPosition }}
      />
    </span>
  );
}

function QuoteMark() {
  return (
    <svg
      className={styles.mark}
      viewBox="0 0 46 36"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M0 0h20v20c0 9-5 15-14 16v-6c4-1 6-4 6-10H0zM26 0h20v20c0 9-5 15-14 16v-6c4-1 6-4 6-10H26z" />
    </svg>
  );
}

function Arrow({ next = false }: { next?: boolean }) {
  return (
    <svg
      className={next ? styles.arrowNext : styles.arrowPrevious}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M5 12h14m-7-7 7 7-7 7" />
    </svg>
  );
}

export function Testimonials({ content }: { content: TestimonialsContent }) {
  const { items } = content;
  const baseId = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<{ top: number; distance: number } | null>(null);
  const activeRef = useRef(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const bodyRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(noneOpen);
  const [overflowing, setOverflowing] = useState<boolean[]>([]);
  // Without JavaScript every quote stays visible and unclamped.
  const enhanced = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
  const stacked = useSyncExternalStore(
    subscribeStacked,
    readStacked,
    serverStacked,
  );

  const toggle = (index: number) =>
    setExpanded((previous) => {
      const next = new Set(previous);
      if (!next.delete(index)) next.add(index);
      return next;
    });

  useEffect(() => {
    const track = trackRef.current;
    const root = rootRef.current;
    if (!enhanced || !track || !root || items.length < 2) return;
    const desktop = window.matchMedia("(min-width: 64rem)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let disposed = false;

    const update = () => {
      frame = 0;
      const geometry = scrollRef.current;
      if (!geometry) return;
      const progress = Math.max(
        0,
        Math.min(
          1,
          (geometry.top - track.getBoundingClientRect().top) /
            geometry.distance,
        ),
      );
      const next = Math.min(
        items.length - 1,
        Math.floor(progress * items.length),
      );
      if (next === activeRef.current) return;
      activeRef.current = next;
      setActive(next);
      setExpanded(noneOpen);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const measure = () => {
      if (disposed) return;
      const height = root.offsetHeight;
      // Keep long/expanded reviews readable instead of fixing a tall panel
      // outside the viewport. Phones and reduced motion retain manual controls.
      if (!desktop.matches || motion.matches || height > innerHeight - 96) {
        scrollRef.current = null;
        track.removeAttribute("data-scroll-enabled");
        track.style.removeProperty("block-size");
        track.style.removeProperty("--testimonial-sticky-top");
        return;
      }
      const top = Math.max(48, (innerHeight - height) / 2);
      const distance = items.length * Math.max(280, innerHeight * 0.55);
      scrollRef.current = { top, distance };
      track.style.blockSize = `${height + distance}px`;
      track.style.setProperty("--testimonial-sticky-top", `${top}px`);
      track.setAttribute("data-scroll-enabled", "");
      schedule();
    };
    const resize = new ResizeObserver(measure);
    resize.observe(root);
    measure();
    document.fonts.ready.then(measure);
    desktop.addEventListener("change", measure);
    motion.addEventListener("change", measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      desktop.removeEventListener("change", measure);
      motion.removeEventListener("change", measure);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", schedule);
      scrollRef.current = null;
      track.removeAttribute("data-scroll-enabled");
      track.style.removeProperty("block-size");
      track.style.removeProperty("--testimonial-sticky-top");
    };
  }, [enhanced, items.length]);

  useEffect(() => {
    if (!enhanced) return;
    const measure = () =>
      setOverflowing((previous) => {
        const next = bodyRefs.current.map((body) =>
          body ? body.scrollHeight > body.clientHeight + 1 : false,
        );
        return next.every((value, index) => value === previous[index])
          ? previous
          : next;
      });
    const observer = new ResizeObserver(measure);
    for (const body of bodyRefs.current) if (body) observer.observe(body);
    return () => observer.disconnect();
  }, [enhanced]);

  // A hidden panel must not keep playing. Stacked cards are all visible.
  useEffect(() => {
    if (stacked) return;
    videoRefs.current.forEach((video, index) => {
      if (video && index !== active) video.pause();
    });
  }, [active, stacked]);

  const select = (index: number, focus = false) => {
    const next = (index + items.length) % items.length;
    const geometry = scrollRef.current;
    const track = trackRef.current;
    if (geometry && track) {
      const offset = geometry.top - track.getBoundingClientRect().top;
      if (offset >= 0 && offset <= geometry.distance) {
        // Manual selection moves to the matching scroll step so the next
        // wheel movement continues from the review the visitor just chose.
        window.scrollTo({
          top:
            scrollY -
            offset +
            ((next + 0.5) / items.length) * geometry.distance,
          behavior: "instant",
        });
      }
    }
    activeRef.current = next;
    setActive(next);
    setExpanded(noneOpen);
    if (focus) tabRefs.current[next]?.focus();
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const rtl =
      rootRef.current !== null &&
      getComputedStyle(rootRef.current).direction === "rtl";
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const backward = rtl ? "ArrowRight" : "ArrowLeft";
    const keys: Record<string, number> = {
      [forward]: active + 1,
      ArrowDown: active + 1,
      [backward]: active - 1,
      ArrowUp: active - 1,
      Home: 0,
      End: items.length - 1,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    select(keys[event.key], true);
  };

  const current = items[active];

  return (
    <div ref={trackRef} className={styles.track} data-testimonial-scroll-track>
      <div
        ref={rootRef}
        className={styles.root}
        data-enhanced={enhanced || undefined}
        data-testimonials
      >
        <div
          role="tablist"
          aria-label={content.indexLabel}
          className={styles.index}
        >
          {items.map((item, index) => (
            <button
              key={item.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${index}`}
              aria-selected={index === active}
              aria-controls={`${baseId}-panel-${index}`}
              tabIndex={index === active ? 0 : -1}
              className={styles.tab}
              onClick={() => select(index)}
              onKeyDown={onTabKeyDown}
            >
              <Avatar item={item} size={48} />
              <span className={styles.tabText}>
                <span className={styles.tabName}>{item.name}</span>
                <span className={styles.tabRole}>{item.role}</span>
              </span>
            </button>
          ))}
        </div>

        <div className={styles.stage}>
          {items.map((item, index) => {
            const isActive = index === active;
            const isOpen = (stacked || isActive) && expanded.has(index);
            return (
              <figure
                key={item.id}
                role={stacked ? undefined : "tabpanel"}
                id={`${baseId}-panel-${index}`}
                aria-labelledby={stacked ? undefined : `${baseId}-tab-${index}`}
                className={styles.panel}
                data-active={isActive || undefined}
                inert={enhanced && !stacked && !isActive}
              >
                {item.video ? (
                  // biome-ignore lint/a11y/useMediaCaption: Captions pending an owner-approved transcript.
                  <video
                    ref={(node) => {
                      videoRefs.current[index] = node;
                    }}
                    className={styles.video}
                    src={item.video.src}
                    poster={item.video.poster}
                    aria-label={`${content.videoLabel} — ${item.name}`}
                    controls
                    playsInline
                    preload="none"
                  />
                ) : (
                  <QuoteMark />
                )}
                <blockquote className={styles.quote}>
                  {item.headline && (
                    <p className={styles.headline}>{item.headline}</p>
                  )}
                  <div
                    ref={(node) => {
                      bodyRefs.current[index] = node;
                    }}
                    id={`${baseId}-body-${index}`}
                    className={styles.body}
                    data-open={isOpen || undefined}
                    data-overflowing={overflowing[index] || undefined}
                  >
                    {item.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </blockquote>
                {enhanced && (overflowing[index] || isOpen) && (
                  <button
                    type="button"
                    className={styles.more}
                    aria-expanded={isOpen}
                    aria-controls={`${baseId}-body-${index}`}
                    onClick={() => toggle(index)}
                  >
                    {isOpen ? content.readLess : content.readMore}
                    <span className={styles.moreIcon} aria-hidden="true">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                )}
                <figcaption className={styles.attribution}>
                  {/* Phones only; desktop shows the face in the index. */}
                  <span className={styles.cardAvatar}>
                    <Avatar item={item} size={40} />
                  </span>
                  <span className={styles.attributionText}>
                    <span className={styles.attributionName}>{item.name}</span>
                    <span className={styles.attributionRole}>{item.role}</span>
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>

        {enhanced && items.length > 1 && (
          <div className={styles.controls}>
            <button
              type="button"
              className={styles.step}
              aria-label={content.previous}
              onClick={() => select(active - 1)}
            >
              <Arrow />
            </button>
            <button
              type="button"
              className={styles.step}
              aria-label={content.next}
              onClick={() => select(active + 1)}
            >
              <Arrow next />
            </button>
            <span className="sr-only" aria-live="polite">
              {`${active + 1} / ${items.length} — ${current.name}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
