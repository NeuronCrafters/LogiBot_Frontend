import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface RainbowBorderButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  delayMs?: number;
  className?: string;
  variant?: "default" | "outline" | "destructive";
  disabled?: boolean;
  id?: string;
}

const variantClasses: Record<string, string> = {
  default: "bg-blue-600 hover:bg-blue-700 text-white font-semibold border border-blue-400/40 shadow-md shadow-blue-900/30",
  outline: "bg-transparent hover:bg-white/10 text-white font-semibold border border-white/25 hover:border-white/40",
  destructive: "bg-red-600 hover:bg-red-700 text-white font-semibold border border-red-400/40 shadow-md shadow-red-900/30",
};

export function ButtonRainbow({
  children,
  onClick,
  delayMs = 400,
  className = "",
  variant = "default",
  disabled = false,
  id,
}: RainbowBorderButtonProps) {
  const [isWaiting, setIsWaiting] = useState(false);

  const handleClick = () => {
    if (isWaiting || disabled) return;
    setIsWaiting(true);
    setTimeout(() => {
      setIsWaiting(false);
      onClick?.();
    }, delayMs);
  };

  const button = (
    <Button
      id={id}
      disabled={isWaiting || disabled}
      onClick={handleClick}
      className={cn(
        "relative z-10 w-full sm:w-auto",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </Button>
  );

  return button;
}
