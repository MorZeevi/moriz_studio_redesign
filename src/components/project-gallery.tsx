"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import type { ProjectCopy } from "@/i18n/project-copy";
import type {
  GalleryEntry,
  GalleryImage,
  GalleryRowItem,
} from "@/lib/project-presentation";
import { CoverVideo } from "./cover-video";
import styles from "./project-detail.module.css";

type Labels = ProjectCopy["caseStudy"];

function MediaImage({
  image,
  eager,
  labels,
}: {
  image: GalleryImage;
  eager?: boolean;
  labels: Labels;
}) {
  const [failed, setFailed] = useState(false);
  const element = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // A private-media request can fail before React attaches its error handler.
    if (element.current?.complete && !element.current.naturalWidth)
      setFailed(true);
  }, []);
  return failed ? (
    <span className={styles.imageError}>{labels.imageError}</span>
  ) : (
    // Original CMS URLs must bypass the public image optimizer/cache.
    // biome-ignore lint/performance/noImgElement: private CMS media is served without shared caching.
    <img
      ref={element}
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export function ProjectGallery({
  entries,
  images,
  labels,
}: {
  entries: GalleryEntry[];
  images: GalleryImage[];
  labels: Labels;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const gallery = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLAnchorElement | null>(null);
  const previousOverflow = useRef("");
  const [active, setActive] = useState(0);
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    const root = gallery.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!root || reduced.matches || !window.IntersectionObserver) return;
    const items = Array.from(
      root.querySelectorAll<HTMLElement>("[data-gallery-reveal]"),
    );
    const animations = new Map<HTMLElement, Animation>();
    const tokens = getComputedStyle(document.documentElement);
    const duration =
      Number.parseFloat(tokens.getPropertyValue("--duration-slow")) * 1500 ||
      900;
    const easing =
      tokens.getPropertyValue("--ease-enter").trim() ||
      "cubic-bezier(0.16, 1, 0.3, 1)";
    let nextStart = 0;
    const revealImmediately = (item: HTMLElement) => {
      item.removeAttribute("data-reveal");
      animations.get(item)?.cancel();
      animations.delete(item);
    };
    const observer = new IntersectionObserver(
      (observed) => {
        const entering = observed
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              items.indexOf(a.target as HTMLElement) -
              items.indexOf(b.target as HTMLElement),
          );
        for (const entry of entering) {
          const item = entry.target as HTMLElement;
          const media = item.firstElementChild;
          if (!(media instanceof HTMLElement)) continue;
          observer.unobserve(item);
          const now = performance.now();
          // Preserve the queued rhythm without a backlog after fast scrolling.
          const delay = Math.min(300, Math.max(0, nextStart - now));
          nextStart = now + delay + 100;
          // Observe the unmasked figure; a fully clipped target cannot intersect.
          const animation = media.animate(
            [
              {
                clipPath: "inset(0 0 100% 0)",
                transform: "translateY(1.5rem)",
              },
              {
                clipPath: "inset(0 0 0% 0)",
                transform: "translateY(0)",
              },
            ],
            { duration, delay, easing, fill: "both" },
          );
          item.removeAttribute("data-reveal");
          animations.set(item, animation);
          animation.onfinish = () => revealImmediately(item);
        }
      },
      {
        rootMargin: `0px 0px -${Math.round(window.innerHeight * 0.2)}px 0px`,
        threshold: 0,
      },
    );
    for (const item of items) {
      // Restored/deep scroll positions must not hide already-passed work.
      if (item.getBoundingClientRect().bottom <= 0) continue;
      item.dataset.reveal = "pending";
      observer.observe(item);
    }
    const focus = (event: FocusEvent) => {
      const item = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-gallery-reveal]",
      );
      if (item) {
        observer.unobserve(item);
        revealImmediately(item);
      }
    };
    const settle = () => {
      observer.disconnect();
      items.forEach(revealImmediately);
    };
    const preference = () => {
      if (reduced.matches) settle();
    };
    root.addEventListener("focusin", focus);
    reduced.addEventListener("change", preference);
    return () => {
      settle();
      root.removeEventListener("focusin", focus);
      reduced.removeEventListener("change", preference);
    };
  }, []);
  useEffect(() => {
    const element = dialog.current;
    return () => {
      if (element?.open)
        document.body.style.overflow = previousOverflow.current;
    };
  }, []);
  function close() {
    dialog.current?.close();
  }
  function finishClose() {
    document.body.style.overflow = previousOverflow.current;
    setOpened(false);
    trigger.current?.focus({ preventScroll: true });
  }
  function figure(image: GalleryImage, cover = false, style?: CSSProperties) {
    return (
      <figure
        key={image.index}
        className={styles.figure}
        style={style}
        data-gallery-reveal
      >
        <a
          href={image.src}
          aria-label={`${labels.openImage} ${image.index + 1}${image.alt ? ` — ${image.alt}` : ""}`}
          aria-haspopup="dialog"
          onClick={(event) => {
            if (
              event.button !== 0 ||
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey ||
              !dialog.current
            )
              return;
            event.preventDefault();
            trigger.current = event.currentTarget;
            setActive(image.index);
            previousOverflow.current = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            setOpened(true);
            dialog.current.showModal();
          }}
        >
          <MediaImage
            key={image.src}
            image={image}
            eager={cover}
            labels={labels}
          />
          <span className={styles.enlarge} aria-hidden="true">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4M9 12h6m-3-3v6" />
            </svg>
          </span>
        </a>
        {image.caption && <figcaption>{image.caption}</figcaption>}
      </figure>
    );
  }
  /** A gallery row file: images open the viewer, videos play inline at their
   * own aspect ratio (never cropped). */
  function rowItem(item: GalleryRowItem) {
    if (item.kind === "image") return figure(item.image);
    return (
      <div
        key={item.src}
        className={styles.rowVideo}
        style={
          item.width && item.height
            ? ({ "--ratio": `${item.width} / ${item.height}` } as CSSProperties)
            : undefined
        }
        data-gallery-reveal
      >
        {item.ambient ? (
          <CoverVideo
            src={item.src}
            poster={item.poster}
            label={item.label || labels.video}
            loop={item.loop}
          />
        ) : (
          <video
            src={item.src}
            poster={item.poster}
            loop={item.loop}
            controls
            muted
            playsInline
            preload="metadata"
            aria-label={item.label || labels.video}
          />
        )}
      </div>
    );
  }
  return (
    <>
      <section
        ref={gallery}
        className={styles.gallery}
        aria-label={labels.gallery}
      >
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={styles.mediaBlock}
            data-layout={"layout" in entry ? entry.layout : undefined}
            data-spacing={entry.spacing}
            data-cover={entry.id === "cover" ? "true" : undefined}
          >
            {entry.type === "highlights" ? (
              <div className={styles.highlightsBand} data-gallery-reveal>
                <div>
                  {entry.title && <h2>{entry.title}</h2>}
                  <dl className={styles.highlights}>
                    {entry.highlights.map((h) => (
                      <div key={h.id}>
                        <dt>{h.label}</dt>
                        <dd className={styles.highlightValue}>
                          <bdi>{h.value}</bdi>
                        </dd>
                        {h.description && <dd>{h.description}</dd>}
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            ) : entry.type === "media_text" ? (
              <div
                className={styles.mediaText}
                data-side={entry.side}
                data-feature={entry.feature ? "true" : undefined}
              >
                {entry.image && figure(entry.image)}
                {entry.video && (
                  <div data-gallery-reveal>
                    <video
                      src={entry.video.src}
                      poster={entry.video.poster}
                      controls
                      muted
                      playsInline
                      preload="metadata"
                      aria-label={entry.video.label}
                    />
                  </div>
                )}
                <div className={styles.mediaTextCopy}>
                  {entry.eyebrow && (
                    <p className={styles.eyebrow}>{entry.eyebrow}</p>
                  )}
                  {entry.title && <h2>{entry.title}</h2>}
                  {entry.text && <p>{entry.text}</p>}
                </div>
              </div>
            ) : entry.type === "video" && entry.ambient ? (
              <div data-gallery-reveal>
                <CoverVideo
                  src={entry.block.src}
                  poster={entry.block.poster}
                  label={entry.label}
                  loop={entry.block.loop ?? true}
                />
              </div>
            ) : entry.type === "video" ? (
              <div data-gallery-reveal>
                <video
                  src={entry.block.src}
                  poster={entry.block.poster || undefined}
                  autoPlay={entry.block.autoplay}
                  loop={entry.block.loop}
                  muted={entry.block.muted || entry.block.autoplay}
                  controls={entry.block.controls ?? true}
                  playsInline
                  preload="metadata"
                  aria-label={entry.label || labels.video}
                />
              </div>
            ) : entry.type === "row" ? (
              entry.layout === "pair" ? (
                <div className={styles.pair}>{entry.items.map(rowItem)}</div>
              ) : (
                entry.items.map(rowItem)
              )
            ) : entry.layout === "row" ? (
              // Widths follow each image's ratio, so the row shares one height.
              <div className={styles.row}>
                {entry.images.map((image) =>
                  figure(image, false, {
                    "--ratio":
                      image.width && image.height
                        ? image.width / image.height
                        : 4 / 3,
                  } as CSSProperties),
                )}
              </div>
            ) : entry.layout === "equal" || entry.layout === "staggered" ? (
              Array.from(
                { length: Math.ceil(entry.images.length / 2) },
                (_, pair) => (
                  <div
                    key={entry.images[pair * 2].index}
                    className={styles.pair}
                    data-staggered={
                      entry.layout === "staggered" ? "true" : undefined
                    }
                    data-alternate={pair % 2 ? "true" : undefined}
                  >
                    {entry.images
                      .slice(pair * 2, pair * 2 + 2)
                      .map((image) => figure(image))}
                  </div>
                ),
              )
            ) : (
              entry.images.map((image) => figure(image, entry.cover))
            )}
          </div>
        ))}
      </section>
      <dialog
        ref={dialog}
        className={styles.viewer}
        aria-label={labels.viewer}
        onClose={finishClose}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
          const next = event.key === (rtl ? "ArrowLeft" : "ArrowRight");
          setActive((value) =>
            Math.max(0, Math.min(images.length - 1, value + (next ? 1 : -1))),
          );
        }}
      >
        <div className={styles.viewerBar}>
          <span aria-live="polite" aria-atomic="true">
            <bdi>
              {active + 1} / {images.length}
            </bdi>
          </span>
          <button type="button" onClick={close}>
            {labels.close}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        {opened && images[active] && (
          <figure className={styles.viewerImage}>
            <MediaImage
              key={images[active].src}
              image={images[active]}
              eager
              labels={labels}
            />
            <figcaption>
              {images[active].caption || images[active].alt}
            </figcaption>
          </figure>
        )}
        <div className={styles.viewerBar}>
          <button
            type="button"
            disabled={active === 0}
            onClick={() => setActive((value) => value - 1)}
          >
            {labels.previous}
          </button>
          {images[active] && (
            <a href={images[active].src}>{labels.openOriginal}</a>
          )}
          <button
            type="button"
            disabled={active >= images.length - 1}
            onClick={() => setActive((value) => value + 1)}
          >
            {labels.next}
          </button>
        </div>
      </dialog>
    </>
  );
}
