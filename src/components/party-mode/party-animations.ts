import { partyVideoSource } from "./media";
import {
  type BeamScene,
  beamScenes,
  type Point,
  partyCyan,
  projectedCone,
  type TagColors,
  tagColorFrames,
  tagDanceFrames,
} from "./party-light-model";
import type { PartyPhase } from "./party-mode-provider";

type Callbacks = {
  onPhase: (phase: PartyPhase) => void;
  onFailure: () => void;
};
type Snapshot = Map<
  HTMLElement,
  {
    transform: string;
    opacity: string;
    backgroundColor: string;
    color: string;
    danceTransform: string;
  }
>;
const motionQuery = "(prefers-reduced-motion: reduce)";
const basePeriod = 12000;

/** Owns only Party animations. Canceling restores the existing CSS cascade. */
export class PartyAnimations {
  private readonly rig: HTMLElement;
  private readonly atmosphere: HTMLElement;
  private readonly reflections: HTMLElement;
  private readonly beams: HTMLElement;
  private readonly poster: HTMLImageElement;
  private readonly video: HTMLVideoElement;
  private readonly dots: HTMLElement[];
  private readonly rays: HTMLElement[];
  private readonly targets: HTMLElement[];
  private readonly projections: HTMLElement[];
  private readonly tagGroup: HTMLElement | null;
  private readonly tags: HTMLElement[];
  private readonly protectedContent: HTMLElement[];
  private readonly tagNormals = new Map<HTMLElement, TagColors>();
  private readonly tagPalette: TagColors[];
  private readonly motion = window.matchMedia(motionQuery);
  private readonly compact = window.matchMedia("(max-width: 63.999rem)");
  private readonly listeners = new AbortController();
  private readonly animations = new Set<Animation>();
  private readonly suspended = new Set<Animation>();
  private readonly loops = new Map<HTMLElement, Animation>();
  private readonly dances = new Map<HTMLElement, Animation>();
  private readonly visible = new Set<HTMLElement>();
  private readonly targetObserver: IntersectionObserver;
  private readonly geometryObserver: ResizeObserver;
  private transition = new AbortController();
  private enabled = false;
  private disposed = false;
  private phase: PartyPhase = "idle";
  private generation = 0;
  private resizeFrame = 0;
  private projectionFrame = 0;
  private scenes: BeamScene[] = [];
  private origin: Point = { x: 0, y: 0 };
  private lastVideoTime = 0;
  private videoLoops = 0;
  private videoStarted = false;
  private tagDragging = false;
  private danceCompact = this.compact.matches;

