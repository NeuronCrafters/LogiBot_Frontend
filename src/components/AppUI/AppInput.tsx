import { type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface AppInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
}

export function AppInput({ icon, className, ...props }: AppInputProps) {
  return (
    <div className="flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-neutral-950/60 px-3 text-zinc-400 transition-colors focus-within:border-blue-500/60 focus-within:text-blue-400">
      {icon}
      <input
        className={cn(
          "h-full min-w-0 flex-1 bg-transparent font-[Poppins] text-sm text-white outline-none placeholder:text-zinc-600",
          className,
        )}
        {...props}
      />
    </div>
  );
}
