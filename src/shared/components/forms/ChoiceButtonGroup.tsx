import { Button } from "@/components/ui/button";

interface ChoiceButtonGroupProps {
    options: { label: string; value: string; variant?: "blue" | "green"; id?: string }[];
    onSelect: (value: string) => void;
    layout?: "row" | "grid";
    colorScheme?: "blue" | "indigo";
}

export function ChoiceButtonGroup({ options, onSelect, layout = "grid", colorScheme = "blue" }: ChoiceButtonGroupProps) {
  const baseStyle = "min-h-12 rounded-xl border border-white/10 bg-neutral-950/60 px-4 py-3 text-center font-[Poppins] text-sm font-semibold text-zinc-200 shadow-sm transition-colors hover:bg-white/10 hover:text-white";
  const containerClass = layout === "row" ? "flex flex-col sm:flex-row justify-center gap-4" : "grid grid-cols-1 sm:grid-cols-2 gap-4 justify-center";
  const defaultColor = colorScheme === "indigo" ? "hover:border-indigo-400/50" : "hover:border-blue-400/50";

  return (
    <div className={containerClass}>
      {options.map((opt, i) => (
        <Button key={i} id={opt.id} onClick={() => onSelect(opt.value)} className={`${baseStyle} ${opt.variant === "green" ? "hover:border-emerald-400/50" : defaultColor}`}>
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
