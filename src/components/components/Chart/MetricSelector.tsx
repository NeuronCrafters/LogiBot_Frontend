import { Button } from "@/components/ui/button";
import { Metric } from "@/@types/ChartsType";

interface MetricSelectorProps {
  metric: Metric;
  setMetric: (value: Metric) => void;
}

const metrics: { label: string; value: Metric }[] = [
  { label: "Corretas", value: "correct" },
  { label: "Incorretas", value: "wrong" },
  { label: "Tempo de Uso", value: "usage" },
];

function MetricSelector({ metric, setMetric }: MetricSelectorProps) {
  return (
    <div className="flex gap-3 justify-center mb-6">
      {metrics.map(({ label, value }) => (
        <Button
          key={value}
          variant={metric === value ? "default" : "outline"}
          onClick={() => setMetric(value)}
          className="capitalize"
        >
          {label}
        </Button>
      ))}
    </div>
  );
}

export { MetricSelector };
