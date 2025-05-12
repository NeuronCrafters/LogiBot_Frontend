export type ChartMode = "single" | "compare";

export interface ChartFilterState {
  type: "student" | "class" | "course" | "university";
  ids: string[];
  mode: ChartMode;
}
