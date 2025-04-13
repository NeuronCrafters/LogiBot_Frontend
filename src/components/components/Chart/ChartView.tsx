import { useState } from "react";
import { AcademicFilter } from "./AcademicFilter";
import { ChartGraphics } from "./ChartGraphic";
import { ChartComparison } from "./ChartComparison";
import { ChartModeSelector } from "./ChartModeSelector";
import { MetricSelector } from "./MetricSelector";

type Mode = "visualizar" | "comparar";
type TypeOption = "course" | "class" | "discipline";
type MetricOption = "correct" | "wrong" | "usage";

export function ChartView() {
  const [mode, setMode] = useState<Mode>("visualizar");
  const [selectedType, setSelectedType] = useState<TypeOption>("course");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [metric, setMetric] = useState<MetricOption>("correct");

  return (
    <div className="space-y-6">
      <ChartModeSelector mode={mode} setMode={setMode} />

      {mode === "comparar" && <MetricSelector metric={metric} setMetric={setMetric} />}

      <AcademicFilter
        onFilterChange={(filter) => {
          const ids: string[] = [];
          let type: TypeOption = "course";

          if (filter.disciplineId) {
            ids.push(filter.disciplineId);
            type = "discipline";
          } else if (filter.classId) {
            ids.push(filter.classId);
            type = "class";
          } else if (filter.courseId) {
            ids.push(filter.courseId);
            type = "course";
          }

          setSelectedType(type);
          setSelectedIds(ids);
        }}
      />

      {mode === "visualizar" && selectedIds.length === 1 && (
        <ChartGraphics type={selectedType} id={selectedIds[0]} />
      )}

      {mode === "comparar" && selectedIds.length === 2 && (
        <ChartComparison type={selectedType} ids={selectedIds} metric={metric} />
      )}
    </div>
  );
}
