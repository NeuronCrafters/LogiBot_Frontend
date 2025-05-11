// components/Button/ButtonRainbow.tsx
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
}

export function ButtonRainbow({
  children,
  onClick,
  delayMs = 400,
  className = "",
  variant = "default",
  disabled = false,
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

  return (
    <div className="rainbow-border">
      <Button
        variant={variant}
        disabled={isWaiting || disabled}
        onClick={handleClick}
        className={cn("relative z-10 w-full sm:w-auto", className)}
      >
        {children}
      </Button>
    </div>
  );
}
