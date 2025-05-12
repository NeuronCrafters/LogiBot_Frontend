import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LayoutList, BarChart3 } from "lucide-react";
import { ChartMode } from "@/@types/ChartsType";

interface ChartModeSelectorProps {
  mode: ChartMode;
  setMode: (mode: ChartMode) => void;
}

export function ChartModeSelector({ mode, setMode }: ChartModeSelectorProps) {
  const buttonClasses = "text-white border border-neutral-600 bg-[#2a2a2a] hover:bg-[#333]";

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={mode === "visualizar" ? "default" : "ghost"}
              size="icon"
              onClick={() => setMode("visualizar")}
              className={buttonClasses}
            >
              <LayoutList className="h-4 w-4 text-white" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-[#222] text-white border border-neutral-700">
            <p>Visualizar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={mode === "comparar" ? "default" : "ghost"}
              size="icon"
              onClick={() => setMode("comparar")}
              className={buttonClasses}
            >
              <BarChart3 className="h-4 w-4 text-white" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-[#222] text-white border border-neutral-700">
            <p>Comparar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
