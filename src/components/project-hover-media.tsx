"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Project } from "@/content/projects";
import { createHoverIntent } from "@/lib/hover-intent";
import { CoverVideo } from "./cover-video";
import styles from "./project-hover-media.module.css";

/** Loads the alternate only on intent, and keeps the cover until it is ready. */
export function ProjectHoverMedia({
  media,
  sizes,
}: {
  media: NonNullable<Project["hoverMedia"]>;
  sizes: string;
}) {
  const layer = useRef<HTMLDivElement>(null);
  const [requested, setRequested] = useState(false);
  const requestedRef = useRef(false);
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = layer.current;
    const boundary = element?.closest("a") ?? element?.parentElement;
    if (!boundary) return;
    let hovered = false;
    let focused = false;
    const sync = () => {
      const next = hovered || focused;
      if (next) {
        requestedRef.current = true;
        setRequested(true);
      }
      setActive(next);
    };
    // A video request streams the whole file, so the pointer must rest on the
    // card before it starts; sweeping across the grid fetches nothing.
    const intent = createHoverIntent({
      onIntent: () => {
        hovered = true;
        sync();
      },
      onLeave: () => {
        hovered = false;
        sync();
      },
      immediate: () => requestedRef.current,
    });
    const enter = (event: PointerEvent) => {
      if (
        event.pointerType === "touch" ||
        !window.matchMedia("(hover: hover) and (pointer: fine)").matches
      )
        return;
      intent.enter();
    };
    const leave = () => intent.leave();
    const focus = () => {
      focused =
        boundary.matches(":focus-visible") ||
        Boolean(boundary.querySelector(":focus-visible"));
      sync();
    };
    const blur = (event: FocusEvent) => {
      if (
        event.relatedTarget instanceof Node &&
        boundary.contains(event.relatedTarget)
      )
        return;
      focused = false;
      sync();
    };
    boundary.addEventListener("pointerenter", enter);
    boundary.addEventListener("pointerleave", leave);
    boundary.addEventListener("focusin", focus);
    boundary.addEventListener("focusout", blur);
    return () => {
      intent.leave();
      boundary.removeEventListener("pointerenter", enter);
      boundary.removeEventListener("pointerleave", leave);
      boundary.removeEventListener("focusin", focus);
      boundary.removeEventListener("focusout", blur);
    };
  }, []);

  const image = media.kind === "image" ? media.src : media.poster;
  return (
    <div
      ref={layer}
      className={styles.layer}
      data-active={active && ready && !failed ? "" : undefined}
      data-video-only={media.kind === "video" && !media.poster ? "" : undefined}
      aria-hidden="true"
    >
      {requested && !failed && (
        <>
          {image && (
            <Image
              src={image}
              alt=""
              fill
              sizes={sizes}
              unoptimized={image.startsWith("/media/")}
              className={styles.media}
              onLoad={() => setReady(true)}
              onError={() => setFailed(true)}
            />
          )}
          {media.kind === "video" && (
            <CoverVideo
              src={media.src}
              poster={media.poster}
              label={media.alt}
              playing={active}
              className={styles.media}
              onReady={() => setReady(true)}
              onError={() => setFailed(true)}
            />
          )}
        </>
      )}
    </div>
  );
}
