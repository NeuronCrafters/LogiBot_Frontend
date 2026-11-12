export const chartLine = (alpha: number) =>
  `rgb(var(--chart-ink) / max(var(--chart-line-min, 0), calc(${alpha} * var(--chart-line-boost, 1) * var(--alpha-boost, 1))))`;

export const chartText = (alpha: number) =>
  `rgb(var(--chart-ink) / calc(${alpha} * var(--chart-text-boost, 1)))`;
