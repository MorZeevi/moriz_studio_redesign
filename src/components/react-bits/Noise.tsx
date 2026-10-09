"use client";

// Adapted from React Bits Noise (TS/CSS): https://reactbits.dev/animations/noise
// Local changes: tiled size/scale, parent sizing, visibility and reduced motion.
import { useEffect, useRef } from "react";
import "./Noise.css";

interface NoiseProps {
  patternSize?: number;
  patternScaleX?: number;
  patternScaleY?: number;
  patternRefreshInterval?: number;
  patternAlpha?: number;
}

export default function Noise({
  patternSize = 250,
  patternScaleX = 1,
  patternScaleY = 1,
  patternRefreshInterval = 2,
  patternAlpha = 15,
}: NoiseProps) {
  const grainRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = grainRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    const tile = document.createElement("canvas");
    const tileCtx = tile.getContext("2d", { alpha: true });
    if (!ctx || !tileCtx) return;

    tile.width = tile.height = Math.max(1, Math.round(patternSize));
    const imageData = tileCtx.createImageData(tile.width, tile.height);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const refreshInterval = Math.max(1, Math.round(patternRefreshInterval));
    let width = 0;
    let height = 0;
    let frame = 0;
    let animationId: number | undefined;
    const bounds = canvas.getBoundingClientRect();
    let visible = bounds.bottom > 0 && bounds.top < window.innerHeight;

    const drawGrain = () => {
      const { data } = imageData;
      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255;
        data[i] = data[i + 1] = data[i + 2] = value;
        data[i + 3] = patternAlpha;
      }
      tileCtx.putImageData(imageData, 0, 0);
      const pattern = ctx.createPattern(tile, "repeat");
      if (!pattern) return;
      pattern.setTransform(new DOMMatrix().scale(patternScaleX, patternScaleY));
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, width, height);
    };

    const loop = () => {
      frame++;
      if (frame % refreshInterval === 0) drawGrain();
      animationId = window.requestAnimationFrame(loop);
    };

    const syncPlayback = () => {
      const playing = visible && !document.hidden && !motion.matches;
      if (playing && animationId === undefined) {
        frame = 0;
        animationId = window.requestAnimationFrame(loop);
      } else if (!playing && animationId !== undefined) {
        window.cancelAnimationFrame(animationId);
        animationId = undefined;
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.imageSmoothingEnabled = false;
      drawGrain();
    };

    const resizeObserver = new ResizeObserver(resize);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncPlayback();
    });
    resize();
    resizeObserver.observe(canvas);
    visibilityObserver.observe(canvas);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", syncPlayback);
    motion.addEventListener("change", syncPlayback);
    syncPlayback();

    return () => {
      if (animationId !== undefined) window.cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", syncPlayback);
      motion.removeEventListener("change", syncPlayback);
    };
  }, [
    patternSize,
    patternScaleX,
    patternScaleY,
    patternRefreshInterval,
    patternAlpha,
  ]);

  return (
    <canvas
      className="react-bits-noise"
      ref={grainRef}
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
