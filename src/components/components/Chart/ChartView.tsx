import { useState, useMemo } from "react";
import { AcademicFilter } from "./AcademicFilter";
import { ChartGraphics } from "./ChartGraphic";
import { ChartComparison } from "./ChartComparison";
import { ChartModeSelector } from "./ChartModeSelector";
import { MetricCheckboxSelector, MetricOption } from "./MetricCheckboxSelector";
import { ChartMode, ChartType } from "@/@types/ChartsType";

export function ChartView() {
  const [mode, setMode] = useState<ChartMode>("visualizar");
  const [selectedType, setSelectedType] = useState<ChartType>("course");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<MetricOption[]>(["correct", "wrong", "usage", "sessions"]);

  const handleFilterChange = (filter: {
    universityId: string | null;
    courseId: string | null;
    classId: string | null;
    disciplineId: string | null;
    startDate?: string;
    endDate?: string;
  }) => {
    const ids: string[] = [];
    let type: ChartType = "course";
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
  };

  const shouldShowGraphics = useMemo(
    () => mode === "visualizar" && selectedIds.length === 1,
    [mode, selectedIds]
  );

  const shouldShowComparison = useMemo(
    () => mode === "comparar" && selectedIds.length === 2,
    [mode, selectedIds]
  );

  const selectedLabel = useMemo(() => {
    if (selectedIds.length === 0) return "Nenhum item selecionado";
    if (selectedIds.length === 1)
      return `Selecionado: ${selectedType} - ${selectedIds[0]}`;
    return `Comparando ${selectedType}s: ${selectedIds[0]} vs ${selectedIds[1]}`;
  }, [selectedIds, selectedType]);

  return (
    <div className="space-y-6 px-4 md:px-12">
      <ChartModeSelector mode={mode} setMode={setMode} />
      <MetricCheckboxSelector selectedMetrics={selectedMetrics} setSelectedMetrics={setSelectedMetrics} />
      <AcademicFilter onFilterChange={handleFilterChange} />
      <p className="text-center text-sm text-gray-400">{selectedLabel}</p>
      {shouldShowGraphics && (
        <ChartGraphics type={selectedType} id={selectedIds[0]} metrics={selectedMetrics} />
      )}
      {shouldShowComparison && (
        <ChartComparison type={selectedType} ids={selectedIds} metric={"usage"} />
      )}
      {mode === "comparar" && selectedIds.length !== 2 && (
        <p className="text-center text-sm text-yellow-400">
          Selecione dois grupos para realizar a comparação.
        </p>
      )}
    </div>
  );
}
