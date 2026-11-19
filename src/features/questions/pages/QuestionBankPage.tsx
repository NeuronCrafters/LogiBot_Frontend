import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileQuestion, Import, Library, Pencil, Plus, Trash2 } from "lucide-react";
import { number, t, useLocale } from "@/i18n";
import { EmptyState, PageHeader, Panel } from "@/components/AppUI";
import { AppModal } from "@/shared/components/feedback/AppModal";
import { toast } from "@/shared/lib/toast";
import { apiError } from "@/shared/lib/apiError";
import { professorQuizApi } from "@/features/quiz/api/quizApi";
import { useQuestionTypes } from "@/features/questions/hooks/useQuestionTypes";
import { conceptList } from "@/features/exercises/lib/logicLabels";
import { questionBankApi } from "@/features/questions/api/questionBankApi";
import { useManagedDisciplines } from "@/features/questions/hooks/useManagedDisciplines";
import { subjectLabel, typeLabel } from "@/features/questions/lib/questionLabels";
import type { BankQuestion } from "@/features/questions/types";

const selectClass = "h-12 w-full rounded-xl border border-control bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white";
const linkButton = "inline-flex min-h-[2.75rem] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-4 font-[Poppins] text-sm font-semibold shadow-md transition-colors";
const shortTitle = (text: string) => (text.length > 60 ? text.slice(0, 57) + "…" : text);

