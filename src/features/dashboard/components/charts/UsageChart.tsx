import { apiError } from "@/shared/lib/apiError";
import { chartLine } from "../../chartColors";
import { CHART_COLORS, useChartPreferences } from "../../chartPreferences";
import { number, t, useLocale, getLanguage } from "@/i18n";
﻿import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { BarChart, Bar, CartesianGrid, XAxis } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { api } from "@/shared/api/httpClient";
import type { DashboardFilterState } from "@/features/dashboard/filterTypes";
import { ChartDownloadButton } from "../ChartDownloadButton";
import { ChartLoader, ChartError, NoData } from "../ChartStates";
import { dashboardFiltersFromLegacy } from "../../insightFilters";
import { ChartDataTable, MissingValue } from "../ChartDataTable";

const formatDay = (value: string, options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" }) =>
  new Date(value).toLocaleDateString(getLanguage(), { ...options, timeZone: "UTC" });

export function formatTimeWithDays(seconds: number): string {
  const totalSeconds = Math.floor(seconds);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${days}:${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

interface UsageChartProps {
  filter: DashboardFilterState & {
    hierarchyParams: {
      universityId?: string;
      courseId?: string;
      classId?: string;
      disciplineId?: string;
    };
  };
}

function useUsageData(filter: UsageChartProps["filter"]) {
  useLocale();

  const filters = dashboardFiltersFromLegacy(filter);
  return useQuery({
    queryKey: ["useUsageData", filters],
    queryFn: async () => {
      const { data } = await api.post("/logs/students/summary", filters);
      return { totalUsageTime: data.usageTimeInSeconds, dailyUsage: data.dailyUsage || [], sessions: data.sessions || [], estimatedUsageTime: data.estimatedUsageTimeInSeconds ?? 0, undeterminedSessionCount: data.undeterminedSessionCount ?? 0 };
    },
    enabled: !!filters.universityId,
    staleTime: 15 * 60 * 1_000,
    gcTime: 30 * 60 * 1_000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

export function UsageChart({ filter }: UsageChartProps) {
  const locale = useLocale();

  const {
    data: usageData,
    isLoading,
    isError,
    error,
    refetch,
  } = useUsageData(filter);
  const hasRequiredIds = !!dashboardFiltersFromLegacy(filter).universityId;
  const { animate, font, space, tooltipTrigger } = useChartPreferences();
  const chartConfig = useMemo(
    () => ({ usage: { label: t("dashboard.minutos", {}, locale), color: CHART_COLORS.primary } }),
    [locale],
  );
  const chartData = useMemo(() => {
    if (
      !usageData ||
      !Array.isArray(usageData.dailyUsage) ||
      usageData.dailyUsage.length === 0
    )
      return [];
    return [...usageData.dailyUsage].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }, [usageData]);
  const hasData = chartData.length > 0;
  const formattedTime = useMemo(
    () => formatTimeWithDays(usageData?.totalUsageTime ?? 0),
    [usageData],
  );

  return (
    <Card
      id="usage-chart"
      className="dashboard-chart bg-surface border-white/10 flex flex-col"
    >
      <CardHeader className="dashboard-chart-header grid gap-0 p-0 space-y-0 border-b border-white/10">
        <div className="chart-heading min-w-0 px-4 py-5 sm:px-6">
          <div>
            <CardTitle className="text-white font-[Poppins]">
              {t("dashboard.tempoDeUsoDiario", {}, locale)}</CardTitle>
            <CardDescription className="text-white/50 font-[Poppins] mt-1">
              {t("dashboard.minutosDeUtilizacaoNosUltimosDias", {}, locale)}</CardDescription>
          </div>
        </div>
        <div className="col-span-full border-t border-white/10 px-4 py-4 sm:px-6">
          <p className="font-[Poppins] text-xs font-semibold uppercase tracking-widest text-zinc-600">
            {t("dashboard.tempoTotal", {}, locale)}</p>
          <p className="mt-1 font-[Poppins] text-2xl font-bold text-white sm:text-3xl">
            {hasData ? formattedTime : "—"}
          </p>
          {usageData?.estimatedUsageTime > 0 && <p className="mt-2 text-sm text-zinc-400" data-usage-estimate>{t("dashboard.time.estimatedNote", {}, locale)}</p>}
          {usageData?.undeterminedSessionCount > 0 && <p className="mt-2 text-sm text-zinc-400">{t("dashboard.time.unavailableNote", {}, locale)}</p>}
        </div>
        <div className="chart-actions flex items-start justify-end px-4 pb-4 sm:px-6">
          <ChartDownloadButton
            containerId="usage-chart"
            fileName={t("dashboard.export.tempo_de_uso")}
            info={t("dashboard.dailyUsageInfo")}
            insight={{
              chart: "usage",
              title: t("dashboard.tempoDeUsoDiario_490", {}, locale),
              filters: dashboardFiltersFromLegacy(filter),
              disabled: isLoading || !hasData,
            }}
          />
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        {!hasRequiredIds && (
          <NoData>
            <p>{t("dashboard.selecioneUmaEntidadeParaVisualizarDados", {}, locale)}</p>
          </NoData>
        )}
        {hasRequiredIds && isLoading && (
          <ChartLoader text={t("common.carregandoDados", {}, locale)} />
        )}
        {hasRequiredIds && isError && (
          <ChartError
            message={apiError(error, "common.erroAoCarregarDados")}
            onRetry={refetch}
          />
        )}
        {hasRequiredIds && !isLoading && !isError && hasData && (
          <div style={{ height: space(300) }}>
            <ChartContainer
              config={chartConfig}
              className="h-full w-full text-white"
            >
              <BarChart
                data={chartData}
                margin={{ left: 12, right: 12, top: 20, bottom: 5 }}
                barSize={36}
                barGap={2}
              >
                <CartesianGrid
                  vertical={false}
                  stroke={chartLine(0.045)}
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={space(32)}
                  height={Math.ceil(font(12) * 1.5) + 8}
                  stroke="rgb(var(--c-neutral-500))"
                  tick={{ fontSize: font(12) }}
                  tickFormatter={(v: string) => formatDay(v, { day: "2-digit", month: "2-digit" })}
                />
                <ChartTooltip trigger={tooltipTrigger}
                  cursor={false}
                  content={(props) => {
                    if (!props.active || !props.payload?.[0]) return null;
                    const d = props.payload[0].payload as any;
                    const date = formatDay(d.date);
                    const secs = Math.round((d.usage ?? 0) * 60);
                    return (
                      <div className="rounded-xl border border-white/10 bg-surface-sunken px-3 py-2.5 text-sm shadow-xl">
                        <p className="mb-1.5 font-[Poppins] font-semibold text-white">
                          {date}
                        </p>
                        <p className="font-[Poppins] text-zinc-400">
                          {t("dashboard.tempo", {}, locale)}{" "}
                          <span className="font-medium text-white">
                            {formatTimeWithDays(secs)}
                          </span>
                        </p>
                        {d.sessions?.length > 0 && (
                          <p className="font-[Poppins] text-zinc-400">
                            {t("dashboard.sessoes", {}, locale)}{" "}
                            <span className="font-medium text-white">
                              {d.sessions.length}
                            </span>
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
                <Bar isAnimationActive={animate}
                  dataKey="usage"
                  fill={CHART_COLORS.primary}
                  radius={[4, 4, 0, 0]}
                  fillOpacity={0.85}
                />
              </BarChart>
            </ChartContainer>
          </div>
        )}
        {hasRequiredIds && !isLoading && !isError && hasData && (
          <ChartDataTable
            title={t("dashboard.tempoDeUsoDiario_490", {}, locale)}
            rows={chartData as { date: string; usage?: number; sessions?: unknown[] }[]}
            rowKey={(row) => row.date}
            columns={[
              { header: t("dashboard.table.data", {}, locale), cell: (row) => formatDay(row.date) },
              {
                header: t("dashboard.table.minutosDeUso", {}, locale),
                numeric: true,
                cell: (row) => typeof row.usage === "number" ? number(row.usage, { maximumFractionDigits: 1 }) : <MissingValue />,
              },
              {
                header: t("dashboard.table.tempoFormatado", {}, locale),
                numeric: true,
                cell: (row) => typeof row.usage === "number" ? formatTimeWithDays(Math.round(row.usage * 60)) : <MissingValue />,
              },
              {
                header: t("dashboard.table.sessoes", {}, locale),
                numeric: true,
                cell: (row) => Array.isArray(row.sessions) ? number(row.sessions.length) : <MissingValue />,
              },
            ]}
            footer={`${t("dashboard.table.total", {}, locale)}: ${formattedTime}`}
          />
        )}
        {hasRequiredIds && !isLoading && !isError && !hasData && (
          <NoData onRetry={refetch}>
            <p>{t("dashboard.nenhumDadoDeUsoDisponivelParaEsta", {}, locale)}</p>
          </NoData>
        )}
      </CardContent>
    </Card>
  );
}
