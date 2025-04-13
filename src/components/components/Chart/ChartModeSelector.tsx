import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LayoutList, BarChart3 } from "lucide-react"; // Ícones explicativos
import { cn } from "@/lib/utils"; // Se estiver usando Tailwind helper para classnames

// Enum extensível para múltiplos modos
export enum ChartMode {
  VISUALIZAR = "visualizar",
  COMPARAR = "comparar",
  // Adicione outros modos aqui se necessário futuramente
}

interface ChartModeSelectorProps {
  mode: ChartMode;
  setMode: (mode: ChartMode) => void;
}

export function ChartModeSelector({ mode, setMode }: ChartModeSelectorProps) {
  const modes = [
    {
      key: ChartMode.VISUALIZAR,
      label: "Visualizar",
      icon: <LayoutList className="mr-2 h-4 w-4" />,
      tooltip: "Visualize os dados de um grupo ou aluno individualmente.",
    },
    {
      key: ChartMode.COMPARAR,
      label: "Comparar",
      icon: <BarChart3 className="mr-2 h-4 w-4" />,
      tooltip: "Compare o desempenho entre dois grupos.",
    },
  ];

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-4 justify-center mb-6">
        {modes.map(({ key, label, icon, tooltip }) => (
          <Tooltip key={key}>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setMode(key)}
                variant={mode === key ? "default" : "outline"}
                aria-pressed={mode === key}
                className={cn("transition-all duration-200 flex items-center")}
              >
                {icon}
                {label}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-muted text-white">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
