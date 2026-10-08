"use client";

// React Bits FallingText, installed with jsrepo v3.8.1.
// Local adaptation: whole semantic pills, lazy physics, pointer-only dragging,
// responsive boundaries, reduced motion, and one visibility-aware update loop.
// Source: https://reactbits.dev/text-animations/falling-text
import type { Body, Constraint, Engine } from "matter-js";
import { useEffect, useRef } from "react";
import "./FallingText.css";

export interface FallingTextProps {
  items: readonly string[];
  label: string;
  className?: string;
  partyReactive?: boolean;
}

interface Pill {
  element: HTMLLIElement;
  body: Body;
  width: number;
  height: number;
  homeX: number;
  homeY: number;
}

export default function FallingText({
  items,
  label,
  className = "",
  partyReactive = false,
}: FallingTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const list = listRef.current;
    if (!container || !list || items.length === 0) return;

    const elements = Array.from(list.querySelectorAll<HTMLLIElement>("li"));
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let matter: typeof import("matter-js") | undefined;
    let engine: Engine | undefined;
    let pills: Pill[] = [];
    let walls: Body[] = [];
    let width = 0;
    let height = 0;
    let visible = false;
    let hasEntered = false;
    let loading = false;
    let failed = false;
    let disposed = false;
    let generation = 0;
    let frame: number | undefined;
    let lastTime = 0;
    let drag: Constraint | undefined;
    let pointerId: number | undefined;
    let inset = Number.parseFloat(
      getComputedStyle(container).paddingInlineStart,
    );

    const pause = () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
      lastTime = 0;
    };

    const releaseDrag = () => {
      if (drag && engine && matter) matter.Composite.remove(engine.world, drag);
      drag = undefined;
      const id = pointerId;
      pointerId = undefined;
      if (id !== undefined && container.hasPointerCapture(id)) {
        container.releasePointerCapture(id);
      }
      delete container.dataset.dragging;
    };

    const draw = () => {
      if (!matter) return;
      for (const pill of pills) {
        const { body, element, homeX, homeY } = pill;
        // Keep labels legible and fully contained, including after text zoom.
        const angle = Math.max(-0.35, Math.min(0.35, body.angle));
        if (angle !== body.angle) {
          matter.Body.setAngle(body, angle);
          matter.Body.setAngularVelocity(body, 0);
        }
        const visualWidth =
          Math.abs(Math.cos(body.angle)) * pill.width +
          Math.abs(Math.sin(body.angle)) * pill.height;
        if (visualWidth > width - inset * 2) {
          matter.Body.setAngle(body, 0);
          matter.Body.setAngularVelocity(body, 0);
        }
        // Use physical bounds so pills can contact the floor and fall asleep.
        // The responsive inset reserves room for the rounded DOM corners.
        const halfWidth = (body.bounds.max.x - body.bounds.min.x) / 2;
        const halfHeight = (body.bounds.max.y - body.bounds.min.y) / 2;
        const x = Math.max(
          inset + halfWidth,
          Math.min(width - inset - halfWidth, body.position.x),
        );
        const y = Math.max(
          inset + halfHeight,
          Math.min(height - inset - halfHeight, body.position.y),
        );
        if (x !== body.position.x || y !== body.position.y) {
          const velocity = {
            x: x !== body.position.x ? 0 : body.velocity.x,
            y: y !== body.position.y ? 0 : body.velocity.y,
          };
          matter.Body.setPosition(body, { x, y });
          matter.Body.setVelocity(body, velocity);
        }
        element.style.setProperty(
          "--falling-transform",
          `translate(${body.position.x - homeX}px, ${body.position.y - homeY}px) rotate(${body.angle}rad)`,
        );
      }
    };

    const tick = (time: number) => {
      frame = undefined;
      if (!engine || !matter || !visible || document.hidden || motion.matches)
        return;
      // No Runner/Render loop: the engine advances exactly once per frame.
      matter.Engine.update(
        engine,
        Math.min(lastTime ? time - lastTime : 1000 / 60, 1000 / 60),
      );
      lastTime = time;
      draw();
      if (drag || pills.some(({ body }) => !body.isSleeping)) {
        frame = requestAnimationFrame(tick);
      } else {
        lastTime = 0;
        container.dataset.fallingState = "settled";
      }
    };

    const resume = () => {
      if (
        engine &&
        visible &&
        !document.hidden &&
        !motion.matches &&
        frame === undefined
      ) {
        if (!drag && pills.every(({ body }) => body.isSleeping)) return;
        container.dataset.fallingState = "falling";
        frame = requestAnimationFrame(tick);
      }
    };

    const replaceWalls = () => {
      if (!engine || !matter) return;
      matter.Composite.remove(engine.world, walls);
      const options = { isStatic: true };
      walls = [
        matter.Bodies.rectangle(
          width / 2,
          height - inset + 25,
          width + 100,
          50,
          options,
        ),
        matter.Bodies.rectangle(
          width / 2,
          inset - 25,
          width + 100,
          50,
          options,
        ),
        matter.Bodies.rectangle(
          inset - 25,
          height / 2,
          50,
          height + 100,
          options,
        ),
        matter.Bodies.rectangle(
          width - inset + 25,
          height / 2,
          50,
          height + 100,
          options,
        ),
      ];
      matter.Composite.add(engine.world, walls);
    };

    const resize = () => {
      if (!engine || !matter) return;
      const nextWidth = container.clientWidth;
      const nextHeight = container.clientHeight;
      if (!nextWidth || !nextHeight) return;
      const dimensions = pills.map(({ element }) => ({
        width: element.offsetWidth,
        height: element.offsetHeight,
        homeX: element.offsetLeft + element.offsetWidth / 2,
        homeY: element.offsetTop + element.offsetHeight / 2,
      }));
      if (
        nextWidth === width &&
        nextHeight === height &&
        dimensions.every(
          (size, i) =>
            size.width === pills[i].width &&
            size.height === pills[i].height &&
            size.homeX === pills[i].homeX &&
            size.homeY === pills[i].homeY,
        )
      )
        return;
      releaseDrag();
      for (const [i, pill] of pills.entries()) {
        const size = dimensions[i];
        // Scale in the body's local axes; scaling a rotated polygon in world
        // axes distorts it when a long label wraps during text enlargement.
        const angle = pill.body.angle;
        matter.Body.setAngle(pill.body, 0);
        matter.Body.scale(
          pill.body,
          size.width / pill.width,
          size.height / pill.height,
        );
        matter.Body.setAngle(pill.body, angle);
        matter.Body.setPosition(pill.body, {
          x: (pill.body.position.x * nextWidth) / width,
          y: (pill.body.position.y * nextHeight) / height,
        });
        matter.Sleeping.set(pill.body, false);
        Object.assign(pill, size);
      }
      width = nextWidth;
      height = nextHeight;
      inset = Number.parseFloat(getComputedStyle(container).paddingInlineStart);
      replaceWalls();
      draw();
      resume();
    };

    const reset = () => {
      generation += 1;
      loading = false;
      pause();
      releaseDrag();
      if (engine && matter) {
        matter.Composite.clear(engine.world, false);
        matter.Engine.clear(engine);
      }
      engine = undefined;
      pills = [];
      walls = [];
      for (const element of elements)
        element.style.removeProperty("--falling-transform");
      container.dataset.fallingState = "static";
    };

    const initialize = async () => {
      if (
        engine ||
        loading ||
        failed ||
        disposed ||
        motion.matches ||
        !hasEntered ||
        !visible
      )
        return;
      loading = true;
      const requestGeneration = generation;
      try {
        const [module] = await Promise.all([
          import("matter-js"),
          document.fonts.ready,
        ]);
        if (disposed || motion.matches || requestGeneration !== generation)
          return;
        matter = module.default;
        width = container.clientWidth;
        height = container.clientHeight;
        inset = Number.parseFloat(
          getComputedStyle(container).paddingInlineStart,
        );
        if (!width || !height) return;
        engine = matter.Engine.create({
          enableSleeping: true,
          positionIterations: 8,
        });
        engine.gravity.y = 1;
        pills = elements.map((element, index) => {
          const width = element.offsetWidth;
          const height = element.offsetHeight;
          const homeX = element.offsetLeft + width / 2;
          const homeY = element.offsetTop + height / 2;
          const body = module.default.Bodies.rectangle(
            homeX,
            homeY,
            width,
            height,
            {
              chamfer: { radius: Math.min(height / 2 - 1, 18) },
              restitution: 0.25,
              friction: 0.45,
              frictionAir: 0.025,
              sleepThreshold: 45,
            },
          );
          module.default.Body.setVelocity(body, {
            x: ((index % 3) - 1) * 1.2,
            y: 0,
          });
          module.default.Body.setAngularVelocity(
            body,
            (index % 2 ? 1 : -1) * 0.012,
          );
          return { element, body, width, height, homeX, homeY };
        });
        matter.Composite.add(
          engine.world,
          pills.map(({ body }) => body),
        );
        replaceWalls();
        container.dataset.fallingState = "falling";
        draw();
        resume();
      } catch {
        // A failed lazy chunk keeps the server-rendered terms readable.
        failed = true;
        reset();
      } finally {
        if (requestGeneration === generation) loading = false;
      }
    };

    const onMotion = () => {
      if (motion.matches) reset();
      else void initialize();
    };
    const onVisibility = () => {
      if (document.hidden) {
        releaseDrag();
        pause();
      } else {
        void initialize();
        resume();
      }
    };
    const point = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      return {
        x: Math.max(inset, Math.min(width - inset, event.clientX - rect.left)),
        y: Math.max(inset, Math.min(height - inset, event.clientY - rect.top)),
      };
    };
    const onPointerDown = (event: PointerEvent) => {
      if (
        event.pointerType !== "mouse" ||
        event.button !== 0 ||
        !engine ||
        !matter
      )
        return;
      const target =
        event.target instanceof Element ? event.target.closest("li") : null;
      const pill = pills.find(({ element }) => element === target);
      if (!pill) return;
      releaseDrag();
      const position = point(event);
      drag = matter.Constraint.create({
        bodyB: pill.body,
        pointA: position,
        pointB: {
          x: position.x - pill.body.position.x,
          y: position.y - pill.body.position.y,
        },
        length: 0,
        stiffness: 0.2,
        damping: 0.1,
      });
      matter.Composite.add(engine.world, drag);
      matter.Sleeping.set(pill.body, false);
      pointerId = event.pointerId;
      container.setPointerCapture(pointerId);
      container.dataset.dragging = "true";
      event.preventDefault();
      resume();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (drag && event.pointerId === pointerId) drag.pointA = point(event);
    };
    const onPointerEnd = (event: PointerEvent) => {
      if (event.pointerId === pointerId) releaseDrag();
    };

    const intersection = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (entry.intersectionRatio >= 0.3) hasEntered = true;
        if (visible) {
          void initialize();
          resume();
        } else {
          releaseDrag();
          pause();
        }
      },
      { threshold: [0, 0.3] },
    );
    intersection.observe(container);
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    observer.observe(list);
    for (const element of elements) observer.observe(element);
    motion.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", onVisibility);
    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerEnd);
    container.addEventListener("pointercancel", onPointerEnd);
    container.addEventListener("lostpointercapture", onPointerEnd);

    return () => {
      disposed = true;
      intersection.disconnect();
      observer.disconnect();
      motion.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerEnd);
      container.removeEventListener("pointercancel", onPointerEnd);
      container.removeEventListener("lostpointercapture", onPointerEnd);
      reset();
    };
  }, [items]);

  return (
    <div
      ref={containerRef}
      className={`falling-text-container ${className}`}
      data-falling-state="static"
      data-party-tags={partyReactive ? "" : undefined}
    >
      <ul ref={listRef} className="falling-text-list" aria-label={label}>
        {items.map((item, index) => (
          <li
            key={item}
            className="falling-text-pill"
            data-party-tag={partyReactive ? index : undefined}
          >
            <bdi>{item}</bdi>
          </li>
        ))}
      </ul>
    </div>
  );
}
