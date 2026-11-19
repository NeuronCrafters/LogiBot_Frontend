import { useId, useState } from "react";
import { Shuffle } from "lucide-react";
import { getLanguage, t, useLocale } from "@/i18n";
import { AppButton } from "@/components/AppUI";
import { cn } from "@/shared/lib/cn";
import { apiError } from "@/shared/lib/apiError";
import { gradeParsons, type ParsonsLineMark } from "@/shared/logic/parsonsCore";
import { PARSONS_EXERCISES, type ContentLanguage, type ParsonsExerciseDefinition } from "@/shared/logic/exerciseCatalog";
import { exercisesApi } from "@/features/exercises/api/exercisesApi";
import { HintPanel, type HintTarget } from "@/features/exercises/components/HintPanel";
import { ParsonsBoard, type ParsonsBoardValue } from "@/features/exercises/components/ParsonsBoard";
import { conceptList } from "@/features/exercises/lib/logicLabels";
import { isOfflineError, useAttemptLog } from "@/features/exercises/lib/attemptLog";
import { usePracticeBank } from "@/features/exercises/hooks/usePracticeBank";
import { BANK_PREFIX, bankOptionLabel } from "@/features/exercises/lib/practiceBank";

type Board = ParsonsBoardValue;
interface Summary { correct: boolean; misplaced: number; wrongIndent: number; distractors: number; missing: number }
type Status =
  | { kind: "idle" }
  | { kind: "empty" }
  | { kind: "error"; message: string }
  | { kind: "result"; summary: Summary; attemptNumber: number | null; offline: boolean };


/** Deterministic shuffle: the same exercise and round always start in the same order. */
function seededShuffle(ids: string[], seedText: string): string[] {
  let seed = 0;
  for (let i = 0; i < seedText.length; i++) seed = (seed * 31 + seedText.charCodeAt(i)) >>> 0;
  const random = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const result = ids.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const swap = result[i];
    result[i] = result[j];
    result[j] = swap;
  }
  return result;
}

const initialBoard = (exercise: { key: string; lines: Array<{ id: string }> }, round: number): Board => ({
  bank: seededShuffle(exercise.lines.map((line) => line.id), `${exercise.key}#${round}`),
  solution: [],
});

interface CurrentExercise {
  key: string;
  bankId?: string;
  statement: string;
  concepts: string[];
  lines: Array<{ id: string; text: string }>;
  /** Built-in definition (with the answer key): only examples are graded offline. */
  catalog: ParsonsExerciseDefinition | null;
}

