import { useId, useMemo, useRef, useState, type FormEvent } from "react";
import { getLanguage, t, useLocale } from "@/i18n";
import { AppButton } from "@/components/AppUI";
import { cn } from "@/shared/lib/cn";
import { apiError } from "@/shared/lib/apiError";
import { checkFormula, formatFormula, gradeTranslation, parseFormula, type Assignment, type LogicIssue } from "@/shared/logic/logicCore";
import { TRANSLATION_EXERCISES, type ContentLanguage } from "@/shared/logic/exerciseCatalog";
import { exercisesApi } from "@/features/exercises/api/exercisesApi";
import { HintPanel, type HintTarget } from "@/features/exercises/components/HintPanel";
import { FormulaInput } from "@/features/exercises/components/FormulaInput";
import { logicIssueMessage, truthValueLabel, truthValueSpoken } from "@/features/exercises/lib/logicLabels";
import { isOfflineError, useAttemptLog } from "@/features/exercises/lib/attemptLog";
import { usePracticeBank } from "@/features/exercises/hooks/usePracticeBank";
import { BANK_PREFIX, bankOptionLabel } from "@/features/exercises/lib/practiceBank";

interface Outcome {
  correct: boolean;
  equivalentTo?: string;
  counterexample?: Assignment;
  answerValue?: boolean;
  expectedValue?: boolean;
  attemptNumber: number | null;
  offline: boolean;
}
type Status = { kind: "idle" } | { kind: "invalid"; issue: LogicIssue } | { kind: "error"; message: string } | { kind: "result"; outcome: Outcome };


