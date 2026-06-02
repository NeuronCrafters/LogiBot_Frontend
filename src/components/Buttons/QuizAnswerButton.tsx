import { Button } from "@/components/ui/button";

interface QuizAnswerButtonProps {
  text: React.ReactNode;
  selected?: boolean;
  onClick: () => void;
  isSubmit?: boolean;
  disabled?: boolean;
}

export function QuizAnswerButton({
  text,
  selected = false,
  onClick,
  isSubmit = false,
  disabled = false,
}: QuizAnswerButtonProps) {
  const baseClass =
    "rounded-xl px-5 py-2.5 text-white transition-colors shadow-sm font-[Poppins]";

  const selectedClass = selected
    ? "bg-indigo-600 hover:bg-indigo-700 border border-indigo-400/40 shadow-md shadow-indigo-900/30"
    : "bg-neutral-950/60 border border-white/10 hover:bg-white/5 hover:border-white/20";

  const submitClass =
    "bg-indigo-600 hover:bg-indigo-700 border border-indigo-400/40 shadow-md shadow-indigo-900/30 font-semibold";

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={`
    ${baseClass}
    ${isSubmit ? submitClass : selectedClass}
    ${isSubmit
          ? "h-11 px-6 text-center text-sm"
          : "min-h-12 justify-start text-left text-sm leading-snug w-full px-4 py-3 whitespace-normal h-auto"}
  `}
    >
      {text}
    </Button>

  );
}
