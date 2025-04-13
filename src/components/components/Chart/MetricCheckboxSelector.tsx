import { useState } from "react";

export type MetricOption = "correct" | "wrong" | "usage" | "sessions";

const options: { label: string; value: MetricOption }[] = [
  { label: "Questões Certas", value: "correct" },
  { label: "Questões Erradas", value: "wrong" },
  { label: "Tempo de Uso", value: "usage" },
  { label: "Sessões", value: "sessions" },
];

interface MetricCheckboxSelectorProps {
  selectedMetrics: MetricOption[];
  setSelectedMetrics: (metrics: MetricOption[]) => void;
}

export function MetricCheckboxSelector({
  selectedMetrics,
  setSelectedMetrics,
}: MetricCheckboxSelectorProps) {
  const toggleMetric = (metric: MetricOption) => {
    if (selectedMetrics.includes(metric)) {
      setSelectedMetrics(selectedMetrics.filter((m) => m !== metric));
    } else {
      setSelectedMetrics([...selectedMetrics, metric]);
    }
  };

  return (
    <div className="flex gap-4 justify-center mb-6">
      {options.map(({ label, value }) => (
        <label key={value} className="flex items-center gap-2 text-white">
          <input
            type="checkbox"
            checked={selectedMetrics.includes(value)}
            onChange={() => toggleMetric(value)}
          />
          <span className="capitalize">{label}</span>
        </label>
      ))}
    </div>
  );
}
