import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ClipboardList, EyeOff, Megaphone, Pencil, Send, Square, Table2, Trash2 } from "lucide-react";
import { number, t, useLocale } from "@/i18n";
import { AppButton, PageHeader, Panel } from "@/components/AppUI";
import { AppModal } from "@/shared/components/feedback/AppModal";
import { toast } from "@/shared/lib/toast";
import { apiError } from "@/shared/lib/apiError";
import { typeLabel } from "@/features/questions/lib/questionLabels";
import { examsApi } from "@/features/exams/api/examsApi";
import { examIssueMessage, formatDateTime, stateLabel } from "@/features/exams/lib/examLabels";
import { secondaryLink } from "@/features/exams/lib/examStyles";
import type { ExamIssue, ManagedExam } from "@/features/exams/types";

type Confirm = "publish" | "close" | "delete" | "release" | null;

export function ExamManageDetailPage() {
  useLocale();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const exam = useQuery({ queryKey: ["managedExam", id], queryFn: () => examsApi.getManaged(id!) });
  const [confirm, setConfirm] = useState<Confirm>(null);
  const done = (data: ManagedExam, key: "exams.detail.published" | "exams.detail.closed") => {
    queryClient.setQueryData(["managedExam", id], data);
    queryClient.invalidateQueries({ queryKey: ["managedExams"] });
    toast.success({ key });
    setConfirm(null);
  };
  const failed = (error: unknown) => {
    const issues = (error as { response?: { data?: { issues?: ExamIssue[] } } }).response?.data?.issues;
    toast.error(issues?.length ? issues.map(examIssueMessage).join(" ") : apiError(error));
    setConfirm(null);
  };
  const publish = useMutation({ mutationFn: () => examsApi.publish(id!), onSuccess: (data) => done(data, "exams.detail.published"), onError: failed });
  const close = useMutation({ mutationFn: () => examsApi.close(id!), onSuccess: (data) => done(data, "exams.detail.closed"), onError: failed });
  const release = useMutation({
    mutationFn: () => examsApi.release(id!),
    onSuccess: () => {
      toast.success({ key: "exams.release.done" });
      setConfirm(null);
      queryClient.invalidateQueries({ queryKey: ["managedExam", id] });
      queryClient.invalidateQueries({ queryKey: ["managedExams"] });
      queryClient.invalidateQueries({ queryKey: ["blindReview", id] });
    },
    onError: failed,
  });
  const remove = useMutation({
    mutationFn: () => examsApi.remove(id!),
    onSuccess: () => { toast.success({ key: "exams.detail.deleted" }); queryClient.invalidateQueries({ queryKey: ["managedExams"] }); navigate("/exams/manage"); },
    onError: failed,
  });
  const data = exam.data;
  const busy = publish.isPending || close.isPending || remove.isPending || release.isPending;

  return (
    <main className="relative flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <Link to="/exams/manage" className="inline-flex min-h-[2.75rem] items-center gap-2 font-[Poppins] text-sm text-zinc-300 hover:text-white">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          {t("exams.editor.back")}
        </Link>
        {exam.isError ? (
          <p role="alert" className="font-[Poppins] text-sm text-red-300">{t("exams.detail.loadError")}</p>
        ) : !data ? (
          <p role="status" className="font-[Poppins] text-sm text-zinc-400">{t("common.carregando")}</p>
        ) : (
          <>
            <PageHeader icon={<ClipboardList aria-hidden="true" className="h-5 w-5" />} title={data.title}
              description={[stateLabel(data.state), data.disciplineName].join(" · ")} />
            <Panel className="space-y-3 font-[Poppins] text-sm text-zinc-300">
              <p>{[
                data.opensAt ? t("exams.meta.opens", { date: formatDateTime(data.opensAt) }) : null,
                data.closesAt ? t("exams.meta.closes", { date: formatDateTime(data.closesAt) }) : t("exams.meta.noClose"),
                data.timeLimitMinutes ? t("exams.meta.timeLimit", { minutes: data.timeLimitMinutes }) : t("exams.meta.noTimeLimit"),
              ].filter(Boolean).join(" · ")}</p>
              {data.state !== "draft" && (
                <>
                  <p className="font-semibold text-white">{t("exams.detail.progress", { submitted: data.submitted, audience: data.audience, inProgress: data.inProgress })}</p>
                  {data.state !== "released" && <p className="text-xs text-zinc-400">{t("exams.detail.resultsLater")}</p>}
                </>
              )}
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {data.state === "draft" && (
                  <>
                    <AppButton type="button" disabled={busy} onClick={() => setConfirm("publish")}><Send aria-hidden="true" className="h-4 w-4" />{t("exams.detail.publish")}</AppButton>
                    <Link to={`/exams/manage/${data.id}/edit`} className={secondaryLink}><Pencil aria-hidden="true" className="h-4 w-4" />{t("exams.detail.edit")}</Link>
                    <AppButton type="button" variant="secondary" disabled={busy} onClick={() => setConfirm("delete")}><Trash2 aria-hidden="true" className="h-4 w-4" />{t("exams.detail.delete")}</AppButton>
                  </>
                )}
                {(data.state === "closed" || data.state === "released") && (
                  <Link to={`/exams/manage/${data.id}/review`} className={secondaryLink}><EyeOff aria-hidden="true" className="h-4 w-4" />{t("exams.review.open")}</Link>
                )}
                {data.state === "closed" && (
                  <AppButton type="button" disabled={busy} onClick={() => setConfirm("release")}><Megaphone aria-hidden="true" className="h-4 w-4" />{t("exams.release.button")}</AppButton>
                )}
                {data.state === "released" && (
                  <Link to={`/exams/manage/${data.id}/results`} className={secondaryLink}><Table2 aria-hidden="true" className="h-4 w-4" />{t("exams.release.viewResults")}</Link>
                )}
                {(data.state === "open" || data.state === "scheduled") && (
                  <AppButton type="button" variant="secondary" disabled={busy} onClick={() => setConfirm("close")}><Square aria-hidden="true" className="h-4 w-4" />{t("exams.detail.close")}</AppButton>
                )}
              </div>
            </Panel>
            <Panel>
              <h2 className="font-[Poppins] text-base font-semibold text-white">{t("exams.detail.questionsTitle")}</h2>
              <p className="mt-1 font-[Poppins] text-xs text-zinc-400">{[t("exams.meta.questions", { count: data.questions.length }), t("exams.meta.weight", { weight: number(data.totalWeight) })].join(" · ")}</p>
              <ol className="mt-3 space-y-2">
                {data.questions.map((question, index) => (
                  <li key={`${question.questionId}-${index}`} className="rounded-xl border border-white/10 bg-surface-sunken p-3 font-[Poppins] text-sm">
                    <span className="block text-xs text-blue-300">
                      {`${index + 1}. `}{question.type === "unavailable" ? t("exams.detail.unavailable") : typeLabel(question.type)} · {t("questions.meta.weight", { weight: number(question.weight) })}
                    </span>
                    <span className="break-words text-white">{question.statement}</span>
                  </li>
                ))}
              </ol>
            </Panel>
          </>
        )}
      </div>
      <AppModal isOpen={confirm === "publish"} type="consent" title={t("exams.detail.publishTitle")} description={t("exams.detail.publishDescription")}
        acceptLabel={t("exams.detail.publish")} disabled={busy} onConfirm={() => publish.mutate()} onCancel={() => setConfirm(null)} onClose={() => setConfirm(null)} />
      <AppModal isOpen={confirm === "close"} type="delete" title={t("exams.detail.closeTitle")} description={t("exams.detail.closeDescription")}
        acceptLabel={t("exams.detail.close")} disabled={busy} onConfirm={() => close.mutate()} onCancel={() => setConfirm(null)} onClose={() => setConfirm(null)} />
      <AppModal isOpen={confirm === "release"} type="consent" title={t("exams.release.title")} description={t("exams.release.description")}
        acceptLabel={t("exams.release.button")} disabled={busy} onConfirm={() => release.mutate()} onCancel={() => setConfirm(null)} onClose={() => setConfirm(null)} />
      <AppModal isOpen={confirm === "delete"} type="delete" title={t("exams.detail.deleteTitle")} description={t("exams.detail.deleteDescription")}
        acceptLabel={t("exams.detail.delete")} disabled={busy} onConfirm={() => remove.mutate()} onCancel={() => setConfirm(null)} onClose={() => setConfirm(null)} />
    </main>
  );
}