/** `embedded`: the page header already shows the title, so the component does not repeat it. */
export function TranslationExercise({ embedded = false }: { embedded?: boolean } = {}) {
  useLocale();
  const language = getLanguage() as ContentLanguage;
  const baseId = useId();
  const id = (suffix: string) => `${baseId}-${suffix}`;
  const log = useAttemptLog();

  const bank = usePracticeBank("translation");
  const [selection, setSelection] = useState("0");
  // Built-in example (graded offline too) or professor question (graded only by the server).
  const exercise = useMemo(() => {
    const question = selection.startsWith(BANK_PREFIX) ? bank.find((item) => BANK_PREFIX + item.id === selection) : undefined;
    if (question) return { key: selection, bankId: question.id, sentence: question.statement, legend: question.content.legend, catalog: null };
    const item = TRANSLATION_EXERCISES[Number(selection)] ?? TRANSLATION_EXERCISES[0];
    return { key: item.id, bankId: undefined, sentence: item.sentence[language], legend: item.legend.map((entry) => ({ letter: entry.letter, text: entry.text[language] })), catalog: item };
  }, [selection, bank, language]);
  const letters = useMemo(() => exercise.legend.map((entry) => entry.letter), [exercise]);
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, setPending] = useState(false);
  const [hint, setHint] = useState<HintTarget | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const legend = exercise.legend;

  function changeAnswer(value: string) {
    setAnswer(value);
    setStatus((current) => (current.kind === "result" ? current : { kind: "idle" }));
  }

  function selectExercise(value: string) {
    setSelection(value);
    setAnswer("");
    setStatus({ kind: "idle" });
    setHint(null);
    log.restart();
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    const check = checkFormula(answer, { allowedPropositions: letters });
    if (check.ok === false) {
      setStatus({ kind: "invalid", issue: check.error });
      input.current?.focus();
      return;
    }
    setPending(true);
    try {
      const response = await exercisesApi.submitTranslationAttempt({
        type: "translation", ...(exercise.bankId ? { bankQuestionId: exercise.bankId } : { exerciseId: exercise.key }), answer, hintsUsed: 0, ...log.snapshot(),
      });
      setStatus({ kind: "result", outcome: { ...response, attemptNumber: response.attemptNumber, offline: false } });
      setHint({ exerciseId: response.exerciseId, attemptId: response.correct ? null : response.attemptId, correct: response.correct });
      log.restart();
    } catch (error) {
      if (!isOfflineError(error) || !exercise.catalog) {
        // Professor questions keep their answer key on the server: no offline grading.
        setStatus({ kind: "error", message: isOfflineError(error) ? t("exercises.bank.needsConnection") : apiError(error) });
        return;
      }
      const target = exercise.catalog.target;
      const local = gradeTranslation(target, letters, answer);
      const outcome: Outcome = { correct: local.status === "correct", attemptNumber: null, offline: true };
      if (local.status === "correct" && !local.identicalToTarget) outcome.equivalentTo = formatFormula(parseFormula(target));
      if (local.status === "incorrect") Object.assign(outcome, { counterexample: local.counterexample, answerValue: local.answerValue, expectedValue: local.expectedValue });
      setStatus({ kind: "result", outcome });
      setHint(outcome.correct ? null : { exerciseId: null, attemptId: null, offline: true });
    } finally {
      setPending(false);
    }
  }

  const outcome = status.kind === "result" ? status.outcome : null;

  return (
    <div className="space-y-5">
      <div>
        {!embedded && <h2 className="font-[Poppins] text-lg font-semibold text-white">{t("exercises.translation.title")}</h2>}
        <p className="mt-1 font-[Poppins] text-sm leading-relaxed text-zinc-400">{t("exercises.translation.instructions")}</p>
      </div>

      <div>
        <label htmlFor={id("exercise")} className="mb-1.5 block font-[Poppins] text-sm font-medium text-zinc-300">
          {t("exercises.translation.exerciseLabel")}
        </label>
        <select
          id={id("exercise")}
          value={selection}
          onChange={(event) => selectExercise(event.target.value)}
          className="h-12 w-full rounded-xl border border-control bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white"
        >
          {bank.length > 0 && (
            <optgroup label={t("exercises.bank.fromClass")}>
              {bank.map((item) => <option key={item.id} value={BANK_PREFIX + item.id}>{bankOptionLabel(item.statement)}</option>)}
            </optgroup>
          )}
          {bank.length > 0 ? (
            <optgroup label={t("exercises.bank.examples")}>
              {TRANSLATION_EXERCISES.map((item, index) => <option key={item.id} value={String(index)}>{`${index + 1}. ${item.sentence[language]}`}</option>)}
            </optgroup>
          ) : TRANSLATION_EXERCISES.map((item, index) => (
            <option key={item.id} value={String(index)}>{`${index + 1}. ${item.sentence[language]}`}</option>
          ))}
        </select>
      </div>

      <figure className="rounded-xl border border-white/10 bg-surface-sunken p-4">
        <blockquote className="font-[Poppins] text-base font-medium leading-relaxed text-white">{exercise.sentence}</blockquote>
        <figcaption className="mt-3">
          <h3 className="font-[Poppins] text-xs font-semibold uppercase tracking-wide text-zinc-400">{t("exercises.translation.legendTitle")}</h3>
          <dl className="mt-2 grid gap-1 sm:grid-cols-2">
            {exercise.legend.map((entry) => (
              <div key={entry.letter} className="flex gap-2 font-[Poppins] text-sm">
                <dt className="font-mono font-semibold text-white">{entry.letter}</dt>
                <dd className="text-zinc-300">{entry.text}</dd>
              </div>
            ))}
          </dl>
        </figcaption>
      </figure>

      <form onSubmit={verify} noValidate className="space-y-3">
        <FormulaInput
          key={exercise.key}
          ref={input}
          legend={legend}
          value={answer}
          onChange={changeAnswer}
          invalid={status.kind === "invalid"}
          describedBy={status.kind === "invalid" ? id("error") : undefined}
          onEvent={log.record}
        />

        {status.kind === "invalid" && (
          <p id={id("error")} role="alert" className="font-[Poppins] text-sm text-red-300">{logicIssueMessage(status.issue)}</p>
        )}
        {status.kind === "error" && <p role="alert" className="font-[Poppins] text-sm text-red-300">{status.message}</p>}

        <AppButton type="submit" disabled={pending} aria-busy={pending || undefined} className="w-full sm:w-auto">
          {pending ? t("exercises.truthTable.checking") : t("exercises.truthTable.check")}
        </AppButton>
      </form>

      <div role="status" aria-live="polite" aria-atomic="true" className="space-y-2 font-[Poppins] text-sm">
        {outcome && (
          <>
            <p className={cn("font-semibold", outcome.correct ? "text-emerald-300" : "text-white")}>
              {outcome.correct ? t("exercises.translation.resultCorrect") : t("exercises.translation.resultIncorrect")}
            </p>
            {outcome.correct && outcome.equivalentTo && (
              <p className="text-zinc-300">{t("exercises.translation.resultEquivalent", { formula: outcome.equivalentTo })}</p>
            )}
            {!outcome.correct && outcome.counterexample && (
              <div className="space-y-2">
                <p className="text-zinc-300">
                  {t("exercises.translation.counterexampleExplain", {
                    expected: truthValueSpoken(outcome.expectedValue),
                    answer: truthValueSpoken(outcome.answerValue),
                  })}
                </p>
                <div role="region" aria-labelledby={id("counter-caption")} tabIndex={0} className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-max min-w-full border-collapse text-center font-mono text-sm">
                    <caption id={id("counter-caption")} className="sr-only">{t("exercises.translation.counterexampleCaption")}</caption>
                    <thead>
                      <tr>
                        {letters.map((letter) => <th key={letter} scope="col" className="bg-surface-raised px-3 py-2 text-zinc-300">{letter}</th>)}
                        <th scope="col" className="bg-surface-raised px-3 py-2 font-[Poppins] text-white">{t("exercises.translation.sentenceColumn")}</th>
                        <th scope="col" className="bg-surface-raised px-3 py-2 font-[Poppins] text-white">{t("exercises.translation.answerColumn")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {letters.map((letter) => (
                          <td key={letter} className="px-3 py-2 text-zinc-300">
                            <span aria-hidden="true">{truthValueLabel(outcome.counterexample?.[letter])}</span>
                            <span className="sr-only">{truthValueSpoken(outcome.counterexample?.[letter])}</span>
                          </td>
                        ))}
                        <td className="px-3 py-2 text-white">
                          <span aria-hidden="true">{truthValueLabel(outcome.expectedValue)}</span>
                          <span className="sr-only">{truthValueSpoken(outcome.expectedValue)}</span>
                        </td>
                        <td className="px-3 py-2 text-red-300">
                          <span aria-hidden="true">{truthValueLabel(outcome.answerValue)}</span>
                          <span className="sr-only">{truthValueSpoken(outcome.answerValue)}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <p className={outcome.offline ? "text-amber-300" : "text-zinc-400"}>
              {outcome.offline
                ? t("exercises.truthTable.offlineResult")
                : t("exercises.truthTable.attemptSaved", { number: outcome.attemptNumber ?? 0 })}
            </p>
          </>
        )}
      </div>

      {hint && <HintPanel {...hint} />}
    </div>
  );
}
