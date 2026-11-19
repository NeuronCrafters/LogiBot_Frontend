import { useId } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Plus } from "lucide-react";
import { t, useLocale } from "@/i18n";
import { EmptyState, PageHeader } from "@/components/AppUI";
import { examsApi } from "@/features/exams/api/examsApi";
import { formatDateTime, stateLabel } from "@/features/exams/lib/examLabels";
import { primaryLink, secondaryLink } from "@/features/exams/lib/examStyles";


export function ExamManageListPage() {
  useLocale();
  const id = useId();
  const list = useQuery({ queryKey: ["managedExams"], queryFn: () => examsApi.listManaged() });
  const exams = list.data ?? [];

  return (
    <main className="relative flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <PageHeader
          icon={<ClipboardList aria-hidden="true" className="h-5 w-5" />}
          title={t("exams.manage.title")}
          description={t("exams.manage.description")}
          action={<Link to="/exams/manage/new" className={primaryLink}><Plus aria-hidden="true" className="h-4 w-4" />{t("exams.manage.new")}</Link>}
        />
        {list.isError ? (
          <p role="alert" className="font-[Poppins] text-sm text-red-300">{t("exams.manage.loadError")}</p>
        ) : !list.isLoading && exams.length === 0 ? (
          <EmptyState icon={<ClipboardList aria-hidden="true" className="h-6 w-6" />} title={t("exams.manage.empty")} description={t("exams.manage.emptyDescription")} />
        ) : (
          <ul className="grid gap-3" aria-busy={list.isLoading || undefined}>
            {exams.map((exam) => (
              <li key={exam.id}>
                <article aria-labelledby={`${id}-${exam.id}`} className="rounded-2xl border border-white/10 bg-surface p-4 shadow-md shadow-black/10">
                  <div className="flex flex-wrap items-center gap-2 font-[Poppins] text-xs">
                    <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-2.5 py-1 font-semibold text-blue-300">{stateLabel(exam.state)}</span>
                    <span className="text-zinc-400">{exam.disciplineName}</span>
                  </div>
                  <h2 id={`${id}-${exam.id}`} className="mt-2 break-words font-[Poppins] text-base font-semibold text-white">{exam.title}</h2>
                  <p className="mt-1 font-[Poppins] text-xs text-zinc-400">
                    {[
                      exam.opensAt ? t("exams.meta.opens", { date: formatDateTime(exam.opensAt) }) : null,
                      exam.closesAt ? t("exams.meta.closes", { date: formatDateTime(exam.closesAt) }) : t("exams.meta.noClose"),
                      exam.timeLimitMinutes ? t("exams.meta.timeLimit", { minutes: exam.timeLimitMinutes }) : t("exams.meta.noTimeLimit"),
                    ].filter(Boolean).join(" · ")}
                  </p>
                  {exam.state !== "draft" && (
                    <p className="mt-1 font-[Poppins] text-xs text-zinc-300">{t("exams.manage.submissions", { submitted: exam.submitted, inProgress: exam.inProgress })}</p>
                  )}
                  <div className="mt-3">
                    <Link to={`/exams/manage/${exam.id}`} aria-label={t("exams.manage.openAria", { title: exam.title })} className={`${secondaryLink} px-3 text-xs md:min-h-[2.25rem]`}>
                      {t("exams.manage.openLabel")}
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
