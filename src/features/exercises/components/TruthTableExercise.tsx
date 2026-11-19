import { useId, useMemo, useRef, useState, type FormEvent } from "react";
import { RotateCcw } from "lucide-react";
import { t, useLocale } from "@/i18n";
import { AppButton, AppInput } from "@/components/AppUI";
import { cn } from "@/shared/lib/cn";
import { apiError } from "@/shared/lib/apiError";
import {
  buildTruthTable,
  checkTruthTableFormula,
  conceptsOf,
  gradeTruthTable,
  normalizeFormula,
  parseFormula,
  truthTableCellKey,
  type CellMark,
  type ConceptSlug,
  type LogicIssue,
  type TruthTableColumns,
} from "@/shared/logic/logicCore";
import { exercisesApi } from "@/features/exercises/api/exercisesApi";
import { HintPanel, type HintTarget } from "@/features/exercises/components/HintPanel";
import { TruthTableBoard, type TruthTableBoardHandle } from "@/features/exercises/components/TruthTableBoard";
import { TRUTH_TABLE_CATALOG } from "@/features/exercises/catalog";
import { usePracticeBank } from "@/features/exercises/hooks/usePracticeBank";
import { BANK_PREFIX, bankOptionLabel } from "@/features/exercises/lib/practiceBank";
import { conceptLabel, conceptList, logicIssueMessage } from "@/features/exercises/lib/logicLabels";
import { isOfflineError, useAttemptLog } from "@/features/exercises/lib/attemptLog";
import type { ExerciseSource } from "@/features/exercises/types";

const CATALOG = TRUTH_TABLE_CATALOG.map((source) => normalizeFormula(source));
const CUSTOM = "custom";

interface GradeSummary {
  correct: boolean;
  total: number;
  right: number;
  errorsByConcept: Partial<Record<ConceptSlug, number>>;
}
type Status =
  | { kind: "idle" }
  | { kind: "incomplete"; count: number }
  | { kind: "result"; grade: GradeSummary; attemptNumber: number | null; offline: boolean }
  | { kind: "error"; message: string };

