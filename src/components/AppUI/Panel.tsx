import { type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface PanelProps {
  children: ReactNode;
  className?: string;
}

export function Panel({ children, className }: PanelProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}
