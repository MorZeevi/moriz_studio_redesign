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

function format(index: number) {
  return String(index).padStart(2, "0");
}

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
  const rootRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const bodyRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState<boolean[]>([]);
  // Without JavaScript every quote stays visible and unclamped.
  const enhanced = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

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

  const select = (index: number, focus = false) => {
    const next = (index + items.length) % items.length;
    setActive(next);
    setExpanded(false);
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
    <div
      ref={rootRef}
      className={styles.root}
      data-enhanced={enhanced || undefined}
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
            <span className={styles.number} aria-hidden="true">
              {format(index + 1)}
            </span>
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
          const isOpen = isActive && expanded;
          return (
            <figure
              key={item.id}
              role="tabpanel"
              id={`${baseId}-panel-${index}`}
              aria-labelledby={`${baseId}-tab-${index}`}
              className={styles.panel}
              data-active={isActive || undefined}
              inert={enhanced && !isActive}
            >
              <QuoteMark />
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
                  onClick={() => setExpanded((value) => !value)}
                >
                  {isOpen ? content.readLess : content.readMore}
                  <span className={styles.moreIcon} aria-hidden="true">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
              )}
              <figcaption className={styles.attribution}>
                <span className={styles.attributionName}>{item.name}</span>
                <span className={styles.attributionRole}>{item.role}</span>
              </figcaption>
            </figure>
          );
        })}
      </div>

      {enhanced && items.length > 1 && (
        <div className={styles.controls}>
          <span className={styles.counter} dir="ltr" aria-hidden="true">
            {format(active + 1)} / {format(items.length)}
          </span>
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
  );
}