/** `embedded`: the page header already shows the title, so the component does not repeat it. */
export function TruthTableExercise({ embedded = false }: { embedded?: boolean } = {}) {
  useLocale();
  const baseId = useId();
  const id = (suffix: string) => `${baseId}-${suffix}`;
  const log = useAttemptLog();
  const board = useRef<TruthTableBoardHandle>(null);

  const [selection, setSelection] = useState("0");
  const [customText, setCustomText] = useState("");
  const [customError, setCustomError] = useState<LogicIssue | null>(null);
  const bank = usePracticeBank("truth_table");
  const [active, setActive] = useState<{ formula: string; source: ExerciseSource; columns: TruthTableColumns; bankId?: string; statement?: string }>({ formula: CATALOG[0], source: "catalog", columns: "all" });
  /** Own formula: the student may ask only for the final column (needed for very large tables). */
  const [customFinal, setCustomFinal] = useState(false);
  const table = useMemo(() => buildTruthTable(active.formula, active.columns), [active.formula, active.columns]);
  const concepts = useMemo(() => conceptsOf(parseFormula(active.formula)), [active.formula]);

  const [cells, setCells] = useState<Record<string, boolean>>({});
  const [marks, setMarks] = useState<Record<string, CellMark>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, setPending] = useState(false);
  const [hint, setHint] = useState<HintTarget | null>(null);

  function loadFormula(formula: string, source: ExerciseSource, question?: { id: string; statement: string }, columns: TruthTableColumns = "all") {
    setActive({ formula, source, columns, bankId: question?.id, statement: question?.statement });
    setCells({});
    setMarks({});
    setStatus({ kind: "idle" });
    setHint(null);
    log.restart();
  }
  function onSelect(value: string) {
    setSelection(value);
    setCustomError(null);
    if (value.startsWith(BANK_PREFIX)) {
      const question = bank.find((item) => BANK_PREFIX + item.id === value);
      const columns = question?.content.columns ?? "all";
      const check = question ? checkTruthTableFormula(question.content.formula, columns) : null;
      if (question && check && check.ok) loadFormula(check.normalized, "bank", question, columns);
    } else if (value !== CUSTOM) loadFormula(CATALOG[Number(value)], "catalog");
  }

  function onSubmitCustom(event: FormEvent) {
    event.preventDefault();
    const columns: TruthTableColumns = customFinal ? "final" : "all";
    const check = checkTruthTableFormula(customText, columns);
    if (check.ok === false) {
      setCustomError(check.error);
      return;
    }
    setCustomError(null);
    loadFormula(check.normalized, "custom", undefined, columns);
  }

  function setCell(row: number, column: string, value: boolean | null) {
    const key = truthTableCellKey(row, column);
    setCells((previous) => {
      const next = { ...previous };
      if (value === null) delete next[key];
      else next[key] = value;
      return next;
    });
    setMarks((previous) => {
      if (!(key in previous)) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
    setStatus((current) => (current.kind === "incomplete" ? { kind: "idle" } : current));
    log.record({ action: "mark", row, column, value });
  }
  async function verify() {
    const total = table.rows.length * table.columns.length;
    const empty = total - Object.keys(cells).length;
    if (empty > 0) {
      setStatus({ kind: "incomplete", count: empty });
      const firstEmpty = table.rows
        .map((_row, row) => table.columns.map((column) => truthTableCellKey(row, column.key)))
        .reduce((all, keys) => all.concat(keys), [] as string[])
        .find((key) => cells[key] === undefined);
      if (firstEmpty) board.current?.focusCell(firstEmpty);
      return;
    }
    setPending(true);
    try {
      const response = await exercisesApi.submitTruthTableAttempt({
        type: "truth_table", source: active.source, formula: active.formula, columns: active.columns, cells, hintsUsed: 0, ...log.snapshot(),
        ...(active.bankId ? { bankQuestionId: active.bankId } : {}),
      });
      setMarks(response.marks);
      setStatus({ kind: "result", grade: response, attemptNumber: response.attemptNumber, offline: false });
      setHint({ exerciseId: response.exerciseId, attemptId: response.correct ? null : response.attemptId, correct: response.correct });
      log.restart();
    } catch (error) {
      if (isOfflineError(error)) {
        // Network or server failure: local feedback only, clearly not recorded.
        const local = gradeTruthTable(active.formula, cells, active.columns);
        setMarks(local.marks);
        setStatus({ kind: "result", grade: local, attemptNumber: null, offline: true });
        setHint(local.correct ? null : { exerciseId: null, attemptId: null, offline: true });
      } else {
        setStatus({ kind: "error", message: apiError(error) });
      }
    } finally {
      setPending(false);
    }
  }

  function clear() {
    setCells({});
    setMarks({});
    setStatus({ kind: "idle" });
    log.record({ action: "clear" });
  }

  const errorList = (grade: GradeSummary) =>
    (Object.keys(grade.errorsByConcept) as ConceptSlug[])
      .map((concept) => `${conceptLabel(concept)} (${grade.errorsByConcept[concept]})`)
      .join(", ");

  return (
    <div className="space-y-5">
      <div>
        {!embedded && <h2 className="font-[Poppins] text-lg font-semibold text-white">{t("exercises.truthTable.title")}</h2>}
        <p className="mt-1 font-[Poppins] text-sm leading-relaxed text-zinc-400">{t("exercises.truthTable.instructions")}</p>
      </div>

      <div>
        <label htmlFor={id("formula")} className="mb-1.5 block font-[Poppins] text-sm font-medium text-zinc-300">
          {t("exercises.truthTable.formulaLabel")}
        </label>
        <select
          id={id("formula")}
          value={selection}
          onChange={(event) => onSelect(event.target.value)}
          className="h-12 w-full rounded-xl border border-control bg-neutral-950/60 px-3 font-mono text-sm text-white"
        >
          {bank.length > 0 && (
            <optgroup label={t("exercises.bank.fromClass")}>
              {bank.map((item) => <option key={item.id} value={BANK_PREFIX + item.id}>{bankOptionLabel(item.statement, item.content.formula)}</option>)}
            </optgroup>
          )}
          {bank.length > 0 ? (
            <optgroup label={t("exercises.bank.examples")}>
              {CATALOG.map((formula, index) => <option key={formula} value={String(index)}>{formula}</option>)}
            </optgroup>
          ) : CATALOG.map((formula, index) => (
            <option key={formula} value={String(index)}>{formula}</option>
          ))}
          <option value={CUSTOM}>{t("exercises.truthTable.customOption")}</option>
        </select>

        {selection === CUSTOM && (
          <form onSubmit={onSubmitCustom} noValidate className="mt-3">
            <label htmlFor={id("custom")} className="mb-1.5 block font-[Poppins] text-sm font-medium text-zinc-300">
              {t("exercises.truthTable.customLabel")}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="min-w-0 flex-1">
                <AppInput
                  id={id("custom")}
                  value={customText}
                  onChange={(event) => setCustomText(event.target.value)}
                  placeholder={t("exercises.truthTable.customPlaceholder")}
                  aria-invalid={customError ? true : undefined}
                  aria-describedby={customError ? `${id("notations")} ${id("custom-error")}` : id("notations")}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="font-mono"
                />
              </div>
              <AppButton type="submit" variant="secondary">{t("exercises.truthTable.useFormula")}</AppButton>
            </div>
            <p id={id("notations")} className="mt-2 font-[Poppins] text-xs leading-relaxed text-zinc-400">
              {t("exercises.truthTable.notations")}{" "}
              <span className="whitespace-nowrap font-mono">{"¬ ~ !"}</span>{" · "}
              <span className="whitespace-nowrap font-mono">{"∧ & ^"}</span>{" · "}
              <span className="whitespace-nowrap font-mono">{"∨ |"}</span>{" · "}
              <span className="whitespace-nowrap font-mono">{"→ ->"}</span>{" · "}
              <span className="whitespace-nowrap font-mono">{"↔ <->"}</span>
            </p>
            <label className="mt-3 flex min-h-11 cursor-pointer items-start gap-3 font-[Poppins] text-sm text-zinc-200">
              <input type="checkbox" checked={customFinal} onChange={(event) => { setCustomFinal(event.target.checked); setCustomError(null); }}
                className="mt-0.5 h-5 w-5 shrink-0 accent-blue-500" aria-describedby={id("final-hint")} />
              <span>
                {t("exercises.truthTable.finalOnly")}
                <span id={id("final-hint")} className="mt-0.5 block text-xs text-zinc-400">{t("exercises.truthTable.finalOnlyHint")}</span>
              </span>
            </label>
            {customError && (
              <p id={id("custom-error")} role="alert" className="mt-2 font-[Poppins] text-sm text-red-300">
                {logicIssueMessage(customError)}
              </p>
            )}
          </form>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {active.statement && <p className="mb-1 font-[Poppins] text-base font-medium leading-relaxed text-white">{active.statement}</p>}
          <p className="break-words font-mono text-lg text-white">{table.formula}</p>
          {active.columns === "final" && <p className="mt-1 font-[Poppins] text-xs font-medium text-amber-200">{t("exercises.truthTable.finalNote")}</p>}
          {concepts.length > 0 && (
            <p className="mt-1 font-[Poppins] text-xs text-zinc-400">
              {t("exercises.truthTable.concepts", { list: conceptList(concepts) })}
            </p>
          )}
        </div>
      </div>

      <TruthTableBoard ref={board} formula={active.formula} columns={active.columns} cells={cells} marks={marks} onCellChange={setCell} />

      <div className="flex flex-col gap-2 sm:flex-row">
        <AppButton type="button" onClick={verify} disabled={pending} aria-busy={pending || undefined}>
          {pending ? t("exercises.truthTable.checking") : t("exercises.truthTable.check")}
        </AppButton>
        <AppButton type="button" variant="secondary" onClick={clear} disabled={pending}>
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          {t("exercises.truthTable.clear")}
        </AppButton>
      </div>

      {status.kind === "incomplete" && (
        <p role="alert" className="font-[Poppins] text-sm text-amber-300">
          {t("exercises.truthTable.fillAll", { count: status.count })}
        </p>
      )}
      {status.kind === "error" && (
        <p role="alert" className="font-[Poppins] text-sm text-red-300">{status.message}</p>
      )}
      <div role="status" aria-live="polite" aria-atomic="true" className="space-y-1 font-[Poppins] text-sm">
        {status.kind === "result" && (
          <>
            <p className={cn("font-semibold", status.grade.correct ? "text-emerald-300" : "text-white")}>
              {status.grade.correct
                ? t("exercises.truthTable.resultCorrect", { total: status.grade.total })
                : t("exercises.truthTable.resultPartial", { right: status.grade.right, total: status.grade.total })}
            </p>
            {!status.grade.correct && Object.keys(status.grade.errorsByConcept).length > 0 && (
              <p className="text-zinc-300">{t("exercises.truthTable.errorsByConcept", { list: errorList(status.grade) })}</p>
            )}
            <p className={status.offline ? "text-amber-300" : "text-zinc-400"}>
              {status.offline
                ? t("exercises.truthTable.offlineResult")
                : t("exercises.truthTable.attemptSaved", { number: status.attemptNumber ?? 0 })}
            </p>
          </>
        )}
      </div>

      {hint && <HintPanel {...hint} />}
    </div>
  );
}
