import { useId } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { t, useLocale, type MessageKey } from "@/i18n";
import { cn } from "@/shared/lib/cn";
import { PAGE_SIZE_OPTIONS, pageWindow } from "./pageWindow";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizes?: number[];
  /** Accessible name of the navigation, e.g. "Paginação dos feedbacks". */
  label?: string;
  /** Text of the counter, with {{from}}, {{to}} and {{total}} (default "Mostrando 1–12 de 30"). */
  rangeKey?: MessageKey;
  className?: string;
}

const buttonClass =
  "inline-flex h-11 min-w-11 items-center justify-center rounded-xl border px-3 font-[Poppins] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:min-w-9";

export function Pagination({ page, totalPages, total, pageSize, onPageChange, onPageSizeChange, pageSizes = PAGE_SIZE_OPTIONS, label, rangeKey = "pagination.range", className }: PaginationProps) {
  useLocale();
  const sizeId = useId();
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className={cn("flex flex-col gap-3 font-[Poppins] sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
        <p aria-live="polite">{t(rangeKey, { from, to, total })}</p>
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <label htmlFor={sizeId} className="text-xs font-medium text-zinc-300">{t("pagination.perPage")}</label>
            <select id={sizeId} value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="h-11 rounded-xl border border-control bg-neutral-950/60 px-2 text-sm text-white sm:h-9">
              {pageSizes.map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <nav aria-label={label ?? t("pagination.label")} className="flex items-center justify-between gap-2 sm:justify-end">
          <button type="button" className={cn(buttonClass, "border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10")}
            disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label={t("pagination.previous")}>
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            <span className="ml-1 sm:hidden">{t("pagination.previous")}</span>
          </button>
          {/* Phones show where you are; larger screens list the pages. */}
          <p className="text-sm text-zinc-300 sm:hidden">{t("pagination.status", { page, total: totalPages })}</p>
          <ul className="hidden items-center gap-1 sm:flex">
            {pageWindow(page, totalPages).map((item, index) => (
              <li key={item === "gap" ? `gap-${index}` : item}>
                {item === "gap" ? (
                  <span aria-hidden="true" className="px-1 text-zinc-500">…</span>
                ) : (
                  <button type="button" onClick={() => onPageChange(item)} aria-current={item === page ? "page" : undefined}
                    aria-label={t("pagination.page", { page: item })}
                    className={cn(buttonClass, item === page ? "border-blue-500/60 bg-blue-500/15 text-blue-200" : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white")}>
                    {item}
                  </button>
                )}
              </li>
            ))}
          </ul>
          <button type="button" className={cn(buttonClass, "border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10")}
            disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label={t("pagination.next")}>
            <span className="mr-1 sm:hidden">{t("pagination.next")}</span>
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
