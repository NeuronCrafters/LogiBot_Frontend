import { chartText } from "../chartColors";

/** Short axis references keep names readable in the accompanying list on narrow cards. */
export function RadarAxisTick({ x, y, textAnchor, payload, index, fontSize }: any) {
  return <text x={x} y={y} textAnchor={textAnchor} dominantBaseline="central" fill={chartText(0.6)} fontSize={fontSize}>
    <tspan className="radar-axis-name">{payload?.value}</tspan>
    <tspan className="radar-axis-index">{index + 1}</tspan>
  </text>;
}

export function RadarLabels({ labels }: { labels: string[] }) {
  return <ol className="radar-labels mt-3 list-decimal space-y-1 pl-8 pr-2 font-[Poppins] text-sm text-zinc-300 [overflow-wrap:anywhere]">
    {labels.map((label, index) => <li key={`${index}-${label}`}>{label}</li>)}
  </ol>;
}
