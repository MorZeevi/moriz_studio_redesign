"use client";

import { useEffect, useId, useState } from "react";
import { LiquidWindowMask } from "@/components/liquid-window-mask";
import {
  buildLiquidWindowGrid,
  LIQUID_WINDOW_DURATION,
  type LiquidWindowGrid,
} from "@/lib/liquid-window-grid";
import {
  PIXEL_REVEAL_DEADLINE,
  PIXEL_REVEAL_STORAGE_KEY,
} from "@/lib/pixel-reveal";

const HOLD_DURATION = 300;

/** Adapted from the owner's supplied pixel-reveal-nextjs_new/PixelReveal.tsx. */
export function PixelReveal() {
  const filterId = `pixel-reveal-${useId().replace(/:/g, "")}`;
  const [grid, setGrid] = useState<LiquidWindowGrid | null>(null);
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const listeners = new AbortController();
    let cancelled = false;
    let finished = false;
    let frame = 0;
    let fontTimer = 0;
    let holdTimer = 0;
    let endTimer = 0;
    let deadlineTimer = 0;

    function clearScheduledWork() {
      cancelAnimationFrame(frame);
      window.clearTimeout(fontTimer);
      window.clearTimeout(holdTimer);
      window.clearTimeout(endTimer);
      window.clearTimeout(deadlineTimer);
    }

    function finish(record = true) {
      if (cancelled || finished) return;
      finished = true;
      clearScheduledWork();
      listeners.abort();
      if (record) {
        try {
          sessionStorage.setItem(PIXEL_REVEAL_STORAGE_KEY, "1");
        } catch {
          // The document state still prevents replay on client navigation.
        }
      }
      html.dataset.pixelReveal = "done";
      delete html.dataset.pixelRevealStarted;
      setDone(true);
    }

    let seen = html.dataset.pixelReveal === "done";
    try {
      seen ||= !!sessionStorage.getItem(PIXEL_REVEAL_STORAGE_KEY);
    } catch {
      // Storage is optional; never block the homepage when it is unavailable.
    }
    if (
      seen ||
      window.matchMedia("(max-width: 63.999rem)").matches ||
      motion.matches ||
      document.hidden ||
      (location.hash && location.hash !== "#top")
    ) {
      finish(false);
      return;
    }

    const started = Number(
      html.dataset.pixelRevealStarted ?? performance.now(),
    );
    const remaining = PIXEL_REVEAL_DEADLINE - (performance.now() - started);
    if (remaining <= 0) {
      finish();
      return;
    }
    html.dataset.pixelReveal = "active";
    html.dataset.pixelRevealStarted = String(started);

    // Keep the supplied windows, with a half-window overhang at every edge.
    const w = window.innerWidth;
    const h = window.innerHeight;
    const nextGrid = buildLiquidWindowGrid(w, h);
    const total =
      Math.max(...nextGrid.cells.map((cell) => cell.delay)) +
      LIQUID_WINDOW_DURATION;
    setGrid(nextGrid);

    // Capture also sees media elements' own `resize` (e.g. the hero video
    // loading metadata); only a viewport resize should end the opening.
    const dismiss = (event?: Event) => {
      if (event?.type === "resize" && event.target !== window) return;
      finish();
    };
    const options = { capture: true, passive: true, signal: listeners.signal };
    for (const event of [
      "keydown",
      "pointerdown",
      "wheel",
      "touchmove",
      "scroll",
      "resize",
      "hashchange",
    ]) {
      window.addEventListener(event, dismiss, options);
    }
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) finish();
      },
      options,
    );
    motion.addEventListener("change", dismiss, { signal: listeners.signal });
    deadlineTimer = window.setTimeout(dismiss, remaining);

    const fontDeadline = new Promise<void>((resolve) => {
      fontTimer = window.setTimeout(resolve, 800);
    });
    Promise.race([document.fonts.ready, fontDeadline]).then(() => {
      window.clearTimeout(fontTimer);
      if (cancelled || finished) return;
      holdTimer = window.setTimeout(() => {
        frame = requestAnimationFrame(() => {
          frame = requestAnimationFrame(() => {
            if (cancelled || finished) return;
            setPlaying(true);
            endTimer = window.setTimeout(dismiss, total + 40);
          });
        });
      }, HOLD_DURATION);
    });

    return () => {
      cancelled = true;
      clearScheduledWork();
      listeners.abort();
      // A route change must never leave the shared document in an active state.
      // Preserve the start time so Strict Mode's immediate remount can resume.
      if (!finished) html.dataset.pixelReveal = "skip";
    };
  }, []);

  if (done) return null;

  return (
    <div className="pixel-reveal" aria-hidden="true">
      {!grid && <div className="pixel-reveal__solid" />}
      {grid && (
        <svg
          className="pixel-reveal__svg"
          width={grid.w}
          height={grid.h}
          viewBox={`0 0 ${grid.w} ${grid.h}`}
          focusable="false"
        >
          <title>Decorative liquid window reveal</title>
          <LiquidWindowMask id={filterId} grid={grid} playing={playing} />
          <rect
            width={grid.w}
            height={grid.h}
            fill="var(--color-secondary)"
            mask={`url(#${filterId}-mask)`}
          />
        </svg>
      )}
    </div>
  );
}
