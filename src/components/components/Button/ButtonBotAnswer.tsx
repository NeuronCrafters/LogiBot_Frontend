import { Button } from "@/components/ui/button";

interface BotAnswerButtonProps {
  text: React.ReactNode;
  selected?: boolean;
  onClick: () => void;
  isSubmit?: boolean;
  disabled?: boolean;
}

export function ButtonBotAnswer({
  text,
  selected = false,
  onClick,
  isSubmit = false,
  disabled = false,
}: BotAnswerButtonProps) {
  const baseClass =
    "rounded-2xl px-5 py-2.5 text-white transition-all shadow";

  const selectedClass = selected
    ? "bg-[#2563eb] hover:bg-blue-800"
    : "bg-transparent border border-white/20 hover:bg-white/10";

  const submitClass =
    "bg-[#2563eb] hover:bg-blue-800 focus:ring-2 focus:ring-blue-400 font-semibold";

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={`
    ${baseClass}
    ${isSubmit ? submitClass : selectedClass}
    ${isSubmit
          ? "px-6 py-2.5 text-center"
          : "justify-start text-left text-base leading-snug w-full max-w-[520px] min-w-[300px] px-4 py-3 whitespace-normal h-min"}
  `}
    >
      {text}
    </Button>

  );
}
