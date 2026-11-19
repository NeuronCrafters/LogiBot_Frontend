import { useId, useState } from "react";
import { number, t, useLocale } from "@/i18n";
import { TruthTableBoard } from "@/features/exercises/components/TruthTableBoard";
import { ParsonsBoard } from "@/features/exercises/components/ParsonsBoard";
import { FormulaInput } from "@/features/exercises/components/FormulaInput";
import { truthTableCellKey } from "@/shared/logic/logicCore";
import type { ExamAnswer, StudentQuestion } from "@/features/exams/types";
import { MAX_ESSAY_LENGTH } from "@/features/exams/lib/examAnswers";


interface ExamQuestionViewProps {
  question: StudentQuestion;
  index: number;
  total: number;
  answer: ExamAnswer | undefined;
  onAnswer: (answer: ExamAnswer) => void;
  onEvent: (action: string) => void;
}

/** One exam question with the same components as the workbench, without any feedback. */
export function ExamQuestionView({ question, index, total, answer, onAnswer, onEvent }: ExamQuestionViewProps) {
  useLocale();
  const id = useId();
  const headingId = `${id}-heading`;

  // The Parsons board keeps its own state after mounting: only the saved answer at load matters.
  const [parsonsInitial] = useState(() => {
    if (question.type !== "parsons") return null;
    const solution = answer && "solution" in answer ? answer.solution : [];
    const used = solution.map((item) => item.id);
    return { bank: question.content.lines.map((line) => line.id).filter((lineId) => used.indexOf(lineId) === -1), solution };
  });

  return (
    <article id={`question-${index + 1}`} aria-labelledby={headingId} tabIndex={-1} className="scroll-mt-24 space-y-4 rounded-2xl border border-white/10 bg-surface p-4 shadow-md shadow-black/10 sm:p-5">
      <div>
        <h2 id={headingId} className="font-[Poppins] text-sm font-semibold text-blue-300">
          {t("exams.take.question", { index: index + 1, total })}
          <span className="ml-2 font-normal text-zinc-400">{t("exams.take.weight", { weight: number(question.weight) })}</span>
        </h2>
        <p lang={question.language} className="mt-2 whitespace-pre-wrap break-words font-[Poppins] text-base leading-relaxed text-white">{question.statement}</p>
      </div>

      {question.type === "quiz" && (
        <fieldset>
          <legend className="sr-only">{t("exams.take.choices")}</legend>
          <div className="space-y-2">
            {question.content.options.map((option, optionIndex) => {
              const checked = !!answer && "choice" in answer && answer.choice === optionIndex;
              return (
                <label key={optionIndex} className="flex min-h-[2.75rem] cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-neutral-950/40 p-3 font-[Poppins] text-sm text-zinc-100 hover:bg-white/5 has-[:checked]:border-blue-400/60">
                  <input type="radio" name={`${id}-choice`} checked={checked} className="mt-0.5 h-5 w-5 shrink-0 accent-blue-500"
                    onChange={() => { onAnswer({ choice: optionIndex }); onEvent("choose"); }} />
                  <span lang={question.language} className="break-words">{option}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {question.type === "truth_table" && (
        <>
          <p className="break-words font-mono text-lg text-white">{question.content.formula}</p>
          <TruthTableBoard
            formula={question.content.formula}
            columns={question.content.columns ?? "all"}
            cells={answer && "cells" in answer ? answer.cells : {}}
            onCellChange={(row, column, value) => {
              const cells = { ...(answer && "cells" in answer ? answer.cells : {}) };
              const key = truthTableCellKey(row, column);
              if (value === null) delete cells[key]; else cells[key] = value;
              onAnswer({ cells });
              onEvent("mark");
            }}
          />
        </>
      )}

      {question.type === "translation" && (
        <>
          <div className="rounded-xl border border-white/10 bg-surface-sunken p-3">
            <h3 className="font-[Poppins] text-xs font-semibold uppercase tracking-wide text-zinc-400">{t("exams.take.legend")}</h3>
            <dl className="mt-2 grid gap-1 sm:grid-cols-2">
              {question.content.legend.map((entry) => (
                <div key={entry.letter} className="flex gap-2 font-[Poppins] text-sm">
                  <dt className="font-mono font-semibold text-white">{entry.letter}</dt>
                  <dd lang={question.language} className="text-zinc-300">{entry.text}</dd>
                </div>
              ))}
            </dl>
          </div>
          <FormulaInput legend={question.content.legend} value={answer && "text" in answer ? answer.text : ""}
            onChange={(text) => onAnswer({ text })} onEvent={(event) => onEvent(event.action)} />
        </>
      )}

      {question.type === "parsons" && parsonsInitial && (
        <ParsonsBoard
          lines={question.content.lines}
          initial={parsonsInitial}
          onChange={(value) => onAnswer({ solution: value.solution })}
          onEvent={(event) => onEvent(event.action)}
        />
      )}

      {question.type === "essay" && (
        <div>
          <p id={`${id}-notice`} className="mb-2 rounded-lg border border-amber-400/40 bg-amber-500/10 p-3 font-[Poppins] text-sm text-amber-200">{t("exams.take.essayNotice")}</p>
          <label htmlFor={`${id}-essay`} className="mb-1.5 block font-[Poppins] text-sm font-medium text-zinc-300">{t("exams.take.essayLabel")}</label>
          <textarea
            id={`${id}-essay`}
            value={answer && "text" in answer ? answer.text : ""}
            maxLength={MAX_ESSAY_LENGTH}
            rows={8}
            aria-describedby={`${id}-notice ${id}-count`}
            onChange={(event) => { onAnswer({ text: event.target.value }); onEvent("type"); }}
            className="w-full rounded-xl border border-control bg-neutral-950/60 px-3 py-2.5 font-[Poppins] text-sm leading-relaxed text-white"
          />
          <p id={`${id}-count`} className="mt-1 text-right font-[Poppins] text-xs text-zinc-400">
            {t("exams.take.essayCount", { count: (answer && "text" in answer ? answer.text : "").length, max: MAX_ESSAY_LENGTH })}
          </p>
        </div>
      )}
    </article>
  );
}