export function QuestionBankPage() {
  useLocale();
  const id = useId();
  const queryClient = useQueryClient();
  const { disciplines } = useManagedDisciplines();
  const [disciplineId, setDisciplineId] = useState("");
  const [type, setType] = useState("");
  const types = useQuestionTypes();
  const [removeTarget, setRemoveTarget] = useState<BankQuestion | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [quizId, setQuizId] = useState("");

  const list = useQuery({ queryKey: ["questionBank", disciplineId, type], queryFn: () => questionBankApi.list({ disciplineId, type }) });
  const quizzes = useQuery({ queryKey: ["professorQuizzes"], queryFn: () => professorQuizApi.getMyQuizzes(), enabled: importOpen });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["questionBank"] });

  const remove = useMutation({
    mutationFn: (questionId: string) => questionBankApi.remove(questionId),
    onSuccess: () => { toast.success({ key: "questions.removed" }); setRemoveTarget(null); refresh(); },
    onError: (error) => toast.error(apiError(error)),
  });
  const importQuiz = useMutation({
    mutationFn: (selected: string) => questionBankApi.importQuiz(selected),
    onSuccess: (result) => { toast.success({ key: "questions.importResult", params: { ...result } }); setImportOpen(false); setQuizId(""); refresh(); },
    onError: (error) => toast.error(apiError(error)),
  });

  const questions = list.data ?? [];

  return (
    <main className="relative flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <PageHeader
          icon={<Library aria-hidden="true" className="h-5 w-5" />}
          title={t("questions.pageTitle")}
          description={t("questions.pageDescription")}
          action={(
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link to="/questions/new" className={`${linkButton} border-blue-400/40 bg-blue-600 text-on-accent hover:bg-blue-700`}>
                <Plus aria-hidden="true" className="h-4 w-4" />
                {t("questions.newQuestion")}
              </Link>
              <button type="button" onClick={() => setImportOpen(true)} className={`${linkButton} border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10`}>
                <Import aria-hidden="true" className="h-4 w-4" />
                {t("questions.importQuiz")}
              </button>
            </div>
          )}
        />

        <Panel className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={id + "-discipline"} className="mb-1.5 block font-[Poppins] text-sm font-medium text-zinc-300">{t("questions.filterDiscipline")}</label>
            <select id={id + "-discipline"} value={disciplineId} onChange={(event) => setDisciplineId(event.target.value)} className={selectClass}>
              <option value="">{t("questions.allDisciplines")}</option>
              {disciplines.map((discipline) => <option key={discipline.id} value={discipline.id}>{discipline.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor={id + "-type"} className="mb-1.5 block font-[Poppins] text-sm font-medium text-zinc-300">{t("questions.filterType")}</label>
            <select id={id + "-type"} value={type} onChange={(event) => setType(event.target.value)} className={selectClass}>
              <option value="">{t("questions.allTypes")}</option>
              {types.map((item) => <option key={item} value={item}>{typeLabel(item)}</option>)}
            </select>
          </div>
        </Panel>

        {list.isError ? (
          <p role="alert" className="font-[Poppins] text-sm text-red-300">{t("questions.loadError")}</p>
        ) : !list.isLoading && questions.length === 0 ? (
          <EmptyState icon={<FileQuestion aria-hidden="true" className="h-6 w-6" />} title={t("questions.emptyTitle")} description={t("questions.emptyDescription")} />
        ) : (
          <section aria-labelledby={id + "-count"} aria-busy={list.isLoading || undefined}>
            <h2 id={id + "-count"} className="sr-only">{t("questions.count", { count: questions.length })}</h2>
            <ul className="grid gap-3">
              {questions.map((question) => {
                const headingId = `${id}-q-${question.id}`;
                return (
                  <li key={question.id}>
                    <article aria-labelledby={headingId} className="rounded-2xl border border-white/10 bg-surface p-4 shadow-md shadow-black/10">
                      <div className="flex flex-wrap items-center gap-2 font-[Poppins] text-xs">
                        <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-2.5 py-1 font-semibold text-blue-300">{typeLabel(question.type)}</span>
                        {question.practiceEnabled && <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-300">{t("questions.practice.badge")}</span>}
                        <span className="text-zinc-400">{question.disciplineName}</span>
                        {question.sourceQuizQuestionId && <span className="rounded-full border border-white/10 px-2 py-0.5 text-zinc-400">{t("questions.meta.imported")}</span>}
                      </div>
                      <h3 id={headingId} lang={question.language} className="mt-2 line-clamp-3 break-words font-[Poppins] text-sm font-semibold leading-snug text-white">{question.statement}</h3>
                      <p className="mt-2 font-[Poppins] text-xs text-zinc-400">
                        {[
                          t("questions.meta.weight", { weight: number(question.weight) }),
                          t("questions.meta.version", { version: question.version }),
                          subjectLabel(question.subject),
                          question.concepts.length ? conceptList(question.concepts) : null,
                        ].filter(Boolean).join(" · ")}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link to={`/questions/${question.id}/edit`} aria-label={t("questions.editLabel", { title: shortTitle(question.statement) })}
                          className={`${linkButton} min-h-[2.75rem] border-white/10 bg-white/5 px-3 text-xs text-zinc-200 hover:bg-white/10 md:min-h-[2.25rem]`}>
                          <Pencil aria-hidden="true" className="h-4 w-4" />
                          {t("questions.edit")}
                        </Link>
                        <button type="button" onClick={() => setRemoveTarget(question)} aria-label={t("questions.removeLabel", { title: shortTitle(question.statement) })}
                          className={`${linkButton} min-h-[2.75rem] border-white/10 bg-white/5 px-3 text-xs text-red-300 hover:bg-white/10 md:min-h-[2.25rem]`}>
                          <Trash2 aria-hidden="true" className="h-4 w-4" />
                          {t("questions.remove")}
                        </button>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>

      <AppModal
        isOpen={!!removeTarget}
        type="delete"
        title={t("questions.removeTitle")}
        description={t("questions.removeDescription")}
        acceptLabel={t("questions.remove")}
        disabled={remove.isPending}
        onConfirm={() => removeTarget && remove.mutate(removeTarget.id)}
        onCancel={() => setRemoveTarget(null)}
        onClose={() => setRemoveTarget(null)}
      />

      <AppModal
        isOpen={importOpen}
        type="create"
        title={t("questions.importTitle")}
        description={t("questions.importDescription")}
        acceptLabel={t("questions.importConfirm")}
        disabled={importQuiz.isPending}
        confirmDisabled={!quizId}
        onConfirm={() => quizId && importQuiz.mutate(quizId)}
        onCancel={() => setImportOpen(false)}
        onClose={() => setImportOpen(false)}
      >
        {quizzes.data && quizzes.data.length === 0 ? (
          <p className="font-[Poppins] text-sm text-zinc-400">{t("questions.importEmpty")}</p>
        ) : (
          <div>
            <label htmlFor={id + "-quiz"} className="mb-1.5 block font-[Poppins] text-sm font-medium text-zinc-300">{t("questions.importSelect")}</label>
            <select id={id + "-quiz"} value={quizId} onChange={(event) => setQuizId(event.target.value)} className={selectClass}>
              <option value="">{t("common.selecione")}</option>
              {(quizzes.data ?? []).map((quiz) => <option key={quiz.id} value={quiz.id}>{`${quiz.title} (${quiz.disciplineName ?? ""})`}</option>)}
            </select>
          </div>
        )}
      </AppModal>
    </main>
  );
}
