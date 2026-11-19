import { createContext, useContext } from "react";

/** Suffix of the side being shown (comparison "a"/"b"), so two copies of a chart keep unique ids. */
export const ChartIdContext = createContext("");

export function useChartId(base: string): string {
  const suffix = useContext(ChartIdContext);
  return suffix ? `${base}-${suffix}` : base;
}
