import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, List, Table2, X } from "lucide-react";
import { t, useLocale } from "@/i18n";
import { AppButton } from "@/components/AppUI";
import { cn } from "@/shared/lib/cn";
import { useIsMobile } from "@/shared/hooks/useResponsive";
import { buildTruthTable, truthTableCellKey, type CellMark, type TruthTableColumns } from "@/shared/logic/logicCore";
import { Pagination } from "@/shared/components/navigation/Pagination";
import { pageOfRow, useRowPages } from "@/features/exercises/lib/rowPages";
import { TruthValuePicker } from "@/features/exercises/components/TruthValuePicker";
import { markLabel, truthValueLabel, truthValueSpoken, valueFromKey } from "@/features/exercises/lib/logicLabels";

type View = "table" | "rows";

function MarkIcon({ mark }: { mark: CellMark | undefined }) {
  if (mark === "correct") return <Check aria-hidden="true" className="h-4 w-4 shrink-0" />;
  if (mark === "wrong") return <X aria-hidden="true" className="h-4 w-4 shrink-0" />;
  return null;
}

export interface TruthTableBoardHandle {
  /** Moves focus to a cell (e.g. the first empty one). */
  focusCell(key: string): void;
}

interface TruthTableBoardProps {
  formula: string;
  cells: Record<string, boolean>;
  /** Feedback marks (workbench only; exams never show them). */
  marks?: Record<string, CellMark>;
  /** Every intermediate column, or only the final one (large tables). */
  columns?: TruthTableColumns;
  onCellChange: (row: number, column: string, value: boolean | null) => void;
}

/**
 * The truth-table grid shared by the workbench and exams: table view with a floating
 * V/F choice and arrow-key navigation, or a row-by-row view on narrow screens.
 */
