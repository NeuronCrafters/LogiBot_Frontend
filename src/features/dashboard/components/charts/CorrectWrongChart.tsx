import { ChartTooltip as Tooltip } from "@/components/ui/chart";
import { apiError } from "@/shared/lib/apiError";
import { chartLine, chartText } from "../../chartColors";
import { CHART_COLORS, useChartPreferences } from "../../chartPreferences";
import { number, percent, t, useLocale } from "@/i18n";
﻿import { useQuery } from "@tanstack/react-query";
import { Pie, PieChart, Cell, Legend, ResponsiveContainer } from "recharts";
import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { logApi } from "@/services/apiClient";
import type { DashboardFilterState } from "@/features/dashboard/filterTypes";
import { ChartLoader, ChartError, NoData } from "../ChartStates";
import { ChartDownloadButton } from "../ChartDownloadButton";
import { dashboardFiltersFromLegacy } from "../../insightFilters";
import { ChartDataTable } from "../ChartDataTable";
import { FillSwatch, HatchPattern } from "../ChartMarks";
import { useSvgId } from "../../useSvgId";

const COLORS = [CHART_COLORS.positive, CHART_COLORS.negative];
const MARKS = ["✓", "✗"];
const CHART_INFO = () => (t("dashboard.proporcaoDeAcertosEErrosNosQuizzes"));

interface CorrectWrongChartProps {
  filter: DashboardFilterState & {
    hierarchyParams: { universityId?: string; courseId?: string; classId?: string; disciplineId?: string };
  };
}

function useAccuracyData(filter: CorrectWrongChartProps["filter"]) {
  useLocale();

  const filters = dashboardFiltersFromLegacy(filter);
  return useQuery({
    queryKey: ["useAccuracyData", filters],
    queryFn: async () => {
      return logApi.getFilteredStudentSummary(filters as any);
    },
    enabled: !!filters.universityId,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    select: (rawData: any) => {
      const totalCorrect = Number(rawData.totalCorrect ?? rawData.totalCorrectAnswers ?? 0);
      const totalWrong = Number(rawData.totalWrong ?? rawData.totalWrongAnswers ?? 0);
      const total = totalCorrect + totalWrong;
      const accuracy = total > 0 ? (totalCorrect / total) * 100 : 0;
      return { chartData: [{ name: t("common.acertos"), value: totalCorrect, share: total > 0 ? totalCorrect / total : 0 }, { name: t("common.erros"), value: totalWrong, share: total > 0 ? totalWrong / total : 0 }], totalCorrect, totalWrong, accuracy };
    },
  });
}

