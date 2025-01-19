import { Button } from "@/components/ui/button";
import { Typograph } from "@/components/components/Typograph/Typograph";

interface ButtonInfoProps {
  type: "agree" | "disagree";
  onClick: () => void;
  label?: string;
  className?: string;
}

export function ButtonInfo({ type, onClick, className }: ButtonInfoProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const label = type === "agree" ? "Concordo" : "Não concordo";

  return (
    <Button
      onClick={handleClick}
      className={`rounded-lg px-6 py-3 w-[150px] h-[48px] ${type === "agree"
        ? "bg-green-800 hover:bg-green-900 text-white"
        : "bg-red-800 hover:bg-red-900 text-white"
        } ${className}`}
    >
      <Typograph
        text={label}
        colorText="text-inherit"
        variant="text8"
        weight="medium"
        fontFamily="poppins"
      />
    </Button>
  );
}
