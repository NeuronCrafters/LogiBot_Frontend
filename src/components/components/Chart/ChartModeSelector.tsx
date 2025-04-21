import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LayoutList, BarChart3 } from "lucide-react";
import { ChartMode } from "@/@types/ChartsType";

interface ChartModeSelectorProps {
  mode: ChartMode;
  setMode: (mode: ChartMode) => void;
}

export function ChartModeSelector({ mode, setMode }: ChartModeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={mode === "visualizar" ? "default" : "outline"}
              size="icon"
              onClick={() => setMode("visualizar")}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Visualizar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={mode === "comparar" ? "default" : "outline"}
              size="icon"
              onClick={() => setMode("comparar")}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Comparar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
