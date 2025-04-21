import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 mb-6">
      {options.map(({ label, value }) => (
        <Button
          key={value}
          variant="ghost"
          className={cn(
            "w-full h-9 px-2 sm:px-3 py-1.5 rounded transition-all duration-200",
            "hover:bg-gray-800/50 active:scale-[0.98]",
            "border-0",
            selectedMetrics.includes(value)
              ? "bg-gray-800/30 text-gray-100"
              : "bg-transparent text-gray-400 hover:text-gray-200"
          )}
          onClick={() => toggleMetric(value)}
        >
          <span className="flex items-center justify-center gap-1.5 text-sm">
            {selectedMetrics.includes(value) && (
              <Check className="h-3.5 w-3.5" />
            )}
            <span className="truncate">{label}</span>
          </span>
        </Button>
      ))}
    </div>
  );
}
