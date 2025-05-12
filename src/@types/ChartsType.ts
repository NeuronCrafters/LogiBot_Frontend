// export type ChartMode = "visualizar" | "comparar";
// export type Metric = "correct" | "wrong" | "usage";
// export type ChartType = "university" | "course" | "class" | "discipline" | "student";

export type ChartMode = "single" | "compare";

export interface ChartFilterState {
  type: "student" | "class" | "course" | "university";
  ids: string[];
  mode: ChartMode;
}
