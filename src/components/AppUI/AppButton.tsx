import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type AppButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type AppButtonSize = "sm" | "md" | "icon";

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
}

const variantClasses: Record<AppButtonVariant, string> = {
  primary:
    "border-blue-400/40 bg-blue-600 text-white shadow-blue-900/30 hover:bg-blue-700",
  secondary:
    "border-white/10 bg-white/5 text-zinc-200 shadow-black/10 hover:bg-white/10 hover:text-white",
  danger:
    "border-red-400/40 bg-red-600 text-white shadow-red-900/30 hover:bg-red-700",
  ghost:
    "border-transparent bg-transparent text-zinc-400 shadow-none hover:bg-white/5 hover:text-white",
};

const sizeClasses: Record<AppButtonSize, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-11 px-4 text-sm",
  icon: "h-10 w-10 p-0",
};

export function AppButton({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: AppButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border font-[Poppins] font-semibold shadow-md transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