  constructor(
    private readonly root: HTMLElement,
    private readonly callbacks: Callbacks,
  ) {
    const find = <T extends HTMLElement>(selector: string) => {
      const element = root.querySelector<T>(selector);
      if (!element) throw new Error(`Missing Party element: ${selector}`);
      return element;
    };
    this.rig = find("[data-party-rig]");
    this.atmosphere = find("[data-party-atmosphere]");
    this.reflections = find("[data-party-reflections]");
    this.beams = find("[data-party-beams]");
    this.poster = find<HTMLImageElement>("[data-party-poster]");
    this.video = find<HTMLVideoElement>("[data-party-video]");
    this.prepareVideo();
    this.dots = [
      ...root.querySelectorAll<HTMLElement>("[data-party-reflection]"),
    ];
    this.rays = [...root.querySelectorAll<HTMLElement>("[data-party-beam]")];
    this.targets = [
      ...document.querySelectorAll<HTMLElement>("[data-party-react]"),
    ];
    this.projections = [
      ...document.querySelectorAll<HTMLElement>("[data-party-projection]"),
    ];
    this.tagGroup = document.querySelector<HTMLElement>("[data-party-tags]");
    this.tags = [...document.querySelectorAll<HTMLElement>("[data-party-tag]")];
    this.protectedContent = [
      ...document.querySelectorAll<HTMLElement>(
        "main p, main a, main button, main summary, header a, header button, footer p, footer a, [data-party-tags]",
      ),
    ];
    this.refreshTheme();
    const brand = getComputedStyle(root);
    this.tagPalette = [
      {
        backgroundColor: brand.getPropertyValue("--color-action-primary"),
        color: brand.getPropertyValue("--color-light"),
      },
      {
        backgroundColor: brand.getPropertyValue("--color-secondary"),
        color: brand.getPropertyValue("--color-dark"),
      },
      {
        backgroundColor: partyCyan,
        color: brand.getPropertyValue("--color-dark"),
      },
    ];
    this.targetObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const target = entry.target as HTMLElement;
        if (entry.isIntersecting) this.visible.add(target);
        else {
          this.visible.delete(target);
          this.stopLoop(target);
          for (const light of target.querySelectorAll<HTMLElement>(
            "[data-party-heading-light]",
          ))
            this.stopLoop(light);
          if (target === this.tagGroup)
            for (const tag of this.tags) {
              this.stopLoop(tag);
              this.stopDance(tag);
            }
        }
      }
      if (this.phase === "active") this.animateUi();
    });
    for (const target of this.targets) this.targetObserver.observe(target);
    if (this.tagGroup) this.targetObserver.observe(this.tagGroup);
    this.geometryObserver = new ResizeObserver(this.resize);
    for (const projection of this.projections)
      this.geometryObserver.observe(projection);
    const main = document.getElementById("main-content");
    if (main) this.geometryObserver.observe(main);
    const options = { signal: this.listeners.signal };
    document.addEventListener(
      "visibilitychange",
      this.visibilityChanged,
      options,
    );
    window.addEventListener("resize", this.resize, options);
    window.addEventListener("scroll", this.scroll, {
      ...options,
      passive: true,
    });
    this.motion.addEventListener("change", this.motionChanged, options);
    this.video.addEventListener("loadeddata", this.playVideo, options);
    this.video.addEventListener("playing", this.synchronize, options);
    this.video.addEventListener("seeked", this.synchronize, options);
    this.video.addEventListener("timeupdate", this.videoAdvanced, options);
    this.video.addEventListener("error", this.hideVideo, options);
    this.video.addEventListener("emptied", this.hideVideo, options);
    this.tagGroup?.addEventListener("pointerdown", this.tagDragStarted, {
      ...options,
      capture: true,
    });
    this.tagGroup?.addEventListener(
      "lostpointercapture",
      this.tagDragEnded,
      options,
    );
    window.addEventListener("pointerup", this.tagDragEnded, options);
    window.addEventListener("pointercancel", this.tagDragEnded, options);
    this.layout();
  }

  private setPhase(phase: PartyPhase) {
    this.phase = phase;
    this.root.dataset.phase = phase;
    this.callbacks.onPhase(phase);
  }

  private snapshot(): Snapshot {
    return new Map(
      [
        this.rig,
        this.atmosphere,
        this.reflections,
        this.beams,
        ...this.targets,
        ...this.projections,
        ...this.tags,
      ].map((element) => {
        const style = getComputedStyle(element);
        return [
          element,
          {
            transform: style.transform,
            opacity: style.opacity,
            backgroundColor: style.backgroundColor,
            color: style.color,
            danceTransform: this.danceTransform(element, style),
          },
        ];
      }),
    );
  }

  private cancel(animation: Animation) {
    animation.cancel();
    this.animations.delete(animation);
    this.suspended.delete(animation);
  }

  private stopLoop(element: HTMLElement) {
    const animation = this.loops.get(element);
    if (animation) this.cancel(animation);
    this.loops.delete(element);
  }

  private stopDance(tag: HTMLElement) {
    const animation = this.dances.get(tag);
    if (animation) this.cancel(animation);
    this.dances.delete(tag);
  }

  private danceTransform(tag: HTMLElement, style: CSSStyleDeclaration) {
    if (!this.dances.has(tag)) return "none";
    const physics = this.motion.matches
      ? "none"
      : style.getPropertyValue("--falling-transform").trim() || "none";
    const base = new DOMMatrix(physics === "none" ? undefined : physics);
    const composed = new DOMMatrix(
      style.transform === "none" ? undefined : style.transform,
    );
    const dance = base.inverse().multiply(composed);
    if (
      [dance.a - 1, dance.b, dance.c, dance.d - 1, dance.e, dance.f].every(
        (value) => Math.abs(value) < 0.001,
      )
    )
      return "none";
    return dance.toString();
  }

  private cancelAll() {
    for (const animation of this.animations) animation.cancel();
    this.animations.clear();
    this.suspended.clear();
    this.loops.clear();
    this.dances.clear();
  }

  private animate(
    element: HTMLElement,
    frames: Keyframe[],
    options: KeyframeAnimationOptions,
  ) {
    const animation = element.animate(frames, { fill: "both", ...options });
    this.animations.add(animation);
    // Canceled animations reject finished; an interrupted sequence is expected.
    void animation.finished.catch(() => {});
    if (document.hidden) {
      animation.pause();
      this.suspended.add(animation);
    }
    return animation;
  }

  private settleUi(snapshot: Snapshot) {
    for (const target of this.targets) {
      const start = snapshot.get(target)?.transform ?? "none";
      if (start === "none") continue;
      const animation = this.animate(
        target,
        [{ transform: start }, { transform: "none" }],
        {
          duration: 180,
          easing: "cubic-bezier(0.2, 0, 0, 1)",
        },
      );
      void animation.finished
        .then(() => this.cancel(animation))
        .catch(() => {});
    }
    for (const tag of this.tags) {
      const start = snapshot.get(tag);
      if (start && start.danceTransform !== "none") {
        const settle = this.animate(
          tag,
          [
            { transform: start.danceTransform },
            { transform: "translateY(0px) rotate(0deg)" },
          ],
          {
            duration: 180,
            composite: "add",
            easing: "cubic-bezier(0.2, 0, 0, 1)",
          },
        );
        settle.id = "party-tag-settle";
        this.dances.set(tag, settle);
        void settle.finished
          .then(() => {
            this.cancel(settle);
            if (this.dances.get(tag) === settle) this.dances.delete(tag);
          })
          .catch(() => {});
      }
      const normal = this.tagNormals.get(tag);
      if (
        !start ||
        !normal ||
        (start.backgroundColor === normal.backgroundColor &&
          start.color === normal.color)
      )
        continue;
      const animation = this.animate(
        tag,
        [
          { backgroundColor: start.backgroundColor, color: start.color },
          { ...normal },
        ],
        { duration: 180, easing: "steps(1, end)" },
      );
      void animation.finished
        .then(() => this.cancel(animation))
        .catch(() => {});
    }
  }

  private waitForPoster(signal: AbortSignal) {
    if (this.poster.complete && this.poster.naturalWidth > 0)
      return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timeout);
        this.poster.removeEventListener("load", loaded);
        this.poster.removeEventListener("error", failed);
        signal.removeEventListener("abort", aborted);
      };
      const loaded = () => {
        cleanup();
        resolve();
      };
      const failed = () => {
        cleanup();
        reject(new Error("Party poster unavailable"));
      };
      const aborted = () => {
        cleanup();
        reject(new DOMException("Interrupted", "AbortError"));
      };
      const timeout = window.setTimeout(failed, 6000);
      this.poster.addEventListener("load", loaded, { once: true });
      this.poster.addEventListener("error", failed, { once: true });
      signal.addEventListener("abort", aborted, { once: true });
      if (this.poster.complete)
        this.poster.naturalWidth > 0 ? loaded() : failed();
    });
  }

  refreshTheme() {
    // Remove only our color frames before sampling the new CSS theme. Keep the
    // ball, tag dance, physics and current Party state running without replay.
    for (const tag of this.tags) {
      this.stopLoop(tag);
      for (const animation of this.animations) {
        const effect = animation.effect;
        if (
          effect instanceof KeyframeEffect &&
          effect.target === tag &&
          effect
            .getKeyframes()
            .some((frame) => "backgroundColor" in frame || "color" in frame)
        ) {
          this.cancel(animation);
        }
      }
      const style = getComputedStyle(tag);
      this.tagNormals.set(tag, {
        backgroundColor: style.backgroundColor,
        color: style.color,
      });
    }
    if (this.enabled && this.phase === "active") this.animateTags();
  }

  request(enabled: boolean) {
    if (this.disposed) return;
    const snapshot = this.snapshot();
    const generation = ++this.generation;
    this.transition.abort();
    this.transition = new AbortController();
    this.enabled = enabled;
    this.cancelAll();
    this.settleUi(snapshot);
    if (enabled) void this.enter(snapshot, generation);
    else void this.exit(snapshot, generation);
  }

  private async enter(snapshot: Snapshot, generation: number) {
    this.setPhase("entering");
    this.animate(
      this.atmosphere,
      [
        { opacity: snapshot.get(this.atmosphere)?.opacity ?? "0" },
        { opacity: 0.03 },
      ],
      { duration: 250 },
    );
    try {
      await this.waitForPoster(this.transition.signal);
      if (!this.current(generation)) return;
      this.layout();
      this.prepareVideo();
      const start = snapshot.get(this.rig) ?? {
        transform: "none",
        opacity: "0",
      };
      if (this.motion.matches) {
        this.videoStarted = false;
        this.video.pause();
        this.hideVideo();
        this.animate(
          this.rig,
          [
            { opacity: start.opacity, transform: "none" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 250 },
        );
      } else {
        const drop = this.animate(
          this.rig,
          [
            {
              transform: start.transform,
              opacity: start.opacity,
              offset: 0,
              easing: "cubic-bezier(0.4, 0, 0.7, 0.6)",
            },
            {
              transform: "translateY(9px) rotate(-3deg)",
              opacity: 1,
              offset: 0.56,
              easing: "cubic-bezier(0.15, 0.7, 0.3, 1)",
            },
            {
              transform: "translateY(-3px) rotate(1.6deg)",
              opacity: 1,
              offset: 0.76,
            },
            {
              transform: "translateY(1px) rotate(-0.6deg)",
              opacity: 1,
              offset: 0.91,
            },
            {
              transform: "translateY(0px) rotate(0deg)",
              opacity: 1,
              offset: 1,
            },
          ],
          { duration: 850 },
        );
        await drop.finished;
        if (!this.current(generation)) return;
        this.videoStarted = true;
        this.video.playbackRate = 1;
        this.playVideo();
        this.animateLights();
      }
      const reflections = this.animate(
        this.reflections,
        [
          { opacity: snapshot.get(this.reflections)?.opacity ?? "0" },
          { opacity: 1 },
        ],
        { duration: 300 },
      );
      const beams = this.animate(
        this.beams,
        [{ opacity: snapshot.get(this.beams)?.opacity ?? "0" }, { opacity: 1 }],
        { duration: 300, delay: this.motion.matches ? 0 : 150 },
      );
      const projections = this.projections.map((projection) =>
        this.animate(
          projection,
          [
            { opacity: snapshot.get(projection)?.opacity ?? "0" },
            { opacity: 1 },
          ],
          { duration: 300, delay: this.motion.matches ? 0 : 150 },
        ),
      );
      await Promise.all([
        reflections.finished,
        beams.finished,
        ...projections.map((animation) => animation.finished),
      ]);
      if (!this.current(generation)) return;
      this.setPhase("active");
      this.animateUi();
    } catch (error) {
      if (
        !this.current(generation) ||
        (error instanceof DOMException && error.name === "AbortError")
      )
        return;
      this.callbacks.onFailure();
    }
  }

  private async exit(snapshot: Snapshot, generation: number) {
    this.setPhase("exiting");
    this.video.playbackRate = 0.6;
    const fade = (element: HTMLElement, duration: number) =>
      this.animate(
        element,
        [{ opacity: snapshot.get(element)?.opacity ?? "0" }, { opacity: 0 }],
        { duration },
      );
    const beams = fade(this.beams, 180);
    const dots = fade(this.reflections, 260);
    const atmosphere = fade(this.atmosphere, 300);
    const projections = this.projections.map((projection) =>
      fade(projection, 180),
    );
    const ball = this.motion.matches
      ? fade(this.rig, 250)
      : this.animate(
          this.rig,
          [
            {
              transform: snapshot.get(this.rig)?.transform ?? "none",
              opacity: snapshot.get(this.rig)?.opacity ?? "0",
            },
            {
              transform: "translateY(calc(-100% - 1rem)) rotate(0deg)",
              opacity: 0,
            },
          ],
          {
            duration: 480,
            delay: 180,
            easing: "cubic-bezier(0.6, 0, 0.84, 0.5)",
          },
        );
    try {
      await Promise.all([
        beams.finished,
        dots.finished,
        ball.finished,
        atmosphere.finished,
        ...projections.map((animation) => animation.finished),
      ]);
      if (!this.current(generation)) return;
      this.cancelAll();
      this.video.pause();
      this.setPhase("idle");
    } catch {
      /* Reversal owns the next sequence. */
    }
  }

  private current(generation: number) {
    return !this.disposed && this.generation === generation;
  }

  /**
   * On desktop the ball hangs centred in the gap between the header actions
   * (theme, language and contact) and the middle navigation, in either
   * direction. Elsewhere (no visible desktop header) the CSS position applies.
   * Both boxes are measured on cells that stay put while the header slides
   * its contents off screen.
   */
  private placeRig() {
    const contact = document
      .querySelector(".header-actions")
      ?.getBoundingClientRect();
    const nav = document
      .querySelector(".desktop-navigation")
      ?.getBoundingClientRect();
    let gap: [number, number] | undefined;
    if (contact?.width && nav?.width) {
      if (contact.right <= nav.left) gap = [contact.right, nav.left];
      else if (nav.right <= contact.left) gap = [nav.right, contact.left];
    }
    if (!gap) {
      this.root.style.removeProperty("--ball-left");
      return;
    }
    const centre = (gap[0] + gap[1]) / 2;
    this.root.style.setProperty(
      "--ball-left",
      `${centre - this.rig.offsetWidth / 2}px`,
    );
  }

  private layout() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.placeRig();
    const x = this.rig.offsetLeft + this.rig.offsetWidth / 2;
    const y =
      this.rig.offsetTop + this.rig.offsetHeight - this.rig.offsetWidth / 2;
    this.origin = { x, y };
    this.scenes = beamScenes(width, height, this.compact.matches);
    this.root.style.setProperty("--party-anchor-x", `${x}px`);
    this.root.style.setProperty("--party-anchor-y", `${y}px`);
    this.dots.forEach((dot, index) => {
      dot.style.transform = `translate(${(index * 173 + 70) % width}px, ${(index * 137 + 140) % height}px)`;
    });
    for (const scene of this.scenes) {
      const ray = this.rays[scene.index];
      ray.style.setProperty("--beam-width", `${scene.halfWidth * 2}px`);
      ray.style.setProperty("--beam-length", `${scene.length}px`);
      ray.style.setProperty("--beam-color", scene.color);
      ray.style.setProperty("--beam-opacity", `${scene.opacity}`);
      ray.style.transform = `rotate(${scene.samples[0].angle}deg)`;
    }
    this.updateProjections(true);
    this.updateReadabilityMask();
  }

  private loop(element: HTMLElement, frames: Keyframe[], duration: number) {
    const old = this.loops.get(element);
    if (old) this.cancel(old);
    const animation = this.animate(element, frames, {
      duration,
      iterations: Infinity,
      easing: "linear",
    });
    animation.currentTime = this.mediaTime();
    this.loops.set(element, animation);
    return animation;
  }

  private animateLights() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const period = Number.isFinite(this.video.duration)
      ? this.video.duration * 1000
      : basePeriod;
    const count = this.compact.matches ? 10 : 24;
    this.dots.slice(0, count).forEach((dot, index) => {
      const group = index % 4;
      const brightness = Number(
        dot.style.getPropertyValue("--reflection-brightness"),
      );
      const frames = Array.from({ length: 73 }, (_, step) => {
        const angle = (step / 72 + index * 0.618034) * Math.PI * 2;
        const x = width * (0.16 + group * 0.23 + Math.cos(angle) * 0.24);
        const y =
          height *
          (0.1 +
            (index % 5) * 0.18 +
            Math.sin(angle * 2) * (0.08 + group * 0.015));
        const tilt = ((index % 3) - 1) * 12 + Math.sin(angle) * 7;
        return {
          transform: `translate(${x}px, ${y}px) rotate(${tilt}deg) scaleX(${0.85 + Math.cos(angle) * 0.15})`,
          opacity:
            (0.35 + (Math.sin(angle + 0.8) + 1) * 0.3) *
            brightness *
            (this.compact.matches ? 0.85 : 1),
          offset: step / 72,
        };
      });
      this.loop(dot, frames, period * (1 + (index % 3)));
    });
    for (const scene of this.scenes) {
      this.loop(
        this.rays[scene.index],
        scene.samples.map((sample) => ({
          transform: `rotate(${sample.angle}deg)`,
          offset: sample.offset,
        })),
        scene.duration,
      );
    }
    this.updateProjections(true);
  }

  private updateProjections(force = false) {
    if (!this.enabled) return;
    // Read all visible boxes first, then write/animate. Never measure on a motion frame.
    const visible = this.projections.filter(
      (projection) =>
        projection.parentElement && this.visible.has(projection.parentElement),
    );
    const boxes = visible.map((projection) => ({
      projection,
      bounds: projection.getBoundingClientRect(),
    }));
    for (const { projection, bounds } of boxes) {
      for (const scene of this.scenes) {
        const light = projection.querySelector<HTMLElement>(
          `[data-party-heading-light="${scene.index}"]`,
        );
        if (!light) continue;
        if (this.motion.matches) {
          this.stopLoop(light);
          light.style.clipPath = projectedCone(
            scene,
            scene.samples[0].angle,
            this.origin,
            bounds,
          );
        } else if (force || !this.loops.has(light)) {
          this.loop(
            light,
            scene.samples.map((sample) => ({
              clipPath: projectedCone(scene, sample.angle, this.origin, bounds),
              offset: sample.offset,
            })),
            scene.duration,
          );
        }
      }
    }
  }

  private updateReadabilityMask() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const boxes = this.protectedContent
      .map((element) => element.getBoundingClientRect())
      .filter(
        (box) =>
          box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < height,
      );
    const rectangles = boxes
      .map(
        (box) =>
          `<rect x="${(box.left - 24).toFixed(1)}" y="${(box.top - 24).toFixed(1)}" width="${(box.width + 48).toFixed(1)}" height="${(box.height + 48).toFixed(1)}" rx="8" fill="#0b0b0b"/>`,
      )
      .join("");
    // Rasterize a softly edged luminance mask only on layout/scroll. The small
    // 8px feather belongs to this cached mask, never to the moving light layer.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter></defs><rect width="100%" height="100%" fill="white"/><g filter="url(#soft)">${rectangles}</g></svg>`;
    this.beams.style.maskImage = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }

  private animateUi() {
    for (const target of this.visible) {
      if (
        !this.targets.includes(target) ||
        this.motion.matches ||
        target.id === "projects-heading"
      )
        continue;
      if (this.loops.has(target)) continue;
      const cta = target.dataset.partyReact === "cta";
      const phase = cta ? 0.68 : target.id === "hero-heading" ? 0.15 : 0.43;
      const frames = Array.from({ length: 17 }, (_, step) => {
        const angle = (step / 16 + phase) * Math.PI * 2;
        return {
          transform: `translateY(${(Math.sin(angle) * (cta ? 2 : 2.5)).toFixed(2)}px) rotate(${(Math.sin(angle + 0.4) * (cta ? 0.7 : 0.35)).toFixed(3)}deg)`,
          offset: step / 16,
        };
      });
      this.loop(
        target,
        frames,
        cta ? 14000 : target.id === "hero-heading" ? 24000 : 18000,
      );
    }
    this.animateTags();
    this.updateProjections();
  }

  private animateTags() {
    if (!this.tagGroup || !this.visible.has(this.tagGroup)) return;
    if (this.danceCompact !== this.compact.matches) {
      for (const tag of this.tags) this.stopDance(tag);
      this.danceCompact = this.compact.matches;
    }
    this.tags.forEach((tag, index) => {
      const normal = this.tagNormals.get(tag);
      if (!normal) return;
      if (!this.loops.has(tag) && this.motion.matches) {
        if (index !== 0 && index !== Math.floor(this.tags.length / 2)) return;
        const color = this.tagPalette[index === 0 ? 0 : 1];
        this.loops.set(
          tag,
          this.animate(tag, [{ ...color }, { ...color }], { duration: 0 }),
        );
      } else if (!this.loops.has(tag)) {
        this.loop(
          tag,
          tagColorFrames(index, this.tags.length, normal, this.tagPalette),
          this.tags.length * 6000,
        );
      }
      if (!this.motion.matches && !this.tagDragging && !this.dances.has(tag)) {
        const dance = this.animate(
          tag,
          tagDanceFrames(index, this.tags.length, this.compact.matches),
          {
            duration: this.tags.length * 6000,
            iterations: Infinity,
            composite: "add",
            easing: "linear",
          },
        );
        dance.id = "party-tag-dance";
        dance.currentTime = this.mediaTime();
        this.dances.set(tag, dance);
      }
    });
  }

  private tagDragStarted = (event: PointerEvent) => {
    if (
      event.pointerType !== "mouse" ||
      event.button !== 0 ||
      this.phase !== "active" ||
      this.motion.matches ||
      !(event.target instanceof Element) ||
      !event.target.closest("[data-party-tag]")
    )
      return;
    this.tagDragging = true;
    for (const tag of this.tags) this.stopDance(tag);
  };

  private tagDragEnded = () => {
    if (!this.tagDragging) return;
    this.tagDragging = false;
    if (this.enabled && this.phase === "active") this.animateTags();
  };

  private hideVideo = () => {
    delete this.video.dataset.playing;
  };

  private playVideo = () => {
    if (
      !this.enabled ||
      !this.videoStarted ||
      this.motion.matches ||
      document.hidden ||
      this.disposed
    )
      return;
    void this.video
      .play()
      .then(() => {
        if (this.enabled && !this.motion.matches && !this.disposed)
          this.video.dataset.playing = "true";
      })
      .catch(this.hideVideo);
  };

  private synchronize = () => {
    for (const animation of this.loops.values())
      animation.currentTime = this.mediaTime();
    for (const animation of this.dances.values())
      if (animation.effect?.getTiming().iterations === Infinity)
        animation.currentTime = this.mediaTime();
  };

  private mediaTime() {
    const duration = Number.isFinite(this.video.duration)
      ? this.video.duration
      : 12;
    return (this.videoLoops * duration + this.video.currentTime) * 1000;
  }

  private videoAdvanced = () => {
    if (this.video.currentTime < this.lastVideoTime) {
      this.videoLoops += 1;
      this.synchronize();
    }
    this.lastVideoTime = this.video.currentTime;
  };

  private visibilityChanged = () => {
    if (document.hidden) {
      for (const animation of this.animations) {
        if (animation.playState !== "running") continue;
        animation.pause();
        this.suspended.add(animation);
      }
      this.video.pause();
    } else {
      for (const animation of this.suspended) animation.play();
      this.suspended.clear();
      this.playVideo();
    }
  };

  private prepareVideo() {
    if (this.motion.matches) {
      this.videoStarted = false;
      this.video.pause();
      this.video.removeAttribute("src");
      this.video.load();
      return;
    }
    const source = partyVideoSource();
    if (this.video.getAttribute("src") === source) return;
    this.lastVideoTime = 0;
    this.videoLoops = 0;
    this.video.preload = "auto";
    this.video.src = source;
  }

  private motionChanged = () => {
    if (this.enabled) this.request(true);
  };

  private resize = () => {
    if (this.resizeFrame) return;
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = 0;
      if (this.disposed) return;
      this.layout();
      this.prepareVideo();
      if (
        (this.phase === "active" || this.videoStarted) &&
        !this.motion.matches
      ) {
        for (const element of [...this.dots, ...this.rays]) {
          const animation = this.loops.get(element);
          if (animation) this.cancel(animation);
          this.loops.delete(element);
        }
        this.animateLights();
      }
      if (this.phase === "active") this.animateTags();
    });
  };

  private scroll = () => {
    if (this.projectionFrame || !this.enabled) return;
    this.projectionFrame = requestAnimationFrame(() => {
      this.projectionFrame = 0;
      if (!this.disposed) {
        this.updateProjections(true);
        this.updateReadabilityMask();
      }
    });
  };

  destroy() {
    this.disposed = true;
    this.generation += 1;
    this.transition.abort();
    this.listeners.abort();
    this.targetObserver.disconnect();
    this.geometryObserver.disconnect();
    cancelAnimationFrame(this.resizeFrame);
    cancelAnimationFrame(this.projectionFrame);
    this.cancelAll();
    this.video.pause();
    this.video.removeAttribute("src");
    this.video.load();
  }
}
