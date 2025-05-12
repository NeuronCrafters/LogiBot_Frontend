import { Button } from "@/components/ui/button";

interface ChoiceButtonsProps {
  options: { label: string; value: string; variant?: "blue" | "green" }[];
  onSelect: (value: string) => void;
  layout?: "row" | "grid";
}

export function ButtonChoiceBot({
  options,
  onSelect,
  layout = "grid",
}: ChoiceButtonsProps) {
  const baseStyle =
    "rounded-2xl px-5 py-2.5 shadow transition-all text-white min-w-[140px] text-center";

  const containerClass =
    layout === "row"
      ? "flex flex-col sm:flex-row justify-center gap-4"
      : "grid grid-cols-1 sm:grid-cols-2 gap-4 justify-center";

  return (
    <div className={containerClass}>
      {options.map((opt, i) => (
        <Button
          key={i}
          onClick={() => onSelect(opt.value)}
          className={`${baseStyle} ${opt.variant === "green"
            ? "bg-green-600 hover:bg-green-700"
            : "bg-blue-700 hover:bg-blue-800"
            }`}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