/** `embedded`: the page header already shows the title, so the component does not repeat it. */
export function ParsonsExercise({ embedded = false }: { embedded?: boolean } = {}) {
  useLocale();
  const language = getLanguage() as ContentLanguage;
  const baseId = useId();
  const id = (suffix: string) => `${baseId}-${suffix}`;
  const log = useAttemptLog();

  const questions = usePracticeBank("parsons");
  const [selection, setSelection] = useState("0");
  const resolve = (value: string): CurrentExercise => {
    const question = value.startsWith(BANK_PREFIX) ? questions.find((item) => BANK_PREFIX + item.id === value) : undefined;
    if (question) return { key: value, bankId: question.id, statement: question.statement, concepts: question.concepts, lines: question.content.lines, catalog: null };
    const item = PARSONS_EXERCISES[Number(value)] ?? PARSONS_EXERCISES[0];
    return { key: item.id, statement: item.statement[language], concepts: item.concepts, lines: item.lines.map((line) => ({ id: line.id, text: line.text[language] })), catalog: item };
  };
  const exercise = resolve(selection);
  const [round, setRound] = useState(0);
  const [initial, setInitial] = useState<Board>(() => initialBoard({ key: PARSONS_EXERCISES[0].id, lines: PARSONS_EXERCISES[0].lines }, 0));
  const [board, setBoard] = useState<Board>(initial);
  const [marks, setMarks] = useState<Record<string, ParsonsLineMark>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, setPending] = useState(false);
  const [hint, setHint] = useState<HintTarget | null>(null);
  const lines = exercise.lines;

  function onBoardChange(next: Board) {
    setBoard(next);
    setMarks({});
    setStatus({ kind: "idle" });
  }

  function load(value: string, nextRound: number) {
    const fresh = initialBoard(resolve(value), nextRound);
    setSelection(value);
    setRound(nextRound);
    setInitial(fresh);
    setBoard(fresh);
    setMarks({});
    setStatus({ kind: "idle" });
    setHint(null);
    log.restart();
  }


  async function verify() {
    if (board.solution.length === 0) {
      setStatus({ kind: "empty" });
      return;
    }
    setPending(true);
    try {
      const response = await exercisesApi.submitParsonsAttempt({
        type: "parsons", ...(exercise.bankId ? { bankQuestionId: exercise.bankId } : { exerciseId: exercise.key }), solution: board.solution, hintsUsed: 0, ...log.snapshot(),
      });
      setMarks(response.marks);
      setStatus({ kind: "result", summary: response, attemptNumber: response.attemptNumber, offline: false });
      setHint({ exerciseId: response.exerciseId, attemptId: response.correct ? null : response.attemptId, correct: response.correct });
      log.restart();
    } catch (error) {
      if (!isOfflineError(error) || !exercise.catalog) {
        // Professor questions keep their answer key on the server: no offline grading.
        setStatus({ kind: "error", message: isOfflineError(error) ? t("exercises.bank.needsConnection") : apiError(error) });
        return;
      }
      const local = gradeParsons(exercise.catalog, board.solution);
      setMarks(local.marks);
      setStatus({ kind: "result", summary: local, attemptNumber: null, offline: true });
      setHint(local.correct ? null : { exerciseId: null, attemptId: null, offline: true });
    } finally {
      setPending(false);
    }
  }

  const summary = status.kind === "result" ? status.summary : null;


  return (
    <div className="space-y-5">
      <div>
        {!embedded && <h2 className="font-[Poppins] text-lg font-semibold text-white">{t("exercises.parsons.title")}</h2>}
        <p className="mt-1 font-[Poppins] text-sm leading-relaxed text-zinc-400">{t("exercises.parsons.instructions")}</p>
      </div>

      <div>
        <label htmlFor={id("exercise")} className="mb-1.5 block font-[Poppins] text-sm font-medium text-zinc-300">
          {t("exercises.parsons.exerciseLabel")}
        </label>
        <select
          id={id("exercise")}
          value={selection}
          onChange={(event) => load(event.target.value, 0)}
          className="h-12 w-full rounded-xl border border-control bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white"
        >
          {questions.length > 0 && (
            <optgroup label={t("exercises.bank.fromClass")}>
              {questions.map((item) => <option key={item.id} value={BANK_PREFIX + item.id}>{bankOptionLabel(item.statement)}</option>)}
            </optgroup>
          )}
          {questions.length > 0 ? (
            <optgroup label={t("exercises.bank.examples")}>
              {PARSONS_EXERCISES.map((item, index) => <option key={item.id} value={String(index)}>{`${index + 1}. ${item.statement[language]}`}</option>)}
            </optgroup>
          ) : PARSONS_EXERCISES.map((item, index) => (
            <option key={item.id} value={String(index)}>{`${index + 1}. ${item.statement[language]}`}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-white/10 bg-surface-sunken p-4">
        <p className="font-[Poppins] text-base font-medium leading-relaxed text-white">{exercise.statement}</p>
        {exercise.concepts.length > 0 && <p className="mt-2 font-[Poppins] text-xs text-zinc-400">{t("exercises.truthTable.concepts", { list: conceptList(exercise.concepts) })}</p>}
      </div>

      <ParsonsBoard key={`${exercise.key}#${round}`} lines={lines} initial={initial} marks={marks} onChange={onBoardChange} onEvent={log.record} />

      <div className="flex flex-col gap-2 sm:flex-row">
        <AppButton type="button" onClick={verify} disabled={pending} aria-busy={pending || undefined}>
          {pending ? t("exercises.truthTable.checking") : t("exercises.truthTable.check")}
        </AppButton>
        <AppButton type="button" variant="secondary" disabled={pending} onClick={() => { log.record({ action: "reset" }); load(selection, round + 1); }}>
          <Shuffle aria-hidden="true" className="h-4 w-4" />
          {t("exercises.parsons.restart")}
        </AppButton>
      </div>

      {status.kind === "empty" && <p role="alert" className="font-[Poppins] text-sm text-amber-300">{t("exercises.parsons.emptySolution")}</p>}
      {status.kind === "error" && <p role="alert" className="font-[Poppins] text-sm text-red-300">{status.message}</p>}
      <div role="status" aria-live="polite" aria-atomic="true" className="space-y-1 font-[Poppins] text-sm">
        {summary && status.kind === "result" && (
          <>
            <p className={cn("font-semibold", summary.correct ? "text-emerald-300" : "text-white")}>
              {summary.correct ? t("exercises.parsons.resultCorrect") : t("exercises.parsons.resultIncorrect")}
            </p>
            {!summary.correct && (
              <ul className="list-disc space-y-0.5 pl-5 text-zinc-300">
                {summary.misplaced > 0 && <li>{t("exercises.parsons.misplaced", { count: summary.misplaced })}</li>}
                {summary.wrongIndent > 0 && <li>{t("exercises.parsons.wrongIndent", { count: summary.wrongIndent })}</li>}
                {summary.distractors > 0 && <li>{t("exercises.parsons.distractors", { count: summary.distractors })}</li>}
                {summary.missing > 0 && <li>{t("exercises.parsons.missing", { count: summary.missing })}</li>}
              </ul>
            )}
            <p className={status.offline ? "text-amber-300" : "text-zinc-400"}>
              {status.offline ? t("exercises.truthTable.offlineResult") : t("exercises.truthTable.attemptSaved", { number: status.attemptNumber ?? 0 })}
            </p>
          </>
        )}
      </div>

      {hint && <HintPanel {...hint} />}
    </div>
  );
}
