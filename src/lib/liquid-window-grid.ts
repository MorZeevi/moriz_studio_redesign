export const LIQUID_WINDOW_DURATION = 460;
export const LIQUID_WINDOW_EASING = "cubic-bezier(0.22, 0.7, 0.2, 1)";

export type LiquidWindowGrid = {
  w: number;
  h: number;
  cw: number;
  ch: number;
  ox: number;
  oy: number;
  cells: { x: number; y: number; delay: number }[];
};

/** The owner's opening geometry, shared without its session/playback rules. */
export function buildLiquidWindowGrid(
  w: number,
  h: number,
  delaySpread = 620,
): LiquidWindowGrid {
  const narrow = w < 640;
  const ch = Math.ceil(h / (narrow ? 9 : 7));
  const cw = Math.ceil(ch * (narrow ? 1.4 : 1.8));
  const cols = Math.ceil((w + cw) / cw);
  const rows = Math.ceil((h + ch) / ch);
  const cells: LiquidWindowGrid["cells"] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      cells.push({ x, y, delay: Math.round(Math.random() * delaySpread) });
    }
  }
  return { w, h, cw, ch, ox: -cw / 2, oy: -ch / 2, cells };
}
