"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, type RefObject } from "react";
import { formatStatValue } from "@/lib/articles/infographic-values";
import styles from "./infographics.module.css";

let registered = false;

function register() {
  if (registered) return;
  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}

function specOf(node: HTMLElement) {
  return {
    decimals: Number(node.dataset.decimals ?? "0"),
    grouped: node.dataset.grouped === "true",
  };
}

function restoreCounts(nodes: HTMLElement[]) {
  for (const node of nodes) node.textContent = node.dataset.final ?? "";
}

function animateCounts(root: HTMLElement, reduced: boolean) {
  const nodes = [...root.querySelectorAll<HTMLElement>("[data-count]")];
  if (!nodes.length || reduced) {
    restoreCounts(nodes);
    return () => {};
  }
  register();
  for (const node of nodes) {
    node.textContent = formatStatValue(0, specOf(node));
  }
  const items = nodes.map((node) => ({
    node,
    value: 0,
    target: Number(node.dataset.target),
  }));
  const timeline = gsap.timeline({
    scrollTrigger: { trigger: root, start: "top 85%", once: true },
  });
  for (const [index, item] of items.entries()) {
    timeline.to(
      item,
      {
        value: item.target,
        duration: 1.15,
        ease: "power2.out",
        onUpdate: () => {
          item.node.textContent = formatStatValue(item.value, specOf(item.node));
        },
      },
      index * 0.08,
    );
  }
  timeline.eventCallback("onComplete", () => restoreCounts(nodes));
  return () => {
    timeline.scrollTrigger?.kill();
    timeline.kill();
    restoreCounts(nodes);
  };
}

function animateBars(root: HTMLElement, reduced: boolean) {
  const fills = [...root.querySelectorAll<HTMLElement>("[data-bar]")];
  const reset = () => {
    for (const fill of fills) fill.style.width = `${fill.dataset.width ?? "0"}%`;
  };
  if (!fills.length || reduced) {
    reset();
    return () => {};
  }
  register();
  for (const fill of fills) fill.style.width = "0%";
  const timeline = gsap.timeline({
    scrollTrigger: { trigger: root, start: "top 85%", once: true },
  });
  for (const [index, fill] of fills.entries()) {
    timeline.to(
      fill,
      {
        width: `${fill.dataset.width ?? "0"}%`,
        duration: 0.9,
        ease: "power2.out",
      },
      index * 0.08,
    );
  }
  return () => {
    timeline.scrollTrigger?.kill();
    timeline.kill();
    reset();
  };
}

function reveal(root: HTMLElement, reduced: boolean) {
  const target = root.querySelector<HTMLElement>("[data-reveal]");
  if (!target || reduced) return () => {};
  register();
  const tween = gsap.fromTo(
    target,
    { y: 16 },
    {
      y: 0,
      duration: 0.7,
      ease: "power2.out",
      scrollTrigger: { trigger: root, start: "top 90%", once: true },
    },
  );
  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
    gsap.set(target, { clearProps: "transform" });
  };
}

function highlightEvents(root: HTMLElement, reduced: boolean) {
  if (reduced) return () => {};
  const items = [...root.querySelectorAll<HTMLElement>("[data-event]")];
  if (!items.length) return () => {};
  register();
  const triggers = items.map((item) =>
    ScrollTrigger.create({
      trigger: item,
      start: "top 72%",
      end: "bottom 42%",
      toggleClass: { targets: item, className: styles.eventActive },
    }),
  );
  return () => {
    for (const trigger of triggers) trigger.kill();
    for (const item of items) item.classList.remove(styles.eventActive);
  };
}

/** Scroll reveal, count-up, and bar growth. Reduced motion keeps the final state. */
export function useArticleMotion(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let cleanup = () => {};
    const run = () => {
      cleanup();
      const reduced = media.matches;
      const stops = [
        animateCounts(root, reduced),
        animateBars(root, reduced),
        reveal(root, reduced),
        highlightEvents(root, reduced),
      ];
      cleanup = () => {
        for (const stop of stops) stop();
      };
    };
    run();
    media.addEventListener("change", run);
    return () => {
      media.removeEventListener("change", run);
      cleanup();
    };
  }, [ref]);
}
