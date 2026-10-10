"use client";

import gsap from "gsap";
import {
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useRef,
} from "react";
import { usePartyMode } from "./party-mode/party-mode-provider";
import styles from "./infinity-loop.module.css";

// One closed figure-eight; the two lobes cross at the centre (100, 50).
const PATH =
  "M100 50C125 15 185 15 185 50C185 85 125 85 100 50C75 15 15 15 15 50C15 85 75 85 100 50Z";
const SAMPLES = 240;
const LAP_SECONDS = 16;
// Drag search window either side of the current position (fraction of a
// lap), so the dot cannot jump to the other lobe where they cross.
const DRAG_WINDOW = 0.12;
const KEY_STEP = 0.02;
// Party groove: one lift and landing per beat, tilting left then right.
const BEAT_SECONDS = 0.6;
const PARTY_LAP_SPEED = 3;

const wrap = (value: number) => ((value % 1) + 1) % 1;

/**
 * Advantages card three: a dot slides slowly and endlessly along an infinity sign.
 * Visitors can drag it (or nudge it by keyboard) and it carries on from there.
 * In Party mode the sign dances to a beat and the bead races around it.
 */
export function InfinityLoop({
  labels,
}: {
  labels: { symbol: string; dot: string };
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGGElement>(null);
  const control = useRef<{
    place: (progress: number) => void;
    hold: () => void;
    release: () => void;
    nearest: (x: number, y: number) => number;
    progress: () => number;
    lap: gsap.core.Tween;
  } | null>(null);
  const { phase } = usePartyMode();
  const dancing = phase === "active";

  useEffect(() => {
    const svg = svgRef.current;
    const path = pathRef.current;
    const dot = dotRef.current;
    if (!svg || !path || !dot) return;
    const length = path.getTotalLength();
    const table = Array.from({ length: SAMPLES }, (_, index) => {
      const point = path.getPointAtLength((index / SAMPLES) * length);
      return { x: point.x, y: point.y };
    });
    const state = { progress: 0 };
    let held = false;
    let visible = true;

    const place = (progress: number) => {
      state.progress = wrap(progress);
      const point = path.getPointAtLength(state.progress * length);
      dot.setAttribute("transform", `translate(${point.x} ${point.y})`);
      dot.setAttribute(
        "aria-valuenow",
        String(Math.round(state.progress * 100)),
      );
    };

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    // fromTo, so resuming at any progress maps onto the same 0–1 lap.
    const tween = gsap.fromTo(
      state,
      { progress: 0 },
      {
        progress: 1,
        duration: LAP_SECONDS,
        ease: "none",
        repeat: -1,
        paused: true,
        onUpdate: () => place(state.progress),
      },
    );
    const sync = () => {
      if (reducedMotion || held || !visible) tween.pause();
      else tween.progress(state.progress).play();
    };

    control.current = {
      place,
      hold: () => {
        held = true;
        sync();
      },
      release: () => {
        held = false;
        sync();
      },
      // Nearest sample within the window around the current position.
      nearest: (x, y) => {
        let best = state.progress;
        let bestDistance = Number.POSITIVE_INFINITY;
        const span = Math.round(DRAG_WINDOW * SAMPLES);
        const origin = Math.round(state.progress * SAMPLES);
        for (let offset = -span; offset <= span; offset++) {
          const index = (((origin + offset) % SAMPLES) + SAMPLES) % SAMPLES;
          const sample = table[index];
          const distance = (sample.x - x) ** 2 + (sample.y - y) ** 2;
          if (distance < bestDistance) {
            bestDistance = distance;
            best = index / SAMPLES;
          }
        }
        return best;
      },
      progress: () => state.progress,
      lap: tween,
    };

    // Off-screen, the loop rests.
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(svg);
    // Chrome ignores touch-action on SVG children, so a touch that starts on
    // the bead opts out of panning here; elsewhere the sign still scrolls.
    const keepTouch = (event: TouchEvent) => event.preventDefault();
    dot.addEventListener("touchstart", keepTouch, { passive: false });
    place(reducedMotion ? 0.125 : 0);
    sync();
    return () => {
      observer.disconnect();
      dot.removeEventListener("touchstart", keepTouch);
      tween.kill();
      control.current = null;
    };
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    const lap = control.current?.lap;
    if (
      !dancing ||
      !svg ||
      !lap ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    gsap.set(svg, { transformOrigin: "50% 100%" });
    // A quick lift and a weighted landing with a small squash, like the
    // Party tags, rather than a sinusoidal float.
    const groove = gsap.timeline({ repeat: -1 });
    for (const tilt of [-4, 4]) {
      groove
        .to(svg, {
          y: -8,
          rotation: tilt,
          scaleX: 1,
          scaleY: 1,
          duration: BEAT_SECONDS * 0.34,
          ease: "power3.out",
        })
        .to(svg, {
          y: 0,
          rotation: 0,
          duration: BEAT_SECONDS * 0.41,
          ease: "power2.in",
        })
        .to(svg, {
          scaleX: 1.06,
          scaleY: 0.94,
          duration: BEAT_SECONDS * 0.12,
          ease: "power1.out",
        })
        .to(svg, {
          scaleX: 1,
          scaleY: 1,
          duration: BEAT_SECONDS * 0.13,
          ease: "power1.in",
        });
    }
    gsap.to(lap, { timeScale: PARTY_LAP_SPEED, duration: 0.6 });
    return () => {
      groove.kill();
      gsap.to(lap, { timeScale: 1, duration: 0.6 });
      gsap.to(svg, {
        y: 0,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        duration: 0.3,
        ease: "power2.out",
        overwrite: true,
        onComplete: () =>
          gsap.set(svg, { clearProps: "transform,transformOrigin" }),
      });
    };
  }, [dancing]);

  const toLocal = (event: PointerEvent<SVGSVGElement>) => {
    const matrix = svgRef.current?.getScreenCTM();
    if (!matrix) return null;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      matrix.inverse(),
    );
    return { x: point.x, y: point.y };
  };

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    const loop = control.current;
    if (!loop || !dotRef.current?.contains(event.target as Node)) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset.dragging = "";
    loop.hold();
  };

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const loop = control.current;
    const point = toLocal(event);
    if (
      !loop ||
      !point ||
      !event.currentTarget.hasPointerCapture(event.pointerId)
    )
      return;
    loop.place(loop.nearest(point.x, point.y));
  };

  const onPointerUp = (event: PointerEvent<SVGSVGElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    delete event.currentTarget.dataset.dragging;
    control.current?.release();
  };

  const onKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    const loop = control.current;
    if (!loop) return;
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[
      event.key
    ];
    if (!step) return;
    event.preventDefault();
    loop.hold();
    loop.place(loop.progress() + step * KEY_STEP);
  };

  return (
    <div className={styles.root} data-infinity-loop>
      <svg
        ref={svgRef}
        className={styles.svg}
        viewBox="0 0 200 100"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <title>{labels.symbol}</title>
        <path ref={pathRef} className={styles.track} d={PATH} />
        <g
          ref={dotRef}
          className={styles.dot}
          role="slider"
          tabIndex={0}
          aria-label={labels.dot}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
          transform="translate(100 50)"
          onKeyDown={onKeyDown}
          // Held while focused, so assistive tech is not flooded with values.
          onFocus={() => control.current?.hold()}
          onBlur={() => control.current?.release()}
        >
          <circle className={styles.hit} r="16" />
          <circle className={styles.bead} r="7" />
        </g>
      </svg>
    </div>
  );
}
