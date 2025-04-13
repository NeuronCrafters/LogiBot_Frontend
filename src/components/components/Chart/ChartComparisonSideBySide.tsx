import { ChartGraphics } from "./ChartGraphic";
import { MetricOption } from "./MetricCheckboxSelector";

interface ChartComparisonSideBySideProps {
  type: "course" | "class" | "discipline" | "student";
  ids: string[]; // Precisamos de exatamente dois IDs
  metrics?: MetricOption[];
}

export function ChartComparisonSideBySide({ type, ids, metrics = ["correct", "wrong", "usage", "sessions"] }: ChartComparisonSideBySideProps) {
  if (ids.length !== 2) {
    return (
      <p className="text-center text-sm text-yellow-400">
        Selecione dois grupos para realizar a comparação.
      </p>
    );
  }

  return (
    <div className="flex gap-4">
      {/* Lado esquerdo para o grupo A */}
      <div className="w-1/2">
        <ChartGraphics type={type} id={ids[0]} metrics={metrics} />
      </div>
      {/* Lado direito para o grupo B */}
      <div className="w-1/2">
        <ChartGraphics type={type} id={ids[1]} metrics={metrics} />
      </div>
    </div>
  );
}
