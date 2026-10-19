import type { CSSProperties, Ref } from "react";
import {
  LIQUID_WINDOW_DURATION,
  type LiquidWindowGrid,
} from "@/lib/liquid-window-grid";

export function LiquidWindowMask({
  id,
  grid,
  reveal = false,
  playing = false,
  windowsRef,
}: {
  id: string;
  grid: LiquidWindowGrid;
  reveal?: boolean;
  playing?: boolean;
  windowsRef?: Ref<SVGGElement>;
}) {
  return (
    <defs>
      <filter
        id={id}
        filterUnits="userSpaceOnUse"
        x={-grid.cw}
        y={-grid.ch}
        width={grid.w + grid.cw * 2}
        height={grid.h + grid.ch * 2}
        colorInterpolationFilters="sRGB"
      >
        <feGaussianBlur stdDeviation={grid.ch * 0.1} />
        <feColorMatrix
          type="matrix"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"
        />
      </filter>
      <mask
        id={`${id}-mask`}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width={grid.w}
        height={grid.h}
      >
        <rect width={grid.w} height={grid.h} fill={reveal ? "#000" : "#fff"} />
        <g
          ref={windowsRef}
          filter={`url(#${id})`}
          className={`pixel-reveal__windows${playing ? " is-playing" : ""}`}
          style={
            { "--pr-duration": `${LIQUID_WINDOW_DURATION}ms` } as CSSProperties
          }
        >
          {grid.cells.map((cell) => (
            <rect
              key={`${cell.x}-${cell.y}`}
              className="pixel-reveal__window"
              x={grid.ox + cell.x * grid.cw}
              y={grid.oy + cell.y * grid.ch}
              width={grid.cw}
              height={grid.ch}
              rx={grid.ch * 0.25}
              fill={reveal ? "#fff" : "#000"}
              style={{ animationDelay: `${cell.delay}ms` }}
            />
          ))}
        </g>
      </mask>
    </defs>
  );
}