export const TruthTableBoard = forwardRef<TruthTableBoardHandle, TruthTableBoardProps>(function TruthTableBoard(
  { formula, cells, marks = {}, columns = "all", onCellChange },
  ref,
) {
  useLocale();
  const isMobile = useIsMobile();
  const baseId = useId();
  const id = (suffix: string) => `${baseId}-${suffix}`;
  const table = useMemo(() => buildTruthTable(formula, columns), [formula, columns]);
  // Large tables (up to 1024 rows) are shown a page of rows at a time.
  const pages = useRowPages(table.rows.length, `${formula}|${columns}`);
  const visibleRows = table.rows.slice(pages.start, pages.end).map((row, offset) => ({ row, rowIndex: pages.start + offset }));
  const filled = table.rows.reduce((sum, _row, rowIndex) => sum + table.columns.filter((column) => cells[truthTableCellKey(rowIndex, column.key)] !== undefined).length, 0);
  const totalCells = table.rows.length * table.columns.length;
  /** Cell to focus once its page is on screen. */
  const [pendingFocus, setPendingFocus] = useState<string | null>(null);
  const [viewChoice, setViewChoice] = useState<View | null>(null);
  const view: View = viewChoice ?? (isMobile ? "rows" : "table");
  const [focusCell, setFocusCell] = useState({ row: 0, column: 0 });
  /** Cell whose V/F choice is open (table view). */
  const [openCell, setOpenCell] = useState<string | null>(null);

  const cellRefs = useRef(new Map<string, HTMLButtonElement>());

  /** Focuses a cell, first switching to its page when needed. */
  const focusKey = useCallback((key: string) => {
    const row = Number(key.slice(0, key.indexOf("|")));
    if (pageOfRow(row, pages.perPage) !== pages.page) {
      pages.setPage(pageOfRow(row, pages.perPage));
      setPendingFocus(key);
    } else cellRefs.current.get(key)?.focus();
  }, [pages]);

  // Runs after the new page is rendered, when the cell exists.
  useEffect(() => {
    if (!pendingFocus) return;
    const element = cellRefs.current.get(pendingFocus);
    if (element) { element.focus(); setPendingFocus(null); }
  }, [pendingFocus, pages.page]);

  useImperativeHandle(ref, () => ({ focusCell: focusKey }), [focusKey]);

  // Formula changes reset focus and close the choice.
  useEffect(() => {
    setFocusCell({ row: 0, column: 0 });
    setOpenCell(null);
  }, [formula, columns]);

  const setCell = (row: number, column: string, value: boolean | null) => onCellChange(row, column, value);

  /** Opens (or closes) the floating V/F choice anchored to a cell; the table itself never changes. */
  function toggleChoice(row: number, column: string) {
    const key = truthTableCellKey(row, column);
    setOpenCell((current) => (current === key ? null : key));
  }

  function chooseValue(key: string, value: boolean | null) {
    const separator = key.indexOf("|");
    setCell(Number(key.slice(0, separator)), key.slice(separator + 1), value);
    setOpenCell(null);
    cellRefs.current.get(key)?.focus();
  }

  const dismissChoice = useCallback((restoreFocus: boolean) => {
    setOpenCell((current) => {
      if (current && restoreFocus) cellRefs.current.get(current)?.focus();
      return null;
    });
  }, []);

  const pickerAnchor = useMemo(
    () => ({ get current() { return openCell ? cellRefs.current.get(openCell) ?? null : null; } }),
    [openCell],
  );

  function moveFocus(row: number, column: number) {
    const target = { row: Math.max(0, Math.min(table.rows.length - 1, row)), column: Math.max(0, Math.min(table.columns.length - 1, column)) };
    setFocusCell(target);
    focusKey(truthTableCellKey(target.row, table.columns[target.column].key));
  }

  function onCellKeyDown(event: KeyboardEvent<HTMLButtonElement>, row: number, column: number) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const direct = valueFromKey(event.key);
    if (direct !== undefined) {
      event.preventDefault();
      setCell(row, table.columns[column].key, direct);
      return;
    }
    const moves: Record<string, [number, number]> = {
      ArrowUp: [row - 1, column],
      ArrowDown: [row + 1, column],
      ArrowLeft: [row, column - 1],
      ArrowRight: [row, column + 1],
      Home: [row, 0],
      End: [row, table.columns.length - 1],
    };
    const target = moves[event.key];
    if (!target) return;
    event.preventDefault();
    moveFocus(target[0], target[1]);
  }

  const registerCell = (key: string) => (element: HTMLButtonElement | null) => {
    if (element) cellRefs.current.set(key, element);
    else cellRefs.current.delete(key);
  };

  const valueText = (value: boolean | undefined) =>
    value === undefined ? truthValueSpoken(undefined) : `${truthValueLabel(value)} (${truthValueSpoken(value)})`;

  const cellLabel = (row: number, column: string) => {
    const key = truthTableCellKey(row, column);
    const mark = markLabel(marks[key]);
    const params = { row: row + 1, column, value: valueText(cells[key]), mark };
    return mark ? t("exercises.truthTable.cellLabelMarked", params) : t("exercises.truthTable.cellLabel", params);
  };

  const markClasses = (mark: CellMark | undefined) =>
    mark === "correct"
      ? "border-emerald-400/70 bg-emerald-500/10 text-emerald-300"
      : mark === "wrong"
        ? "border-red-400/70 bg-red-500/10 text-red-300"
        : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="font-[Poppins] text-xs text-zinc-400">
        {t("exercises.truthTable.size", { rows: table.rows.length, columns: table.columns.length })} · {t("exercises.truthTable.filled", { filled, total: totalCells })}
      </p>
      <div role="group" aria-label={t("exercises.truthTable.viewLabel")} className="flex justify-end gap-2">
          <AppButton type="button" size="sm" className="h-11 md:h-9" variant={view === "table" ? "primary" : "secondary"} aria-pressed={view === "table"} onClick={() => setViewChoice("table")}>
            <Table2 aria-hidden="true" className="h-4 w-4" />
            {t("exercises.truthTable.viewTable")}
          </AppButton>
          <AppButton type="button" size="sm" className="h-11 md:h-9" variant={view === "rows" ? "primary" : "secondary"} aria-pressed={view === "rows"} onClick={() => setViewChoice("rows")}>
            <List aria-hidden="true" className="h-4 w-4" />
            {t("exercises.truthTable.viewRows")}
          </AppButton>
      </div>
      </div>
      {view === "table" ? (
        <div>
          <p id={id("help")} className="mb-2 font-[Poppins] text-xs leading-relaxed text-zinc-400">{t("exercises.truthTable.keyboardHelp")}</p>
          <div
            role="region"
            aria-labelledby={id("caption")}
            tabIndex={0}
            className="overflow-x-auto rounded-xl border border-white/10"
          >
            <table className="w-max min-w-full border-collapse font-mono text-sm" aria-describedby={id("help")}>
              <caption id={id("caption")} className="sr-only">{t("exercises.truthTable.caption", { formula: table.formula })}</caption>
              <thead>
                <tr>
                  {table.variables.map((name, index) => (
                    <th
                      key={name}
                      scope="col"
                      className={cn(
                        "border-b border-white/10 bg-surface-raised px-3 py-2 text-center font-semibold text-zinc-300",
                        index === table.variables.length - 1 && "border-r-2",
                      )}
                    >
                      {name}
                    </th>
                  ))}
                  {table.columns.map((column) => (
                    <th key={column.key} scope="col" className="whitespace-nowrap border-b border-white/10 bg-surface-raised px-3 py-2 text-center font-semibold text-white">
                      {column.key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map(({ row, rowIndex }) => (
                  <tr key={rowIndex} className="border-b border-white/5 last:border-b-0">
                    {table.variables.map((name, index) => (
                      <td
                        key={name}
                        className={cn("px-3 py-1 text-center text-zinc-400", index === table.variables.length - 1 && "border-r-2 border-white/10")}
                      >
                        <span aria-hidden="true">{truthValueLabel(row.assignment[name])}</span>
                        <span className="sr-only">{truthValueSpoken(row.assignment[name])}</span>
                      </td>
                    ))}
                    {table.columns.map((column, columnIndex) => {
                      const key = truthTableCellKey(rowIndex, column.key);
                      const focusRow = focusCell.row >= pages.start && focusCell.row < pages.end ? focusCell.row : pages.start;
                      const isFocusTarget = focusRow === rowIndex && focusCell.column === columnIndex;
                      return (
                        <td key={column.key} className="p-1 text-center">
                          <button
                            ref={registerCell(key)}
                            type="button"
                            tabIndex={isFocusTarget ? 0 : -1}
                            aria-label={cellLabel(rowIndex, column.key)}
                            aria-expanded={openCell === key}
                            aria-controls={openCell === key ? id("picker") : undefined}
                            onClick={() => toggleChoice(rowIndex, column.key)}
                            onFocus={() => setFocusCell({ row: rowIndex, column: columnIndex })}
                            onKeyDown={(event) => onCellKeyDown(event, rowIndex, columnIndex)}
                            className={cn(
                              "inline-flex h-11 min-w-[2.75rem] items-center justify-center gap-1 rounded-lg border px-2 font-semibold transition-colors",
                              markClasses(marks[key]) ?? "border-control bg-neutral-950/60 text-white hover:bg-white/10",
                            )}
                          >
                            <span aria-hidden="true">{truthValueLabel(cells[key])}</span>
                            <MarkIcon mark={marks[key]} />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <ol start={pages.start + 1} className="grid gap-3 md:grid-cols-2" aria-label={t("exercises.truthTable.caption", { formula: table.formula })}>
          {visibleRows.map(({ row, rowIndex }) => (
            <li key={rowIndex} className="rounded-xl border border-white/10 bg-surface-sunken p-3">
              <h3 className="font-[Poppins] text-sm font-semibold text-white">{t("exercises.truthTable.rowLabel", { row: rowIndex + 1 })}</h3>
              <p className="mt-1 break-words font-mono text-sm text-zinc-400">
                {table.variables.map((name) => `${name} = ${truthValueLabel(row.assignment[name])}`).join(" · ")}
              </p>
              <div className="mt-3 space-y-2">
                {table.columns.map((column) => {
                  const key = truthTableCellKey(rowIndex, column.key);
                  const mark = marks[key];
                  const spokenMark = markLabel(mark);
                  return (
                    <div
                      key={column.key}
                      role="group"
                      aria-label={t("exercises.truthTable.groupLabel", { row: rowIndex + 1, column: column.key })}
                      className="flex flex-wrap items-center justify-between gap-2"
                    >
                      <span className="min-w-0 break-words font-mono text-sm text-white">{column.key}</span>
                      <div className="flex shrink-0 items-center gap-2">
                        {[true, false].map((value) => {
                          const pressed = cells[key] === value;
                          return (
                            <button
                              key={String(value)}
                              ref={value ? registerCell(key) : undefined}
                              type="button"
                              aria-pressed={pressed}
                              onClick={() => setCell(rowIndex, column.key, pressed ? null : value)}
                              className={cn(
                                "inline-flex h-11 min-w-[2.75rem] items-center justify-center rounded-lg border px-3 font-mono font-semibold transition-colors",
                                pressed
                                  ? markClasses(mark) ?? "border-blue-400/40 bg-blue-600 text-on-accent"
                                  : "border-control bg-neutral-950/60 text-white hover:bg-white/10",
                              )}
                            >
                              {truthValueLabel(value)}
                            </button>
                          );
                        })}
                        <span className={cn("inline-flex h-6 w-6 items-center justify-center", mark === "correct" ? "text-emerald-300" : "text-red-300")}>
                          <MarkIcon mark={mark} />
                          {spokenMark && <span className="sr-only">{spokenMark}</span>}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </li>
          ))}
        </ol>
      )}

      {pages.paged && (
        <Pagination
          page={pages.page}
          totalPages={pages.pageCount}
          total={table.rows.length}
          pageSize={pages.perPage}
          onPageChange={(next) => { setOpenCell(null); pages.setPage(next); }}
          label={t("exercises.truthTable.rowPages")}
          rangeKey="exercises.truthTable.rowRange"
        />
      )}

      {view === "table" && openCell && (
        <TruthValuePicker
          id={id("picker")}
          anchor={pickerAnchor}
          label={t("exercises.truthTable.groupLabel", { row: Number(openCell.slice(0, openCell.indexOf("|"))) + 1, column: openCell.slice(openCell.indexOf("|") + 1) })}
          value={cells[openCell]}
          onChoose={(value) => chooseValue(openCell, value)}
          onDismiss={dismissChoice}
        />
      )}
    </div>
  );
});
