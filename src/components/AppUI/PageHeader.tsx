import { type ReactNode } from "react";

interface PageHeaderProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ icon, title, description, action }: PageHeaderProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-surface p-5 shadow-lg shadow-black/10 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              {icon}
            </div>
          )}
          <div>
            <h1 className="font-[Poppins] text-2xl font-semibold text-white">
              {title}
            </h1>
            {description && (
              <p className="mt-2 font-[Poppins] text-sm leading-relaxed text-zinc-400">
                {description}
              </p>
            )}
          </div>
        </div>
        {action}
      </div>
    </section>
  );
}
