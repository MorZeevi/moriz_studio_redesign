export const partyCyan = "#00c9d8";

export const reflectionSpecs = Array.from({ length: 24 }, (_, index) => ({
  id: `reflection-${index}`,
  color: [
    "var(--color-primary)",
    "var(--color-secondary)",
    "var(--color-primary)",
    "var(--party-cyan)",
    "var(--color-secondary)",
  ][index % 5],
  size: `${[3, 5, 7, 4, 9, 6, 12, 4][index % 8]}px`,
  soft: index % 5 === 0,
  brightness: 0.65 + (index % 4) * 0.1,
}));

export interface Point {
  x: number;
  y: number;
}
export interface TagColors {
  backgroundColor: string;
  color: string;
}

export function tagColorFrames(
  index: number,
  count: number,
  normal: TagColors,
  palette: TagColors[],
): Keyframe[] {
  const frames: Keyframe[] = [];
  for (let slot = 0; slot < count; slot++) {
    const first = slot;
    const second = (slot + Math.floor(count / 2)) % count;
    // Change each complete foreground/background pair together: no low-contrast
    // intermediate gray lettering while a light pill becomes a red/dark one.
    frames.push({ ...normal, offset: slot / count, easing: "steps(1, end)" });
    if (index === first || index === second) {
      const colors =
        palette[(slot + (index === second ? 1 : 0)) % palette.length];
      frames.push({
        ...colors,
        offset: (slot + 0.12) / count,
        easing: "steps(1, end)",
      });
      frames.push({
        ...colors,
        offset: (slot + 0.88) / count,
        easing: "steps(1, end)",
      });
    }
    frames.push({ ...normal, offset: (slot + 1) / count });
  }
  return frames;
}

/** Two partners groove only inside their colored six-second slot. */
export function tagDanceFrames(
  index: number,
  count: number,
  compact: boolean,
): Keyframe[] {
  const duration = count * 6000;
  const rhythm = compact ? 1800 : 1200;
  const cycles = compact ? 2 : 3;
  const height = compact ? 4 : 6;
  const tilt = compact ? 2 : 4;
  const rest = "translateY(0px) rotate(0deg)";
  const frames: Keyframe[] = [{ transform: rest, offset: 0 }];
  for (let slot = 0; slot < count; slot++) {
    const second = (slot + Math.floor(count / 2)) % count;
    if (index !== slot && index !== second) continue;
    const start = slot * 6000 + 1080 + (index === second ? rhythm / 4 : 0);
    frames.push({ transform: rest, offset: start / duration });
    for (let beat = 0; beat < cycles * 2; beat++) {
      const takeoff = start + (beat * rhythm) / 2;
      const turn = (beat % 2 ? 1 : -1) * tilt;
      // A quick lift and a weighted return, rather than a sinusoidal float.
      frames[frames.length - 1].easing = "cubic-bezier(0.16, 1, 0.3, 1)";
      frames.push({
        transform: `translateY(-${height}px) rotate(${turn}deg)`,
        offset: (takeoff + rhythm / 5) / duration,
        easing: "cubic-bezier(0.4, 0, 0.7, 0.6)",
      });
      frames.push({
        transform: rest,
        offset: (takeoff + rhythm / 2) / duration,
      });
    }
  }
  frames.push({ transform: rest, offset: 1 });
  return frames;
}

export interface BeamScene {
  index: number;
  duration: number;
  length: number;
  halfWidth: number;
  color: string;
  opacity: number;
  samples: { offset: number; angle: number }[];
}

/** One scene drives both the viewport cone and its projection onto typography. */
export function beamScenes(
  width: number,
  height: number,
  compact: boolean,
): BeamScene[] {
  const length = Math.hypot(width, height) * 1.12;
  return [
    {
      center: -44,
      sweep: 34,
      phase: 0.12,
      duration: 24000,
      width: 0.24,
      color: "var(--color-primary)",
      opacity: compact ? 0.18 : 0.26,
    },
    {
      center: 34,
      sweep: 35,
      phase: 0.4,
      duration: 30000,
      width: 0.28,
      color: "var(--color-secondary)",
      opacity: compact ? 0.16 : 0.24,
    },
    {
      center: -2,
      sweep: 62,
      phase: 0.73,
      duration: 36000,
      width: 0.18,
      color: "var(--party-cyan)",
      opacity: 0.2,
    },
  ]
    .slice(0, compact ? 2 : 3)
    .map((beam, index) => ({
      index,
      duration: beam.duration,
      length,
      halfWidth: width * (compact ? 0.22 : beam.width / 2),
      color: beam.color,
      opacity: beam.opacity,
      samples: Array.from({ length: 73 }, (_, step) => ({
        offset: step / 72,
        angle:
          beam.center +
          beam.sweep * Math.sin((step / 72 + beam.phase) * Math.PI * 2),
      })),
    }));
}

export function projectedCone(
  scene: BeamScene,
  angle: number,
  origin: Point,
  bounds: DOMRect,
): string {
  const radians = (angle * Math.PI) / 180;
  const rotate = (x: number, y: number) => ({
    x: origin.x + x * Math.cos(radians) - y * Math.sin(radians) - bounds.left,
    y: origin.y + x * Math.sin(radians) + y * Math.cos(radians) - bounds.top,
  });
  const points = [
    rotate(0, 0),
    rotate(-scene.halfWidth, scene.length),
    rotate(scene.halfWidth, scene.length),
  ];
  return `polygon(${points.map((point) => `${point.x.toFixed(2)}px ${point.y.toFixed(2)}px`).join(",")})`;
}
