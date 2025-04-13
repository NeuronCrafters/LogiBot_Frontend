import { Button } from "@/components/ui/button";

interface MetricSelectorProps {
  metric: "correct" | "wrong" | "usage";
  setMetric: (value: "correct" | "wrong" | "usage") => void;
}

function MetricSelector({ metric, setMetric }: MetricSelectorProps) {
  return (
    <div className="flex gap-3 justify-center mb-6">
      <Button
        variant={metric === "correct" ? "default" : "outline"}
        onClick={() => setMetric("correct")}
      >
        Corretas
      </Button>
      <Button
        variant={metric === "wrong" ? "default" : "outline"}
        onClick={() => setMetric("wrong")}
      >
        Incorretas
      </Button>
      <Button
        variant={metric === "usage" ? "default" : "outline"}
        onClick={() => setMetric("usage")}
      >
        Tempo de Uso
      </Button>
    </div>
  );
}

export { MetricSelector }