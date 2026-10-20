"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./projects.module.css";

// Every logo gets the same visible area inside a 96×56 slot, so a wide
// wordmark and a square icon read as the same size.
const AREA = 56 * 56;
const MAX_WIDTH = 96;
const MAX_HEIGHT = 56;

type Fit = {
  width: number;
  height: number;
  imageWidth: number;
  imageHeight: number;
  x: number;
  y: number;
};

/** The bounds of the drawn pixels, ignoring transparent padding in the file. */
function inkBounds(img: HTMLImageElement) {
  const { naturalWidth: w, naturalHeight: h } = img;
  const full = { x: 0, y: 0, w, h };
  try {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const context = canvas.getContext("2d");
    if (!context) return full;
    context.drawImage(img, 0, 0);
    const { data } = context.getImageData(0, 0, w, h);
    let x0 = w;
    let y0 = h;
    let x1 = -1;
    let y1 = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 8) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    return x1 < 0 ? full : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  } catch {
    // A cross-origin file taints the canvas; fall back to the whole image.
    return full;
  }
}

function fitLogo(img: HTMLImageElement): Fit | null {
  if (!img.naturalWidth || !img.naturalHeight) return null;
  const ink = inkBounds(img);
  const ratio = ink.w / ink.h;
  let height = Math.sqrt(AREA / ratio);
  let width = height * ratio;
  const shrink = Math.min(1, MAX_WIDTH / width, MAX_HEIGHT / height);
  width *= shrink;
  height *= shrink;
  const scale = width / ink.w;
  return {
    width,
    height,
    imageWidth: img.naturalWidth * scale,
    imageHeight: img.naturalHeight * scale,
    x: ink.x * scale,
    y: ink.y * scale,
  };
}

/** A project logo cropped to its drawn pixels and sized by visible area. */
export function ProjectLogo({ src }: { src: string }) {
  const image = useRef<HTMLImageElement>(null);
  const [fit, setFit] = useState<Fit | null>(null);

  useEffect(() => {
    const element = image.current;
    if (!element) return;
    const measure = () => setFit(fitLogo(element));
    // The file may finish loading before hydration, when onLoad never fires.
    if (element.complete) measure();
    element.addEventListener("load", measure);
    return () => element.removeEventListener("load", measure);
  }, []);

  return (
    <span className={styles.stackLogo} aria-hidden="true">
      <span
        className={styles.stackLogoFrame}
        data-fit={fit ? "" : undefined}
        style={
          fit ? { inlineSize: fit.width, blockSize: fit.height } : undefined
        }
      >
        {/* biome-ignore lint/performance/noImgElement: private CMS logos bypass the image optimizer. */}
        <img
          ref={image}
          src={src}
          alt=""
          width={96}
          height={56}
          loading="lazy"
          decoding="async"
          style={
            fit
              ? {
                  inlineSize: fit.imageWidth,
                  blockSize: fit.imageHeight,
                  left: -fit.x,
                  top: -fit.y,
                }
              : undefined
          }
        />
      </span>
    </span>
  );
}
