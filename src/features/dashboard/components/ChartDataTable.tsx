import { useId, useState, type ReactNode } from "react";
import { Table2 } from "lucide-react";
import { t, useLocale } from "@/i18n";

export interface ChartTableColumn<T> {
  header: string;
  cell: (row: T) => ReactNode;
  numeric?: boolean;
}

interface ChartDataTableProps<T> {
  title: string;
  columns: ChartTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  footer?: ReactNode;
}

/** Text shown when a value does not exist, kept visually and audibly distinct from zero. */
export function MissingValue({ label }: { label?: string }) {
  useLocale();
  return <span className="italic text-zinc-400">{label ?? t("dashboard.table.semDados")}</span>;
}

/**
 * Accessible table with the same data drawn by a chart. It is closed by default, opens with a regular
 * button and does not depend on hover or on AI generated analysis.
 */
export function ChartDataTable<T>({ title, columns, rows, rowKey, footer }: ChartDataTableProps<T>) {
  useLocale();
  const [open, setOpen] = useState(false);
  const id = useId();
  const regionId = `${id}-table`;
  const captionId = `${id}-caption`;

  return (
    <div data-export-ignore="true" className="mt-4 border-t border-white/10 pt-2">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-2 font-[Poppins] text-sm font-medium text-blue-400 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
      >
        <Table2 aria-hidden="true" className="h-4 w-4" />
        {open ? t("dashboard.table.ocultar") : t("dashboard.table.ver")}
      </button>
      <div id={regionId} hidden={!open}>
        {open && (
          <div role="region" aria-labelledby={captionId} tabIndex={0} className="mt-2 max-h-96 overflow-auto rounded-lg border border-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400">
            <table className="w-full border-collapse text-left font-[Poppins] text-sm">
              <caption id={captionId} className="px-3 py-2 text-left text-sm font-medium text-white">
                {t("dashboard.table.legenda", { title })}
              </caption>
              <thead className="sticky top-0 bg-surface-sunken">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.header}
                      scope="col"
                      className={`border-b border-white/10 px-3 py-2 font-semibold text-zinc-300 ${column.numeric ? "text-right" : ""}`}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={rowKey(row, index)} className="border-b border-white/10 last:border-b-0">
                    {columns.map((column, columnIndex) => {
                      const className = `px-3 py-2 ${column.numeric ? "whitespace-nowrap text-right tabular-nums" : ""}`;
                      return columnIndex === 0 ? (
                        <th key={column.header} scope="row" className={`${className} font-medium text-white`}>
                          {column.cell(row)}
                        </th>
                      ) : (
                        <td key={column.header} className={`${className} text-white`}>
                          {column.cell(row)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              {footer && (
                <tfoot>
                  <tr className="border-t border-white/10">
                    <td colSpan={columns.length} className="px-3 py-2 font-medium text-white">
                      {footer}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
