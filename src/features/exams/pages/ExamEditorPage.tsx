import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { OptionalMark } from "@/shared/components/forms/OptionalMark";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowLeft, ArrowUp, ClipboardList, Trash2 } from "lucide-react";
import { number, t, useLocale } from "@/i18n";
import { AppButton, PageHeader, Panel } from "@/components/AppUI";
import { cn } from "@/shared/lib/cn";
import { toast } from "@/shared/lib/toast";
import { apiError } from "@/shared/lib/apiError";
import { questionBankApi } from "@/features/questions/api/questionBankApi";
import { useManagedDisciplines } from "@/features/questions/hooks/useManagedDisciplines";
import { typeLabel } from "@/features/questions/lib/questionLabels";
import { examsApi } from "@/features/exams/api/examsApi";
import { useDisciplineClasses } from "@/features/exams/hooks/useDisciplineClasses";
import { examIssueMessage, fromLocalInput, toLocalInput } from "@/features/exams/lib/examLabels";
import type { ExamIssue, ExamPayload, ManagedExam } from "@/features/exams/types";

const inputClass = "w-full rounded-xl border border-control bg-neutral-950/60 px-3 py-2.5 font-[Poppins] text-sm text-white aria-[invalid=true]:border-red-400";
const labelClass = "mb-1.5 block font-[Poppins] text-sm font-medium text-zinc-300";
const hintClass = "mt-1 font-[Poppins] text-xs leading-relaxed text-zinc-400";
const iconButton = "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white disabled:opacity-40 md:h-9 md:w-9";

function Field({ id, label, hint, errors, optional, children }: { id: string; label: string; hint?: string; errors: string[]; optional?: boolean; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}{optional && <OptionalMark />}</label>
      {children}
      {hint && <p id={id + "-hint"} className={hintClass}>{hint}</p>}
      {errors.length > 0 && <ul id={id + "-error"} className="mt-1 font-[Poppins] text-xs text-red-300">{errors.map((message, index) => <li key={index}>{message}</li>)}</ul>}
    </div>
  );
}

