"use client";

// React Bits TextPressure, installed with jsrepo v3.8.1.
// Source: https://reactbits.dev/r/TextPressure-TS-CSS
// Original: https://codepen.io/JuanFuentes/full/rgXKGQ
// Local adaptation: inline wordmark (no heading), self-hosted variable font,
// stable layout, preserved case, regular/bold baseline, proximity-based updates,
// bounded animation, reduced motion and native touch scrolling.
import { useEffect, useRef } from "react";
import "./TextPressure.css";

interface TextPressureProps {
  text: string;
  baseWeight?: number;
  boldPrefix?: string;
}

const getAttr = (distance: number, radius: number, min: number, max: number) =>
  min + (max - min) * Math.max(0, 1 - distance / radius);

export default function TextPressure({
  text,
  baseWeight = 400,
  boldPrefix = "",
}: TextPressureProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const prefixLength = text.startsWith(boldPrefix)
    ? Array.from(boldPrefix).length
    : 0;
  const occurrences = new Map<string, number>();
  const chars = Array.from(text).map((char, index) => {
    const occurrence = (occurrences.get(char) ?? 0) + 1;
    occurrences.set(char, occurrence);
    return {
      char,
      key: `${char}-${occurrence}`,
      normalWeight: index < prefixLength ? 700 : baseWeight,
    };
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !text) return;
    const surface = root.closest("a") ?? root;
    const spans = Array.from(
      root.querySelectorAll<HTMLElement>("[data-pressure-char]"),
    );
    const normalWeights = spans.map((_, index) =>
      index < prefixLength ? 700 : baseWeight,
    );
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;
    let visible = true;
    let disposed = false;
    let geometryDirty = true;
    let centers: { x: number; y: number }[] = [];
    let radius = 32;
    let targetStrength = 0;
    let strength = 0;
    let px = 0;
    let py = 0;
    let gx = 0;
    let gy = 0;

    function measure() {
      if (!root) return;
      const bounds = root.getBoundingClientRect();
      // Use resting glyph positions, not the moving glyphs or the larger
      // reserved box. Otherwise compression moves its own pressure target.
      const rects = spans.map((span) => span.getBoundingClientRect());
      const last = rects.at(-1);
      if (!last) return;
      centers = rects.map((rect) => ({
        x: rect.left + rect.width / 2 - bounds.left,
        y: rect.top + rect.height / 2 - bounds.top,
      }));
      radius = Math.max(24, (last.right - rects[0].left) / 2);
      geometryDirty = false;
    }

    function paint() {
      frame = 0;
      if (
        !root ||
        motion.matches ||
        !finePointer.matches ||
        !visible ||
        document.hidden
      )
        return;
      if (geometryDirty) measure();
      const bounds = root.getBoundingClientRect();
      gx += (px - gx) / 15;
      gy += (py - gy) / 15;
      strength += (targetStrength - strength) * 0.18;
      const settling =
        Math.abs(targetStrength - strength) > 0.002 ||
        (targetStrength > 0 && Math.hypot(px - gx, py - gy) > 0.1);
      if (!settling) {
        gx = px;
        gy = py;
        strength = targetStrength;
      }
      spans.forEach((span, index) => {
        const center = centers[index];
        const distance = Math.hypot(
          gx - bounds.left - center.x,
          gy - bounds.top - center.y,
        );
        const pressureWeight = getAttr(
          distance,
          radius,
          normalWeights[index],
          prefixLength > 0 && index >= prefixLength ? baseWeight : 900,
        );
        // The registry's 5..200 requests clamp to Roboto Flex's actual
        // 25..151 axis: far letters compress as nearby letters expand.
        const pressureWidth = Math.min(
          151,
          Math.max(25, 205 - (200 * distance) / radius),
        );
        const weight =
          normalWeights[index] +
          (pressureWeight - normalWeights[index]) * strength;
        const width = 100 + (pressureWidth - 100) * strength;
        span.style.fontVariationSettings = `'wght' ${weight.toFixed(1)}, 'wdth' ${width.toFixed(1)}, 'opsz' 24`;
      });
      if (settling) frame = requestAnimationFrame(paint);
    }

    function start() {
      if (
        !frame &&
        !motion.matches &&
        finePointer.matches &&
        visible &&
        !document.hidden
      )
        frame = requestAnimationFrame(paint);
    }
    function track(event: PointerEvent) {
      if (
        !root ||
        event.pointerType === "touch" ||
        motion.matches ||
        !finePointer.matches ||
        !visible ||
        document.hidden
      )
        return;
      if (geometryDirty) measure();
      const bounds = root.getBoundingClientRect();
      const edgeDistance = Math.hypot(
        Math.max(bounds.left - event.clientX, 0, event.clientX - bounds.right),
        Math.max(bounds.top - event.clientY, 0, event.clientY - bounds.bottom),
      );
      const nextStrength = Math.max(0, 1 - edgeDistance / radius);
      if (!nextStrength && !strength && !frame) return;
      if (!strength && !frame) {
        gx = event.clientX;
        gy = event.clientY;
      }
      px = event.clientX;
      py = event.clientY;
      targetStrength = nextStrength;
      start();
    }
    function leave() {
      targetStrength = 0;
      start();
    }
    function reset() {
      targetStrength = strength = 0;
      cancelAnimationFrame(frame);
      frame = 0;
      geometryDirty = true;
      spans.forEach((span, index) => {
        span.style.fontVariationSettings = `'wght' ${normalWeights[index]}, 'wdth' 100, 'opsz' 24`;
      });
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) reset();
    });
    observer.observe(root);
    window.addEventListener("pointermove", track, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("pointercancel", reset);
    surface.addEventListener("blur", leave);
    motion.addEventListener("change", reset);
    finePointer.addEventListener("change", reset);
    document.addEventListener("visibilitychange", reset);
    window.addEventListener("scroll", reset, { passive: true });
    window.addEventListener("resize", reset);
    void document.fonts.ready.then(() => {
      if (!disposed) reset();
    });
    return () => {
      disposed = true;
      reset();
      observer.disconnect();
      window.removeEventListener("pointermove", track);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointercancel", reset);
      surface.removeEventListener("blur", leave);
      motion.removeEventListener("change", reset);
      finePointer.removeEventListener("change", reset);
      document.removeEventListener("visibilitychange", reset);
      window.removeEventListener("scroll", reset);
      window.removeEventListener("resize", reset);
    };
  }, [text, baseWeight, prefixLength]);

  return (
    <span ref={rootRef} className="text-pressure" dir="ltr">
      <span className="text-pressure-readable">{text}</span>
      <span className="text-pressure-measure" aria-hidden="true">
        {text}
      </span>
      <span className="text-pressure-visual" aria-hidden="true">
        {chars.map(({ char, key, normalWeight }) => (
          <span
            key={key}
            data-pressure-char
            style={{
              fontVariationSettings: `'wght' ${normalWeight}, 'wdth' 100, 'opsz' 24`,
            }}
          >
            {char}
          </span>
        ))}
      </span>
    </span>
  );
}
