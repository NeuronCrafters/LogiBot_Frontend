import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { OptionalMark } from "@/shared/components/forms/OptionalMark";
import { Plus, Trash2 } from "lucide-react";
import { getLanguage, t, useLocale, type Language } from "@/i18n";
import { ContentLanguageSelect } from "@/i18n/ContentLanguage";
import { AppButton } from "@/components/AppUI";
import { cn } from "@/shared/lib/cn";
import { QUIZ_TOPICS } from "@/features/quiz/types";
import { checkFormula, checkTruthTableFormula, conceptsOf, truthTableCellCount, MAX_TABLE_CELLS, type TruthTableColumns } from "@/shared/logic/logicCore";
import {
  QUESTION_LIMITS,
  checkQuestion,
  parseParsonsSource,
  parsonsEditorSource,
  type QuestionContent,
  type QuestionInput,
  type QuestionIssue,
  type QuestionType,
} from "@/shared/logic/questionCore";
import { conceptList } from "@/features/exercises/lib/logicLabels";
import { fieldDomId, issueMessage, typeLabel } from "@/features/questions/lib/questionLabels";
import type { BankQuestion, QuestionPayload } from "@/features/questions/types";
import { useQuestionTypes } from "@/features/questions/hooks/useQuestionTypes";
import { AnswerKeyTable } from "@/features/questions/components/AnswerKeyTable";

const PRACTICE_TYPES: QuestionType[] = ["truth_table", "translation", "parsons"];

const LETTERS = ["A", "B", "C", "D"];
const PROPOSITIONS = ["p", "q", "r", "s", "t", "u"];
const inputClass = "w-full rounded-xl border border-control bg-neutral-950/60 px-3 py-2.5 font-[Poppins] text-sm text-white placeholder:text-zinc-600 aria-[invalid=true]:border-red-400";
const labelClass = "mb-1.5 block font-[Poppins] text-sm font-medium text-zinc-300";
const hintClass = "mt-1 font-[Poppins] text-xs leading-relaxed text-zinc-400";

interface QuestionFormProps {
  initial?: BankQuestion;
  disciplines: Array<{ id: string; name: string }>;
  saving: boolean;
  /** Issues returned by the API (same codes as the local check). */
  serverIssues: QuestionIssue[] | null;
  onSubmit: (payload: QuestionPayload) => void;
}

function contentOf<T extends QuestionContent["type"]>(initial: BankQuestion | undefined, type: T) {
  return initial && initial.content.type === type ? (initial.content as Extract<QuestionContent, { type: T }>) : null;
}

/** Logic concepts the API derived automatically (shown apart from the professor's own tags). */
function automaticConceptsOf(question?: BankQuestion): string[] {
  if (!question) return [];
  const source = question.content.type === "truth_table" ? question.content.formula : question.content.type === "translation" ? question.content.target : null;
  if (!source) return [];
  const check = checkFormula(source);
  return check.ok ? conceptsOf(check.formula) : [];
}

// Stable components (defined outside the form so inputs are not remounted on each keystroke).
function FieldErrors({ id, messages }: { id: string; messages: string[] }) {
  if (!messages.length) return null;
  return (
    <ul id={id} className="mt-1 space-y-0.5 font-[Poppins] text-xs text-red-300">
      {messages.map((message, index) => <li key={index}>{message}</li>)}
    </ul>
  );
}

function FormField({ id, label, hint, errors, optional, children }: { id: string; label: string; hint?: string; errors: string[]; optional?: boolean; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}{optional && <OptionalMark />}</label>
      {children}
      {hint && <p id={id + "-hint"} className={hintClass}>{hint}</p>}
      <FieldErrors id={id + "-error"} messages={errors} />
    </div>
  );
}

