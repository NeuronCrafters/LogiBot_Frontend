import { useState, useMemo } from "react";
import { AcademicFilter } from "./AcademicFilter";
import { ChartGraphics } from "./ChartGraphic";
import { ChartComparison } from "./ChartComparison";
import { ChartModeSelector } from "./ChartModeSelector";
import { MetricSelector } from "./MetricSelector";

export enum Mode {
  VISUALIZAR = "visualizar",
  COMPARAR = "comparar",
}

export enum MetricOption {
  CORRECT = "correct",
  WRONG = "wrong",
  USAGE = "usage",
}

export enum TypeOption {
  COURSE = "course",
  CLASS = "class",
  DISCIPLINE = "discipline",
}

export function ChartView() {
  const [mode, setMode] = useState<Mode>(Mode.VISUALIZAR);
  const [selectedType, setSelectedType] = useState<TypeOption>(TypeOption.COURSE);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [metric, setMetric] = useState<MetricOption>(MetricOption.CORRECT);

  const handleFilterChange = (filter: {
    universityId: string | null;
    courseId: string | null;
    classId: string | null;
    disciplineId: string | null;
  }) => {
    const ids: string[] = [];
    let type: TypeOption = TypeOption.COURSE;

    if (filter.disciplineId) {
      ids.push(filter.disciplineId);
      type = TypeOption.DISCIPLINE;
    } else if (filter.classId) {
      ids.push(filter.classId);
      type = TypeOption.CLASS;
    } else if (filter.courseId) {
      ids.push(filter.courseId);
      type = TypeOption.COURSE;
    }

    setSelectedType(type);
    setSelectedIds(ids);
  };

  const shouldShowGraphics = useMemo(
    () => mode === Mode.VISUALIZAR && selectedIds.length === 1,
    [mode, selectedIds]
  );

  const shouldShowComparison = useMemo(
    () => mode === Mode.COMPARAR && selectedIds.length === 2,
    [mode, selectedIds]
  );

  const selectedLabel = useMemo(() => {
    if (selectedIds.length === 0) return "Nenhum item selecionado";
    if (selectedIds.length === 1) return `Selecionado: ${selectedType} - ${selectedIds[0]}`;
    return `Comparando ${selectedType}s: ${selectedIds[0]} vs ${selectedIds[1]}`;
  }, [selectedIds, selectedType]);

  return (
    <div className="space-y-6 px-4 md:px-12">
      {/* Seletor de modo */}
      <ChartModeSelector mode={mode} setMode={setMode} />

      {/* Seletor de métrica visível em ambos os modos */}
      <MetricSelector metric={metric} setMetric={setMetric} />

      {/* Filtros de seleção */}
      <AcademicFilter onFilterChange={handleFilterChange} />

      {/* Exibição da escolha atual */}
      <p className="text-center text-sm text-gray-400">{selectedLabel}</p>

      {/* Gráfico individual */}
      {shouldShowGraphics && (
        <ChartGraphics type={selectedType} id={selectedIds[0]} />
      )}

      {/* Gráfico comparativo */}
      {shouldShowComparison && (
        <ChartComparison
          type={selectedType}
          ids={selectedIds}
          metric={metric}
        />
      )}

      {/* Feedback se seleção for insuficiente */}
      {mode === Mode.COMPARAR && selectedIds.length !== 2 && (
        <p className="text-center text-sm text-yellow-400">
          Selecione dois grupos para realizar a comparação.
        </p>
      )}
    </div>
  );
}