function ExamForm({ initial, saving, serverIssues, onSubmit }: { initial?: ManagedExam; saving: boolean; serverIssues: ExamIssue[] | null; onSubmit: (payload: ExamPayload) => void }) {
  useLocale();
  const baseId = useId();
  const domId = (field: string) => `${baseId}-${field}`;
  const { disciplines } = useManagedDisciplines();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [disciplineId, setDisciplineId] = useState(initial?.disciplineId ?? "");
  const [classId, setClassId] = useState(initial?.classId ?? "");
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [opensAt, setOpensAt] = useState(toLocalInput(initial?.opensAt ?? null));
  const [closesAt, setClosesAt] = useState(toLocalInput(initial?.closesAt ?? null));
  const [timeLimit, setTimeLimit] = useState(initial?.timeLimitMinutes ? String(initial.timeLimitMinutes) : "");
  const [shuffle, setShuffle] = useState(initial?.shuffle ?? false);
  const [selected, setSelected] = useState<string[]>((initial?.questions ?? []).map((question) => question.questionId).filter((value): value is string => !!value));
  const [issues, setIssues] = useState<ExamIssue[]>([]);
  const focusFirst = useRef(false);
  const classes = useDisciplineClasses(disciplineId);
  const bank = useQuery({ queryKey: ["questionBank", disciplineId, ""], queryFn: () => questionBankApi.list({ disciplineId }), enabled: !!disciplineId });
  const byId = useMemo(() => Object.fromEntries((bank.data ?? []).map((question) => [question.id, question])), [bank.data]);
  const totalWeight = selected.reduce((sum, questionId) => sum + (byId[questionId]?.weight ?? 0), 0);

  useEffect(() => { if (!disciplineId && disciplines.length) setDisciplineId(disciplines[0].id); }, [disciplineId, disciplines]);
  useEffect(() => { if (serverIssues) { setIssues(serverIssues); focusFirst.current = true; } }, [serverIssues]);
  useEffect(() => {
    if (!focusFirst.current || !issues.length) return;
    focusFirst.current = false;
    document.getElementById(domId(issues[0].field))?.focus();
  });

  const messages = (field: string) => issues.filter((issue) => issue.field === field).map(examIssueMessage);
  const aria = (field: string, hint = false) => ({
    id: domId(field),
    "aria-invalid": messages(field).length ? true : undefined,
    "aria-describedby": [hint ? domId(field) + "-hint" : null, messages(field).length ? domId(field) + "-error" : null].filter(Boolean).join(" ") || undefined,
  });
  const move = (index: number, step: number) => {
    const next = selected.slice();
    const [item] = next.splice(index, 1);
    next.splice(index + step, 0, item);
    setSelected(next);
  };

  function submit(event: FormEvent) {
    event.preventDefault();
    setIssues([]);
    onSubmit({
      title, instructions, disciplineId, classId: classId || null, shuffle,
      opensAt: fromLocalInput(opensAt), closesAt: fromLocalInput(closesAt),
      timeLimitMinutes: timeLimit ? Number(timeLimit) : null, questionIds: selected,
    });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {issues.length > 0 && (
        <div role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 font-[Poppins] text-sm text-red-200">
          {t("questions.editor.issuesSummary", { count: issues.length })}
        </div>
      )}
      <Field id={domId("title")} label={t("exams.editor.title")} errors={messages("title")}>
        <input {...aria("title")} value={title} onChange={(event) => setTitle(event.target.value)} className={cn(inputClass, "h-12")} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field id={domId("disciplineId")} label={t("exams.editor.discipline")} errors={messages("disciplineId")}>
          <select {...aria("disciplineId")} value={disciplineId} onChange={(event) => { setDisciplineId(event.target.value); setClassId(""); setSelected([]); }} className={cn(inputClass, "h-12")}>
            {!disciplineId && <option value="">{t("common.selecione")}</option>}
            {disciplines.map((discipline) => <option key={discipline.id} value={discipline.id}>{discipline.name}</option>)}
          </select>
        </Field>
        <Field id={domId("classId")} label={t("exams.editor.class")} optional errors={messages("classId")}>
          <select {...aria("classId")} value={classId} onChange={(event) => setClassId(event.target.value)} className={cn(inputClass, "h-12")}>
            <option value="">{t("exams.editor.allClasses")}</option>
            {classes.map((klass) => <option key={klass.id} value={klass.id}>{klass.name}</option>)}
          </select>
        </Field>
      </div>
      <Field id={domId("instructions")} label={t("exams.editor.instructions")} optional errors={messages("instructions")}>
        <textarea {...aria("instructions")} value={instructions} onChange={(event) => setInstructions(event.target.value)} rows={3} className={inputClass} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field id={domId("opensAt")} label={t("exams.editor.opensAt")} optional errors={messages("opensAt")}>
          <input {...aria("opensAt")} type="datetime-local" value={opensAt} onChange={(event) => setOpensAt(event.target.value)} className={cn(inputClass, "h-12")} />
        </Field>
        <Field id={domId("closesAt")} label={t("exams.editor.closesAt")} optional hint={t("exams.editor.windowHint")} errors={messages("closesAt")}>
          <input {...aria("closesAt", true)} type="datetime-local" value={closesAt} onChange={(event) => setClosesAt(event.target.value)} className={cn(inputClass, "h-12")} />
        </Field>
      </div>
      <div className="md:max-w-[calc(50%-0.5rem)]">
        <Field id={domId("timeLimitMinutes")} label={t("exams.editor.timeLimit")} optional hint={t("exams.editor.timeLimitHint")} errors={messages("timeLimitMinutes")}>
          <input {...aria("timeLimitMinutes", true)} type="number" inputMode="numeric" min={1} max={600} value={timeLimit} onChange={(event) => setTimeLimit(event.target.value)} className={cn(inputClass, "h-12")} />
        </Field>
      </div>
      <label className="flex min-h-[2.75rem] cursor-pointer items-center gap-3 font-[Poppins] text-sm text-zinc-200">
        <input type="checkbox" checked={shuffle} onChange={(event) => setShuffle(event.target.checked)} className="h-5 w-5 accent-blue-500" />
        {t("exams.editor.shuffle")}
      </label>

      <section aria-labelledby={domId("selected-title")} className="space-y-2">
        <h2 id={domId("selected-title")} className="font-[Poppins] text-sm font-semibold text-white">{t("exams.editor.selected", { count: selected.length })}</h2>
        <p className={hintClass}>{t("exams.meta.weight", { weight: number(totalWeight) })}</p>
        <div id={domId("questionIds")} tabIndex={-1}>
          {selected.length === 0 ? (
            <p className="font-[Poppins] text-sm text-zinc-400">{t("exams.editor.noneSelected")}</p>
          ) : (
            <ol className="space-y-2">
              {selected.map((questionId, index) => {
                const question = byId[questionId];
                return (
                  <li key={questionId} className="flex items-start gap-2 rounded-xl border border-white/10 bg-surface-sunken p-2">
                    <span className="w-6 shrink-0 pt-2 text-center font-[Poppins] text-xs text-zinc-400">{index + 1}</span>
                    <div className="min-w-0 flex-1 py-1 font-[Poppins] text-sm text-white">
                      <span className="block text-xs text-blue-300">{question ? typeLabel(question.type) : t("exams.detail.unavailable")}</span>
                      <span className="line-clamp-2 break-words">{question?.statement ?? ""}</span>
                    </div>
                    <button type="button" className={iconButton} disabled={index === 0} aria-label={t("exams.editor.moveUp", { index: index + 1 })} onClick={() => move(index, -1)}><ArrowUp aria-hidden="true" className="h-4 w-4" /></button>
                    <button type="button" className={iconButton} disabled={index === selected.length - 1} aria-label={t("exams.editor.moveDown", { index: index + 1 })} onClick={() => move(index, 1)}><ArrowDown aria-hidden="true" className="h-4 w-4" /></button>
                    <button type="button" className={iconButton} aria-label={t("exams.editor.removeQuestion", { index: index + 1 })} onClick={() => setSelected(selected.filter((item) => item !== questionId))}><Trash2 aria-hidden="true" className="h-4 w-4" /></button>
                  </li>
                );
              })}
            </ol>
          )}
          {messages("questionIds").length > 0 && <ul className="mt-1 font-[Poppins] text-xs text-red-300">{messages("questionIds").map((message, index) => <li key={index}>{message}</li>)}</ul>}
        </div>
      </section>

      <fieldset className="space-y-2">
        <legend className="font-[Poppins] text-sm font-semibold text-white">{t("exams.editor.available")}</legend>
        {(bank.data ?? []).length === 0 ? (
          <p className="font-[Poppins] text-sm text-zinc-400">{t("exams.editor.noBankQuestions")}</p>
        ) : (
          <ul className="space-y-2">
            {(bank.data ?? []).map((question) => (
              <li key={question.id}>
                <label className="flex min-h-[2.75rem] cursor-pointer items-start gap-3 rounded-xl border border-white/10 p-3 font-[Poppins] text-sm text-zinc-200 hover:bg-white/5">
                  <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-blue-500" checked={selected.includes(question.id)}
                    onChange={(event) => setSelected(event.target.checked ? [...selected, question.id] : selected.filter((item) => item !== question.id))} />
                  <span className="min-w-0">
                    <span className="block text-xs text-blue-300">{typeLabel(question.type)} · {t("questions.meta.weight", { weight: number(question.weight) })}</span>
                    <span className="break-words" lang={question.language}>{question.statement}</span>
                    <span className="sr-only">{`, ${t("exams.editor.include")}`}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      <AppButton type="submit" disabled={saving} aria-busy={saving || undefined} className="w-full sm:w-auto">
        {saving ? t("exams.editor.saving") : t("exams.editor.save")}
      </AppButton>
    </form>
  );
}

export function ExamEditorPage() {
  useLocale();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const existing = useQuery({ queryKey: ["managedExam", id], queryFn: () => examsApi.getManaged(id!), enabled: !!id });
  const [serverIssues, setServerIssues] = useState<ExamIssue[] | null>(null);
  const save = useMutation({
    mutationFn: (payload: ExamPayload) => (id ? examsApi.update(id, payload) : examsApi.create(payload)),
    onSuccess: (exam) => {
      toast.success({ key: "exams.editor.saved" });
      queryClient.invalidateQueries({ queryKey: ["managedExams"] });
      queryClient.setQueryData(["managedExam", exam.id], exam);
      navigate(`/exams/manage/${exam.id}`);
    },
    onError: (error) => {
      const data = (error as { response?: { data?: { issues?: ExamIssue[] } } }).response?.data;
      if (data && Array.isArray(data.issues)) setServerIssues(data.issues);
      else toast.error(apiError(error));
    },
  });

  return (
    <main className="relative flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <Link to={id ? `/exams/manage/${id}` : "/exams/manage"} className="inline-flex min-h-[2.75rem] items-center gap-2 font-[Poppins] text-sm text-zinc-300 hover:text-white">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          {t("exams.editor.back")}
        </Link>
        <PageHeader icon={<ClipboardList aria-hidden="true" className="h-5 w-5" />} title={id ? t("exams.editor.editTitle") : t("exams.editor.newTitle")} />
        <Panel>
          {id && existing.isError ? (
            <p role="alert" className="font-[Poppins] text-sm text-red-300">{t("exams.detail.loadError")}</p>
          ) : id && !existing.data ? (
            <p role="status" className="font-[Poppins] text-sm text-zinc-400">{t("common.carregando")}</p>
          ) : (
            <ExamForm key={existing.data?.id ?? "new"} initial={existing.data} saving={save.isPending} serverIssues={serverIssues}
              onSubmit={(payload) => { setServerIssues(null); save.mutate(payload); }} />
          )}
        </Panel>
      </div>
    </main>
  );
}