export function QuestionForm({ initial, disciplines, saving, serverIssues, onSubmit }: QuestionFormProps) {
  useLocale();
  const baseId = useId();
  const domId = (field: string) => fieldDomId(baseId, field);

  const [disciplineId, setDisciplineId] = useState(initial?.disciplineId ?? "");
  const [type, setType] = useState<QuestionType>(initial?.type ?? "quiz");
  const types = useQuestionTypes(initial?.type);
  const [language, setLanguage] = useState<Language>((initial?.language as Language) ?? getLanguage());
  const [statement, setStatement] = useState(initial?.statement ?? "");
  const [weight, setWeight] = useState(String(initial?.weight ?? 1));
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const automaticAtLoad = automaticConceptsOf(initial);
  const [conceptsText, setConceptsText] = useState((initial?.concepts ?? []).filter((concept) => automaticAtLoad.indexOf(concept) === -1).join(", "));

  const quiz = contentOf(initial, "quiz");
  const [options, setOptions] = useState<string[]>(quiz?.options ?? ["", ""]);
  const [correct, setCorrect] = useState<number | null>(quiz ? quiz.correct : null);
  const [formula, setFormula] = useState(contentOf(initial, "truth_table")?.formula ?? "");
  const [tableColumns, setTableColumns] = useState<TruthTableColumns>(contentOf(initial, "truth_table")?.columns ?? "all");
  const parsons = contentOf(initial, "parsons");
  const parsonsText = parsons ? parsonsEditorSource(parsons) : { solution: "", distractors: "", alternatives: "" };
  const [solution, setSolution] = useState(parsonsText.solution);
  const [distractors, setDistractors] = useState(parsonsText.distractors);
  const [alternatives, setAlternatives] = useState(parsonsText.alternatives);
  const translation = contentOf(initial, "translation");
  const [legend, setLegend] = useState(translation?.legend ?? [{ letter: "p", text: "" }, { letter: "q", text: "" }]);
  const [target, setTarget] = useState(translation?.target ?? "");
  const [criteria, setCriteria] = useState(contentOf(initial, "essay")?.criteria ?? "");
  const [practiceEnabled, setPracticeEnabled] = useState(initial?.practiceEnabled ?? false);
  const practiceAvailable = PRACTICE_TYPES.indexOf(type) !== -1;

  const [issues, setIssues] = useState<QuestionIssue[]>([]);
  const summary = useRef<HTMLDivElement>(null);
  const focusFirst = useRef(false);

  // Default discipline once the list arrives.
  useEffect(() => {
    if (!disciplineId && disciplines.length) setDisciplineId(disciplines[0].id);
  }, [disciplineId, disciplines]);

  // API issues use the same codes and fields as the local check.
  useEffect(() => {
    if (!serverIssues) return;
    setIssues(serverIssues);
    focusFirst.current = true;
  }, [serverIssues]);

  // After a failed submit, move focus to the first invalid field (or the summary).
  useEffect(() => {
    if (!focusFirst.current || issues.length === 0) return;
    focusFirst.current = false;
    const element = document.getElementById(domId(issues[0].field)) ?? summary.current;
    element?.focus();
  });

  const conceptsInput = conceptsText.split(",").map((item) => item.trim()).filter(Boolean);
  const content = useMemo(() => {
    if (type === "quiz") return { options, correct };
    if (type === "truth_table") return { formula, columns: tableColumns };
    if (type === "parsons") return { solution, distractors, alternatives };
    if (type === "translation") return { legend, target };
    return { criteria };
  }, [type, options, correct, formula, tableColumns, solution, distractors, alternatives, legend, target, criteria]);

  const automaticConcepts = useMemo(() => {
    if (type === "truth_table") {
      const check = checkTruthTableFormula(formula);
      return check.ok ? conceptsOf(check.formula) : [];
    }
    if (type === "translation") {
      const check = checkFormula(target, { allowedPropositions: legend.map((entry) => entry.letter.trim()).filter(Boolean) });
      return check.ok ? conceptsOf(check.formula) : [];
    }
    return [];
  }, [type, formula, target, legend]);

  const formulaPreview = useMemo(() => {
    const source = type === "truth_table" ? formula : type === "translation" ? target : "";
    if (!source.trim()) return null;
    const check = type === "truth_table" ? checkTruthTableFormula(source, tableColumns) : checkFormula(source, { allowedPropositions: legend.map((entry) => entry.letter.trim()).filter(Boolean) });
    return check.ok ? check.normalized : null;
  }, [type, formula, target, legend, tableColumns]);

  /** Size of the table for the chosen columns, to help choose between every step and the final column. */
  const tableSize = useMemo(() => {
    if (type !== "truth_table" || !formula.trim()) return null;
    const check = checkFormula(formula, { requireOperator: true });
    if (check.ok === false) return null;
    return { rows: Math.pow(2, check.variables.length), all: truthTableCellCount(check.formula, "all"), final: truthTableCellCount(check.formula, "final") };
  }, [type, formula]);

  const parsonsPreview = useMemo(() => (type === "parsons" ? parseParsonsSource(solution, "content.solution").lines : []), [type, solution]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const input: QuestionInput = {
      type,
      statement,
      weight: Number(weight.replace(",", ".")),
      subject: subject || null,
      concepts: conceptsInput,
      language,
      content,
    };
    const found: QuestionIssue[] = [];
    if (!disciplineId) found.push({ field: "disciplineId", code: "REQUIRED", params: {} });
    const result = checkQuestion(input, (kind, index) => `${kind}-${index}`);
    if (result.ok === false) found.push(...result.issues);
    setIssues(found);
    if (found.length) {
      focusFirst.current = true;
      return;
    }
    onSubmit({ disciplineId, type, statement, weight: input.weight as number, subject: subject || null, concepts: conceptsInput, language, content, practiceEnabled: practiceAvailable && practiceEnabled });
  }

  const exact = (field: string) => issues.filter((issue) => issue.field === field);
  const errorId = (field: string) => domId(field) + "-error";
  const aria = (field: string, hint?: string) => ({
    id: domId(field),
    "aria-invalid": exact(field).length > 0 ? true : undefined,
    "aria-describedby": [hint, exact(field).length ? errorId(field) : null].filter(Boolean).join(" ") || undefined,
  });
  const messages = (field: string) => exact(field).map(issueMessage);

  const nextLetter = PROPOSITIONS.find((letter) => !legend.some((entry) => entry.letter === letter)) ?? "";

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {issues.length > 0 && (
        <div ref={summary} tabIndex={-1} role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 font-[Poppins] text-sm text-red-200">
          {t("questions.editor.issuesSummary", { count: issues.length })}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <FormField id={domId("disciplineId")} errors={messages("disciplineId")} label={t("questions.editor.discipline")}>
          <select {...aria("disciplineId")} value={disciplineId} onChange={(event) => setDisciplineId(event.target.value)} className={cn(inputClass, "h-12")}>
            {!disciplineId && <option value="">{t("common.selecione")}</option>}
            {disciplines.map((discipline) => <option key={discipline.id} value={discipline.id}>{discipline.name}</option>)}
          </select>
        </FormField>
        <FormField id={domId("type")} errors={messages("type")} label={t("questions.editor.type")} hint={initial ? t("questions.editor.typeLocked") : undefined}>
          <select {...aria("type", initial ? domId("type") + "-hint" : undefined)} value={type} disabled={!!initial}
            onChange={(event) => { setType(event.target.value as QuestionType); setIssues([]); }} className={cn(inputClass, "h-12 disabled:opacity-70")}>
            {types.map((item) => <option key={item} value={item}>{typeLabel(item)}</option>)}
          </select>
        </FormField>
      </div>

      <ContentLanguageSelect value={language} onChange={setLanguage} />

      <FormField id={domId("statement")} errors={messages("statement")} label={type === "translation" ? t("questions.editor.sentence") : t("questions.editor.statement")}>
        <textarea {...aria("statement")} value={statement} onChange={(event) => setStatement(event.target.value)} rows={3} maxLength={QUESTION_LIMITS.statement + 200} className={inputClass} />
      </FormField>

      {type === "quiz" && (
        <fieldset className="space-y-3">
          <legend className={labelClass}>{t("questions.quiz.options")}</legend>
          <p id={domId("content.correct") + "-hint"} className={hintClass}>{t("questions.quiz.correctLegend")}</p>
          {options.map((option, index) => (
            <div key={index}>
              <div className="flex items-start gap-2">
                <label className="flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-2 font-[Poppins] text-xs text-zinc-300">
                  <input type="radio" name={baseId + "-correct"} checked={correct === index} onChange={() => setCorrect(index)}
                    aria-label={t("questions.quiz.correctOption", { letter: LETTERS[index] })} aria-describedby={domId("content.correct") + "-hint"} className="h-4 w-4 accent-blue-500" />
                  <span aria-hidden="true">{t("questions.quiz.correct")}</span>
                </label>
                <div className="min-w-0 flex-1">
                  <label htmlFor={domId("content.options." + index)} className="sr-only">{t("questions.quiz.option", { letter: LETTERS[index] })}</label>
                  <input {...aria("content.options." + index)} value={option} placeholder={t("questions.quiz.option", { letter: LETTERS[index] })}
                    onChange={(event) => setOptions(options.map((item, i) => (i === index ? event.target.value : item)))} className={cn(inputClass, "h-11")} />
                </div>
                <button type="button" disabled={options.length <= QUESTION_LIMITS.minOptions}
                  aria-label={t("questions.quiz.removeOption", { letter: LETTERS[index] })}
                  onClick={() => { setOptions(options.filter((_, i) => i !== index)); setCorrect(correct === null ? null : correct === index ? null : correct > index ? correct - 1 : correct); }}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white disabled:opacity-40">
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
              <FieldErrors id={errorId("content.options." + index)} messages={messages("content.options." + index)} />
            </div>
          ))}
          <FieldErrors id={errorId("content.options")} messages={messages("content.options")} />
          <FieldErrors id={errorId("content.correct")} messages={messages("content.correct")} />
          <AppButton type="button" variant="secondary" size="sm" className="h-11 md:h-9" disabled={options.length >= QUESTION_LIMITS.maxOptions} onClick={() => setOptions([...options, ""])}>
            <Plus aria-hidden="true" className="h-4 w-4" />
            {t("questions.quiz.addOption")}
          </AppButton>
        </fieldset>
      )}

      {type === "truth_table" && (
        <FormField id={domId("content.formula")} errors={messages("content.formula")} label={t("questions.truth.formula")} hint={t("questions.truth.formulaHint")}>
          <input {...aria("content.formula", domId("content.formula") + "-hint")} value={formula} onChange={(event) => setFormula(event.target.value)}
            autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder={t("exercises.truthTable.customPlaceholder")} className={cn(inputClass, "h-12 font-mono")} />
          {formulaPreview && <p className="mt-1 font-mono text-sm text-zinc-300">{t("exercises.translation.preview", { formula: formulaPreview })}</p>}
        </FormField>
      )}
      {type === "truth_table" && (
        <fieldset className="space-y-2">
          <legend className="font-[Poppins] text-sm font-medium text-zinc-200">{t("questions.truth.columns")}</legend>
          {(["all", "final"] as const).map((mode) => (
            <label key={mode} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-surface-sunken px-3 py-2 font-[Poppins] text-sm text-zinc-200">
              <input type="radio" name={domId("columns")} value={mode} checked={tableColumns === mode} onChange={() => setTableColumns(mode)} className="mt-1 h-4 w-4 shrink-0 accent-blue-500" />
              <span>
                <span className="font-medium text-white">{t(`questions.truth.columns.${mode}`)}</span>
                {tableSize && (
                  <span className={cn("mt-0.5 block text-xs", mode === "all" && tableSize.all > MAX_TABLE_CELLS ? "text-amber-300" : "text-zinc-400")}>
                    {mode === "all" && tableSize.all > MAX_TABLE_CELLS
                      ? t("questions.truth.tooLargeForAll", { cells: tableSize.all, max: MAX_TABLE_CELLS })
                      : t("questions.truth.cells", { rows: tableSize.rows, cells: mode === "all" ? tableSize.all : tableSize.final })}
                  </span>
                )}
              </span>
            </label>
          ))}
          {messages("content.columns").map((message) => <p key={message} role="alert" className="font-[Poppins] text-sm text-red-300">{message}</p>)}
        </fieldset>
      )}
      {type === "truth_table" && formulaPreview && <AnswerKeyTable formula={formulaPreview} columns={tableColumns} />}

      {type === "translation" && (
        <>
          <fieldset className="space-y-2">
            <legend className={labelClass}>{t("questions.translation.legend")}</legend>
            {legend.map((entry, index) => (
              <div key={index}>
                <div className="flex items-start gap-2">
                  <div className="w-16 shrink-0">
                    <label htmlFor={domId(`content.legend.${index}.letter`)} className="sr-only">{t("questions.translation.letterLabel", { index: index + 1 })}</label>
                    <input {...aria(`content.legend.${index}.letter`)} value={entry.letter} maxLength={1} autoCapitalize="off" spellCheck={false}
                      onChange={(event) => setLegend(legend.map((item, i) => (i === index ? { ...item, letter: event.target.value } : item)))}
                      className={cn(inputClass, "h-11 text-center font-mono")} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <label htmlFor={domId(`content.legend.${index}.text`)} className="sr-only">{t("questions.translation.textLabel", { index: index + 1 })}</label>
                    <input {...aria(`content.legend.${index}.text`)} value={entry.text} placeholder={t("questions.translation.text")}
                      onChange={(event) => setLegend(legend.map((item, i) => (i === index ? { ...item, text: event.target.value } : item)))} className={cn(inputClass, "h-11")} />
                  </div>
                  <button type="button" disabled={legend.length <= QUESTION_LIMITS.minLegend} aria-label={t("questions.translation.removeLegend", { index: index + 1 })}
                    onClick={() => setLegend(legend.filter((_, i) => i !== index))}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white disabled:opacity-40">
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
                <FieldErrors id={errorId(`content.legend.${index}.letter`)} messages={messages(`content.legend.${index}.letter`)} />
                <FieldErrors id={errorId(`content.legend.${index}.text`)} messages={messages(`content.legend.${index}.text`)} />
              </div>
            ))}
            <FieldErrors id={errorId("content.legend")} messages={messages("content.legend")} />
            <AppButton type="button" variant="secondary" size="sm" className="h-11 md:h-9" disabled={legend.length >= QUESTION_LIMITS.maxLegend || !nextLetter}
              onClick={() => setLegend([...legend, { letter: nextLetter, text: "" }])}>
              <Plus aria-hidden="true" className="h-4 w-4" />
              {t("questions.translation.addLegend")}
            </AppButton>
          </fieldset>
          <FormField id={domId("content.target")} errors={messages("content.target")} label={t("questions.translation.target")} hint={t("questions.translation.targetHint")}>
            <input {...aria("content.target", domId("content.target") + "-hint")} value={target} onChange={(event) => setTarget(event.target.value)}
              autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder={t("exercises.translation.answerPlaceholder")} className={cn(inputClass, "h-12 font-mono")} />
            {formulaPreview && <p className="mt-1 font-mono text-sm text-zinc-300">{t("exercises.translation.preview", { formula: formulaPreview })}</p>}
          </FormField>
          {formulaPreview && <AnswerKeyTable formula={formulaPreview} note={t("questions.answerKey.translationNote")} />}
        </>
      )}

      {type === "parsons" && (
        <>
          <FormField id={domId("content.solution")} errors={messages("content.solution")} label={t("questions.parsons.solution")} hint={t("questions.parsons.solutionHint")}>
            <textarea {...aria("content.solution", domId("content.solution") + "-hint")} value={solution} onChange={(event) => setSolution(event.target.value)}
              rows={7} spellCheck={false} autoCapitalize="off" className={cn(inputClass, "font-mono")} />
          </FormField>
          {parsonsPreview.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-surface-sunken p-3">
              <h3 className="mb-2 font-[Poppins] text-xs font-semibold text-zinc-400">{t("questions.parsons.preview")}</h3>
              <p className="mb-2 font-[Poppins] text-xs text-zinc-400">{t("questions.answerKey.parsonsNote")}</p>
              <ol className="space-y-1">
                {parsonsPreview.map((line) => (
                  <li key={line.line} style={{ marginLeft: line.indent * 24 }} className="rounded-md border border-white/10 bg-neutral-950/60 px-2 py-1 font-mono text-sm text-white">
                    <span aria-hidden="true">{line.text}</span>
                    <span className="sr-only">{t("questions.parsons.previewLine", { line: line.line, indent: line.indent, text: line.text })}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <FormField id={domId("content.distractors")} errors={messages("content.distractors")} label={t("questions.parsons.distractors")} optional hint={t("questions.parsons.distractorsHint")}>
            <textarea {...aria("content.distractors", domId("content.distractors") + "-hint")} value={distractors} onChange={(event) => setDistractors(event.target.value)}
              rows={3} spellCheck={false} autoCapitalize="off" className={cn(inputClass, "font-mono")} />
          </FormField>
          <FormField id={domId("content.alternatives")} errors={messages("content.alternatives")} label={t("questions.parsons.alternatives")} optional hint={t("questions.parsons.alternativesHint")}>
            <textarea {...aria("content.alternatives", domId("content.alternatives") + "-hint")} value={alternatives} onChange={(event) => setAlternatives(event.target.value)}
              rows={4} spellCheck={false} autoCapitalize="off" className={cn(inputClass, "font-mono")} />
          </FormField>
        </>
      )}

      {type === "essay" && (
        <FormField id={domId("content.criteria")} errors={messages("content.criteria")} label={t("questions.essay.criteria")} hint={t("questions.essay.criteriaHint")}>
          <textarea {...aria("content.criteria", domId("content.criteria") + "-hint")} value={criteria} onChange={(event) => setCriteria(event.target.value)} rows={4} className={inputClass} />
        </FormField>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <FormField id={domId("weight")} errors={messages("weight")} label={t("questions.editor.weight")} hint={t("questions.editor.weightHint")}>
          <input {...aria("weight", domId("weight") + "-hint")} type="number" inputMode="decimal" min={QUESTION_LIMITS.minWeight} max={QUESTION_LIMITS.maxWeight} step={0.5}
            value={weight} onChange={(event) => setWeight(event.target.value)} className={cn(inputClass, "h-12")} />
        </FormField>
        <FormField id={domId("subject")} errors={messages("subject")} label={t("questions.editor.subject")} optional>
          <select {...aria("subject")} value={subject} onChange={(event) => setSubject(event.target.value)} className={cn(inputClass, "h-12")}>
            <option value="">{t("questions.editor.subjectNone")}</option>
            {QUIZ_TOPICS.map((topic) => <option key={topic.value} value={topic.value}>{topic.label}</option>)}
            {subject && !QUIZ_TOPICS.some((topic) => topic.value === subject) && <option value={subject}>{subject}</option>}
          </select>
        </FormField>
      </div>
      <div>
        <FormField id={domId("concepts")} errors={messages("concepts")} label={t("questions.editor.concepts")} optional>
          <input {...aria("concepts", automaticConcepts.length ? domId("concepts") + "-auto" : undefined)} value={conceptsText} onChange={(event) => setConceptsText(event.target.value)} className={cn(inputClass, "h-12")} />
          {automaticConcepts.length > 0 && (
            <p id={domId("concepts") + "-auto"} className={hintClass}>{t("questions.editor.conceptsAuto", { list: conceptList(automaticConcepts) })}</p>
          )}
        </FormField>
      </div>

      {practiceAvailable && (
        <div className="rounded-xl border border-white/10 bg-surface-sunken p-3">
          <label className="flex min-h-11 cursor-pointer items-start gap-3 font-[Poppins] text-sm text-white">
            <input type="checkbox" checked={practiceEnabled} onChange={(event) => setPracticeEnabled(event.target.checked)}
              aria-describedby={domId("practice") + "-hint"} className="mt-0.5 h-5 w-5 shrink-0 accent-blue-500" />
            <span className="font-medium">{t("questions.practice.label")}</span>
          </label>
          <p id={domId("practice") + "-hint"} className={cn(hintClass, "pl-8")}>{t("questions.practice.hint")}</p>
        </div>
      )}

      <AppButton type="submit" disabled={saving} aria-busy={saving || undefined} className="w-full sm:w-auto">
        {saving ? t("questions.editor.saving") : t("questions.editor.save")}
      </AppButton>
    </form>
  );
}
