import { useId, useMemo } from "react";
import { t, useLocale } from "@/i18n";
import { buildTruthTable, type TruthTableColumns } from "@/shared/logic/logicCore";
import { Pagination } from "@/shared/components/navigation/Pagination";
import { useRowPages } from "@/features/exercises/lib/rowPages";
import { truthValueLabel, truthValueSpoken } from "@/features/exercises/lib/logicLabels";

/** Expected truth table of a formula, shown to the professor as the answer key. */
export function AnswerKeyTable({ formula, note, columns = "all" }: { formula: string; note?: string; columns?: TruthTableColumns }) {
  useLocale();
  const captionId = useId();
  const table = useMemo(() => {
    try {
      return buildTruthTable(formula, columns);
    } catch {
      return null;
    }
  }, [formula, columns]);
  const pages = useRowPages(table?.rows.length ?? 0, `${formula}|${columns}`);
  if (!table) return null;

  return (
    <section aria-labelledby={captionId} className="rounded-xl border border-emerald-400/30 bg-emerald-500/5 p-3">
      <h3 id={captionId} className="font-[Poppins] text-sm font-semibold text-emerald-200">{t("questions.answerKey.title")}</h3>
      {note && <p className="mt-1 font-[Poppins] text-xs leading-relaxed text-zinc-400">{note}</p>}
      <div role="region" aria-label={t("questions.answerKey.caption", { formula: table.formula })} tabIndex={0} className="mt-2 overflow-x-auto rounded-lg border border-white/10">
        <table className="w-max min-w-full border-collapse text-center font-mono text-sm">
          <caption className="sr-only">{t("questions.answerKey.caption", { formula: table.formula })}</caption>
          <thead>
            <tr>
              {table.variables.map((name, index) => (
                <th key={name} scope="col" className={index === table.variables.length - 1 ? "border-r-2 border-white/10 bg-surface-raised px-3 py-2 text-zinc-300" : "bg-surface-raised px-3 py-2 text-zinc-300"}>{name}</th>
              ))}
              {table.columns.map((column) => <th key={column.key} scope="col" className="bg-surface-raised px-3 py-2 text-white">{column.key}</th>)}
            </tr>
          </thead>
          <tbody>
            {table.rows.slice(pages.start, pages.end).map((row, offset) => (
              <tr key={pages.start + offset} className="border-t border-white/5">
                {table.variables.map((name, index) => (
                  <td key={name} className={index === table.variables.length - 1 ? "border-r-2 border-white/10 px-3 py-1 text-zinc-400" : "px-3 py-1 text-zinc-400"}>
                    <span aria-hidden="true">{truthValueLabel(row.assignment[name])}</span>
                    <span className="sr-only">{truthValueSpoken(row.assignment[name])}</span>
                  </td>
                ))}
                {row.values.map((value, index) => (
                  <td key={table.columns[index].key} className={value ? "px-3 py-1 text-emerald-300" : "px-3 py-1 text-zinc-300"}>
                    <span aria-hidden="true">{truthValueLabel(value)}</span>
                    <span className="sr-only">{truthValueSpoken(value)}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages.paged && (
        <Pagination className="mt-2" page={pages.page} totalPages={pages.pageCount} total={table.rows.length} pageSize={pages.perPage}
          onPageChange={pages.setPage} label={t("questions.answerKey.pages")} rangeKey="exercises.truthTable.rowRange" />
      )}
    </section>
  );
}
