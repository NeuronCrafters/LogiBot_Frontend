import { useId } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck } from "lucide-react";
import { number, t, useLocale } from "@/i18n";
import { EmptyState, PageHeader } from "@/components/AppUI";
import { cn } from "@/shared/lib/cn";
import { examsApi } from "@/features/exams/api/examsApi";
import { formatDateTime, studentStatusLabel } from "@/features/exams/lib/examLabels";
import { primaryLink, secondaryLink } from "@/features/exams/lib/examStyles";
import type { StudentExamStatus } from "@/features/exams/types";

const badge: Record<StudentExamStatus, string> = {
  available: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
  in_progress: "border-amber-400/40 bg-amber-500/10 text-amber-300",
  upcoming: "border-white/10 bg-white/5 text-zinc-300",
  submitted: "border-blue-400/30 bg-blue-500/10 text-blue-300",
  released: "border-blue-400/30 bg-blue-500/10 text-blue-300",
  missed: "border-red-400/40 bg-red-500/10 text-red-300",
};

export function StudentExamsPage() {
  useLocale();
  const id = useId();
  const list = useQuery({ queryKey: ["studentExams"], queryFn: () => examsApi.listForStudent(), refetchOnWindowFocus: true });
  const exams = list.data ?? [];

  return (
    <main className="relative flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <PageHeader icon={<ClipboardCheck aria-hidden="true" className="h-5 w-5" />} title={t("exams.student.title")} description={t("exams.student.description")} />
        {list.isError ? (
          <p role="alert" className="font-[Poppins] text-sm text-red-300">{t("exams.student.loadError")}</p>
        ) : !list.isLoading && exams.length === 0 ? (
          <EmptyState icon={<ClipboardCheck aria-hidden="true" className="h-6 w-6" />} title={t("exams.student.empty")} />
        ) : (
          <ul className="grid gap-3" aria-busy={list.isLoading || undefined}>
            {exams.map((exam) => {
              const action = exam.status === "available" ? t("exams.student.start") : exam.status === "in_progress" ? t("exams.student.continue") : t("exams.student.view");
              const prominent = exam.status === "available" || exam.status === "in_progress";
              return (
                <li key={exam.id}>
                  <article aria-labelledby={`${id}-${exam.id}`} className="rounded-2xl border border-white/10 bg-surface p-4 shadow-md shadow-black/10">
                    <div className="flex flex-wrap items-center gap-2 font-[Poppins] text-xs">
                      <span className={cn("rounded-full border px-2.5 py-1 font-semibold", badge[exam.status])}>{studentStatusLabel(exam.status)}</span>
                      <span className="text-zinc-400">{exam.disciplineName}</span>
                    </div>
                    <h2 id={`${id}-${exam.id}`} className="mt-2 break-words font-[Poppins] text-base font-semibold text-white">{exam.title}</h2>
                    <p className="mt-1 font-[Poppins] text-xs text-zinc-400">
                      {[
                        t("exams.meta.questions", { count: exam.questionCount }),
                        exam.timeLimitMinutes ? t("exams.meta.timeLimit", { minutes: exam.timeLimitMinutes }) : t("exams.meta.noTimeLimit"),
                        exam.status === "released" && exam.grade !== null && exam.grade !== undefined ? t("exams.student.grade", { grade: number(exam.grade, { maximumFractionDigits: 2 }) }) : null,
                        exam.status === "upcoming" && exam.opensAt ? t("exams.meta.opens", { date: formatDateTime(exam.opensAt) }) : null,
                        exam.closesAt ? t("exams.meta.closes", { date: formatDateTime(exam.closesAt) }) : null,
                      ].filter(Boolean).join(" · ")}
                    </p>
                    <div className="mt-3">
                      <Link to={`/exams/${exam.id}`} aria-label={t("exams.student.actionAria", { action, title: exam.title })}
                        className={cn(prominent ? primaryLink : secondaryLink, "px-3 text-xs md:min-h-[2.25rem]")}>
                        {action}
                      </Link>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
