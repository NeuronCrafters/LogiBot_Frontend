import { Button } from "@/components/ui/button";

type Mode = "visualizar" | "comparar";

interface ChartModeSelectorProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
}

export function ChartModeSelector({ mode, setMode }: ChartModeSelectorProps) {
  return (
    <div className="flex gap-4 justify-center mb-6">
      <Button
        variant={mode === "visualizar" ? "default" : "outline"}
        onClick={() => setMode("visualizar")}
      >
        Visualizar
      </Button>
      <Button
        variant={mode === "comparar" ? "default" : "outline"}
        onClick={() => setMode("comparar")}
      >
        Comparar
      </Button>
    </div>
  );
}
