import { type ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex min-h-[12rem] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#1f1f1f] p-8 text-center">
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-zinc-500">
          {icon}
        </div>
      )}
      <p className="font-[Poppins] text-sm font-medium text-zinc-300">
        {title}
      </p>
      {description && (
        <p className="mt-2 max-w-sm font-[Poppins] text-xs leading-relaxed text-zinc-500">
          {description}
        </p>
      )}
    </div>
  );
}
