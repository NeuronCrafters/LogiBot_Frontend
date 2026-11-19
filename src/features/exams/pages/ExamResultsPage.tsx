import { useId } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, Table2 } from "lucide-react";
import { number, t, useLocale } from "@/i18n";
import { AppButton, PageHeader, Panel } from "@/components/AppUI";
import { apiError } from "@/shared/lib/apiError";
import { downloadCSV } from "@/shared/lib/downloadCsv";
import { examsApi } from "@/features/exams/api/examsApi";
import { formatDateTime } from "@/features/exams/lib/examLabels";

const grade = (value: number | null) => (value === null ? "—" : number(value, { minimumFractionDigits: 1, maximumFractionDigits: 2 }));
const minutes = (ms: number | null) => (ms === null ? "—" : t("exams.results.minutes", { minutes: Math.max(1, Math.round(ms / 60000)) }));

export function ExamResultsPage() {
  useLocale();
  const { id } = useParams();
  const captionId = useId();
  const results = useQuery({ queryKey: ["examResults", id], queryFn: () => examsApi.getResults(id!) });
  const data = results.data;
  const graded = (data?.rows ?? []).filter((row) => row.grade !== null);
  const average = graded.length ? graded.reduce((sum, row) => sum + (row.grade ?? 0), 0) / graded.length : null;

  function exportCsv() {
    if (!data) return;
    downloadCSV(`${data.title}.csv`, data.rows.map((row) => ({
      [t("exams.results.student")]: row.name,
      [t("exams.results.status")]: row.status === "submitted" ? t("exams.results.submitted") : t("exams.results.missed"),
      [t("exams.results.objective")]: `${row.objectiveCorrect}/${row.objectiveTotal}`,
      [t("exams.results.essays")]: `${row.essayPoints}/${row.essayTotal}`,
      [t("exams.results.grade")]: row.grade,
      [t("exams.results.duration")]: row.durationMs === null ? null : Math.round(row.durationMs / 60000),
    })));
  }

  return (
    <main className="relative flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <Link to={`/exams/manage/${id}`} className="inline-flex min-h-[2.75rem] items-center gap-2 font-[Poppins] text-sm text-zinc-300 hover:text-white">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          {data?.title ?? t("exams.editor.back")}
        </Link>
        <PageHeader icon={<Table2 aria-hidden="true" className="h-5 w-5" />} title={t("exams.results.title")}
          description={data ? [data.title, formatDateTime(data.releasedAt)].join(" · ") : undefined}
          action={data ? <AppButton type="button" variant="secondary" onClick={exportCsv}><Download aria-hidden="true" className="h-4 w-4" />{t("exams.results.export")}</AppButton> : undefined} />
        {results.isError ? (
          <p role="alert" className="font-[Poppins] text-sm text-red-300">{apiError(results.error, "exams.results.loadError")}</p>
        ) : !data ? (
          <p role="status" className="font-[Poppins] text-sm text-zinc-400">{t("common.carregando")}</p>
        ) : (
          <Panel className="space-y-3">
            {average !== null && <p className="font-[Poppins] text-sm text-zinc-300">{t("exams.results.average", { average: grade(average) })}</p>}
            <div role="region" aria-labelledby={captionId} tabIndex={0} className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[40rem] border-collapse text-left font-[Poppins] text-sm">
                <caption id={captionId} className="sr-only">{t("exams.results.caption")}</caption>
                <thead className="bg-surface-raised text-xs uppercase tracking-wide text-zinc-300">
                  <tr>
                    {(["student", "status", "objective", "essays", "grade", "duration"] as const).map((column) => (
                      <th key={column} scope="col" className="px-3 py-2 font-semibold">{t(`exams.results.${column}`)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row.studentId} className="border-t border-white/5">
                      <th scope="row" className="px-3 py-2 font-medium text-white">{row.name}</th>
                      <td className={row.status === "missed" ? "px-3 py-2 text-red-300" : "px-3 py-2 text-zinc-200"}>{row.status === "submitted" ? t("exams.results.submitted") : t("exams.results.missed")}</td>
                      <td className="px-3 py-2 tabular-nums text-zinc-200">{`${row.objectiveCorrect}/${row.objectiveTotal}`}</td>
                      <td className="px-3 py-2 tabular-nums text-zinc-200">{`${number(row.essayPoints)}/${row.essayTotal}`}</td>
                      <td className="px-3 py-2 font-semibold tabular-nums text-white">{grade(row.grade)}</td>
                      <td className="px-3 py-2 tabular-nums text-zinc-300">{minutes(row.durationMs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
      </div>
    </main>
  );
}
