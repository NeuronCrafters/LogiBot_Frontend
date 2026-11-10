import { apiError } from "@/shared/lib/apiError";
import { number, percent, t, useLocale } from "@/i18n";
﻿import { useQuery } from "@tanstack/react-query";
import { Pie, PieChart, Cell, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { logApi } from "@/services/apiClient";
import type { DashboardFilterState } from "@/features/dashboard/filterTypes";
import { ChartLoader, ChartError, NoData } from "../ChartStates";
import { ChartDownloadButton } from "../ChartDownloadButton";
import { dashboardFiltersFromLegacy } from "../../insightFilters";

const COLORS = ["#10b981", "#ef4444"];
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
      return { chartData: [{ name: t("common.acertos"), value: totalCorrect, fill: COLORS[0] }, { name: t("common.erros"), value: totalWrong, fill: COLORS[1] }], totalCorrect, totalWrong, accuracy };
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

  return (
    <Card id="correct-wrong-chart" className="bg-[#1f1f1f] border-white/10 flex flex-col h-full">
      <CardHeader className="relative flex flex-col p-0 space-y-0 border-b border-white/10">
        <div className="flex items-start justify-between px-6 py-5 pr-36">
          <div>
            <CardTitle className="text-white font-[Poppins]">{t("dashboard.desempenhoPorTopicoGeral")}</CardTitle>
            <CardDescription className="text-white/50 font-[Poppins] mt-1">{t("dashboard.acertosEErrosComBaseNaInteracao")}</CardDescription>
          </div>
        </div>
        <div className="absolute top-5 right-4 z-40">
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
            <PieChart width={320} height={300}>
              <Pie data={accuracyData.chartData} cx="50%" cy="45%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value" nameKey="name">
                {accuracyData.chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" aria-label={`${entry.name}: ${number(entry.value)}`} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#141414", borderColor: "rgba(255,255,255,0.1)", borderRadius: 12 }} labelStyle={{ color: "#fff" }} itemStyle={{ color: "#fff" }} />
              <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="font-[Poppins] text-xs text-white">{value}</span>} />
            </PieChart>
          </div>
        )}
        {hasRequired && !isLoading && !isError && !hasData && <NoData onRetry={refetchTyped}><p>{t("dashboard.nenhumDadoDeAcertosErrosDisponivel")}</p></NoData>}
      </CardContent>

      {hasData && (
        <CardFooter className="flex flex-col items-start gap-3 px-6 py-4 border-t border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /><span className="font-[Poppins] text-sm text-white">{t("dashboard.acertos")}{" "}{accuracyData!.totalCorrect}</span></div>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /><span className="font-[Poppins] text-sm text-white">{t("dashboard.erros")}{" "}{accuracyData!.totalWrong}</span></div>
          </div>
          <span className="font-[Poppins] text-sm text-zinc-400">{t("dashboard.precisao")}{" "}<span className="font-semibold text-white">{percent((accuracyData!.accuracy) / 100, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span></span>
        </CardFooter>
      )}
    </Card>
  );
}