export function CorrectWrongChart({ filter }: CorrectWrongChartProps) {
  useLocale();

  const { data: accuracyData, isLoading, isError, error, refetch } = useAccuracyData(filter);
  const hasRequired = !!dashboardFiltersFromLegacy(filter).universityId;
  const hasData = !!accuracyData && (accuracyData.totalCorrect > 0 || accuracyData.totalWrong > 0);
  const refetchTyped = refetch as () => void;
  const errorMessage = apiError(error, "common.erroAoCarregarDados");
  const { animate, font, space, tooltipTrigger } = useChartPreferences();
  const hatchId = useSvgId("wrong-hatch");
  const fills = [COLORS[0], `url(#${hatchId})`];
  const icons = [CheckCircle2, XCircle];

  return (
    <Card id="correct-wrong-chart" className="dashboard-chart bg-surface border-white/10 flex flex-col h-full">
      <CardHeader className="dashboard-chart-header grid gap-0 p-0 space-y-0 border-b border-white/10">
        <div className="chart-heading min-w-0 px-4 py-5 sm:px-6">
          <div>
            <CardTitle className="text-white font-[Poppins]">{t("dashboard.desempenhoPorTopicoGeral")}</CardTitle>
            <CardDescription className="text-white/50 font-[Poppins] mt-1">{t("dashboard.acertosEErrosComBaseNaInteracao")}</CardDescription>
          </div>
        </div>
        <div className="chart-actions flex items-start justify-end px-4 pb-4 sm:px-6">
          <ChartDownloadButton
            containerId="correct-wrong-chart"
            fileName={t("dashboard.export.acertos_erros")}
            info={CHART_INFO()}
            insight={{
              chart: "accuracy",
              title: t("dashboard.acertosEErros"),
              filters: dashboardFiltersFromLegacy(filter),
              disabled: isLoading || !hasData,
            }}
          />
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col min-h-0 px-2 sm:p-6">
        {!hasRequired && <NoData onRetry={refetchTyped}><p>{t("dashboard.selecioneUmaEntidadeParaVisualizarDados")}</p></NoData>}
        {hasRequired && isLoading && <ChartLoader text={t("common.carregandoDados")} />}
        {hasRequired && isError && <ChartError message={errorMessage} onRetry={refetchTyped} />}
        {hasRequired && !isLoading && !isError && hasData && (
          <div className="flex flex-1 min-h-[260px] w-full items-center justify-center">
            <div className="w-full max-w-[320px]">
            <ResponsiveContainer width="100%" height={space(300)}>
            <PieChart margin={{ top: space(28), right: space(24), bottom: 0, left: space(24) }}>
              <defs>
                <HatchPattern id={hatchId} color={COLORS[1]} />
              </defs>
              <Pie
                isAnimationActive={animate}
                data={accuracyData.chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={88}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                labelLine={({ points }: { points?: { x: number; y: number }[] }) => (
                  <polyline aria-hidden="true" points={(points ?? []).map((point) => `${point.x},${point.y}`).join(" ")} fill="none" stroke={chartLine(0.35)} />
                )}
                label={({ x, y, textAnchor, index, value }: any) =>
                  value > 0 ? (
                    <text x={x} y={y} textAnchor={textAnchor} dominantBaseline="central" fill={chartText(0.85)} fontSize={font(12)} fontWeight={600}>
                      {`${MARKS[index]} ${percent(accuracyData.chartData[index].share, { maximumFractionDigits: 1 })}`}
                    </text>
                  ) : null
                }
              >
                {accuracyData.chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={fills[index]} stroke={COLORS[index]} strokeWidth={1} aria-label={`${entry.name}: ${number(entry.value)}`} />
                ))}
              </Pie>
              <Tooltip trigger={tooltipTrigger} contentStyle={{ backgroundColor: "rgb(var(--c-surface-sunken))", borderColor: chartLine(0.1), borderRadius: 12 }} labelStyle={{ color: "rgb(var(--c-white))" }} itemStyle={{ color: "rgb(var(--c-white))" }} />
              <Legend
                verticalAlign="bottom"
                height={space(36)}
                content={() => (
                  <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
                    {accuracyData.chartData.map((entry, index) => {
                      const Icon = icons[index];
                      return (
                        <li key={entry.name} className="flex items-center gap-1.5 font-[Poppins] text-xs text-white">
                          <FillSwatch fill={fills[index]} />
                          <Icon aria-hidden="true" className={`h-3.5 w-3.5 ${index === 0 ? "text-chart-positive-ink" : "text-chart-negative-ink"}`} />
                          {entry.name}
                        </li>
                      );
                    })}
                  </ul>
                )}
              />
            </PieChart>
            </ResponsiveContainer>
            </div>
          </div>
        )}
        {hasRequired && !isLoading && !isError && hasData && (
          <ChartDataTable
            title={t("dashboard.acertosEErros")}
            rows={accuracyData.chartData}
            rowKey={(row) => row.name}
            columns={[
              { header: t("dashboard.table.resultado"), cell: (row) => row.name },
              { header: t("dashboard.table.respostas"), numeric: true, cell: (row) => number(row.value) },
              { header: t("dashboard.table.percentual"), numeric: true, cell: (row) => percent(row.share, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) },
            ]}
            footer={`${t("dashboard.table.total")}: ${number(accuracyData.totalCorrect + accuracyData.totalWrong)}`}
          />
        )}
        {hasRequired && !isLoading && !isError && !hasData && <NoData onRetry={refetchTyped}><p>{t("dashboard.nenhumDadoDeAcertosErrosDisponivel")}</p></NoData>}
      </CardContent>

      {hasData && (
        <CardFooter className="flex flex-col items-start gap-3 px-6 py-4 border-t border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2"><CheckCircle2 aria-hidden="true" className="h-4 w-4 text-chart-positive-ink" /><span className="font-[Poppins] text-sm text-white">{t("dashboard.acertos")}{" "}{accuracyData!.totalCorrect}</span></div>
            <span aria-hidden="true" className="text-white/20">|</span>
            <div className="flex items-center gap-2"><XCircle aria-hidden="true" className="h-4 w-4 text-chart-negative-ink" /><span className="font-[Poppins] text-sm text-white">{t("dashboard.erros")}{" "}{accuracyData!.totalWrong}</span></div>
          </div>
          <span className="font-[Poppins] text-sm text-zinc-400">{t("dashboard.precisao")}{" "}<span className="font-semibold text-white">{percent((accuracyData!.accuracy) / 100, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span></span>
        </CardFooter>
      )}
    </Card>
  );
}
