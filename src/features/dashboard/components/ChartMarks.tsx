import { Symbols } from "recharts";

export type MarkerShape = "circle" | "diamond" | "triangle" | "square" | "star" | "cross" | "wye";

/** Diagonal stripes over the category color, so the category is recognisable without relying on hue. */
export function HatchPattern({ id, color }: { id: string; color: string }) {
  return (
    <pattern id={id} patternUnits="userSpaceOnUse" width={6} height={6} patternTransform="rotate(45)">
      <rect className="chart-hatch-background" width={6} height={6} fill={color} />
      <rect className="chart-hatch-line" width={2} height={6} fill="rgb(var(--c-surface))" />
    </pattern>
  );
}

/** Legend swatch that reproduces the fill used by the chart, including patterns. */
export function FillSwatch({ fill, size = 12 }: { fill: string; size?: number }) {
  return (
    <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 12 12" className="chart-fill-swatch shrink-0">
      <rect x={0.5} y={0.5} width={11} height={11} rx={2} fill={fill} stroke="rgb(var(--c-control-border))" strokeWidth={1} />
    </svg>
  );
}

/** Legend marker that reproduces the shape used by the chart. */
export function ShapeSwatch({ shape, color, size = 14, outlined = false }: { shape: MarkerShape; color: string; size?: number; outlined?: boolean }) {
  return (
    <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 14 14" className="shrink-0">
      <Symbols
        cx={7}
        cy={7}
        type={shape}
        size={outlined ? 70 : 60}
        fill={color}
        stroke={outlined ? "rgb(var(--c-white))" : undefined}
        strokeWidth={outlined ? 1.5 : 0}
      />
    </svg>
  );
}
