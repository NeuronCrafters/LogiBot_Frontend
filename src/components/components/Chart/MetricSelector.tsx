import { Button } from "@/components/ui/button";

// Definindo um enum para melhor controle e legibilidade
export enum Metric {
  CORRECT = "correct",
  WRONG = "wrong",
  USAGE = "usage",
}

interface MetricSelectorProps {
  metric: Metric;
  setMetric: (value: Metric) => void;
}

// Mapeando os rótulos com os valores
const metrics = [
  { label: "Corretas", value: Metric.CORRECT },
  { label: "Incorretas", value: Metric.WRONG },
  { label: "Tempo de Uso", value: Metric.USAGE },
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
