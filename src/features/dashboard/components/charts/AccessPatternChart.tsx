import { ChartTooltip as Tooltip } from "@/components/ui/chart";
import { apiError } from "@/shared/lib/apiError";
import { chartLine, chartText } from "../../chartColors";
import { CHART_COLORS, useChartPreferences } from "../../chartPreferences";
import { getLanguage, t, useLocale } from "@/i18n";
﻿import { useQuery } from "@tanstack/react-query";
import {
  Scatter,
  ScatterChart,
  Symbols,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  dashboardApi,
  DashboardFilterParams,
} from "@/features/dashboard/api/dashboardApi";
import { ChartLoader, ChartError, NoData } from "../ChartStates";
import { formatDateTime, formatDuration } from "@/shared/lib/formatDate";
import { ChartDownloadButton } from "../ChartDownloadButton";
import { ChartDataTable } from "../ChartDataTable";

const CHART_INFO =
  () => (t("dashboard.cadaPontoRepresentaUmaSessaoDeUso"));

interface SessionData {
  startTime: string;
  endTime: string | null;
  sessionDuration?: number;
  ongoing?: boolean;
  durationSource?: "recorded" | "estimated" | "unavailable" | "observed";
}
interface ProcessedSession {
  day: number;
  hour: number;
  startTime: Date;
  endTime: Date;
  duration: string;
  ongoing?: boolean;
  durationSource: "recorded" | "estimated" | "unavailable" | "observed";
}
interface ChartProps {
  filters: DashboardFilterParams;
}

const DAYS = () => ([t("dashboard.dom"), t("dashboard.seg"), t("dashboard.ter"), t("dashboard.qua"), t("dashboard.qui"), t("dashboard.sex"), t("dashboard.sab")]);

const CustomTooltip = ({ active, payload }: any) => {
  useLocale();

  if (!active || !payload?.length) return null;
  const d: ProcessedSession = payload[0].payload;
  return (
    <div className="rounded-xl border border-white/10 bg-surface-sunken px-3 py-2.5 text-sm shadow-xl space-y-1">
      <p className="font-[Poppins] text-zinc-400">
        {t("dashboard.entrada")}{" "}
        <span className="font-medium text-white">
          {formatDateTime(d.startTime)}
        </span>
      </p>
      <p className="font-[Poppins] text-zinc-400">
        {t("dashboard.saida")}{" "}
        <span className="font-medium text-white">
          {d.ongoing ? t("dashboard.time.ongoing") : formatDateTime(d.endTime)}
        </span>
      </p>
      <p className="border-t border-white/10 pt-1 font-[Poppins] text-zinc-400">
        {t("dashboard.duracao")}{" "}<span className="font-medium text-white">{d.durationSource === "unavailable" ? t("dashboard.time.unavailable") : d.duration}</span>
      </p>
      {d.durationSource === "estimated" && <p className="text-xs text-zinc-400">{t("dashboard.time.estimatedNote")}</p>}
    </div>
  );
};

function useSessionData(filters: ChartProps["filters"]) {
  useLocale();

  return useQuery({
    queryKey: ["individualSessions", filters],
    queryFn: () =>
      dashboardApi.getSessionDetails(filters).then((res) => res.data),
    enabled: !!(
      filters.universityId &&
      (filters.studentId || filters.classId || filters.courseId)
    ),
    staleTime: 30_000,
    refetchInterval: 30_000,
    select: (apiData: SessionData[] | undefined) => {
      if (!apiData) return [];
      return apiData.map((s) => {
        const start = new Date(s.startTime);
        const end = new Date(s.endTime || s.startTime);
        return {
          day: start.getDay(),
          hour: start.getHours() + start.getMinutes() / 60,
          startTime: start,
          endTime: end,
          duration: typeof s.sessionDuration === "number" ? formatDuration(new Date(s.sessionDuration * 1000), new Date(0)) : formatDuration(end, start),
          ongoing: s.ongoing,
          durationSource: s.durationSource ?? "recorded",
        };
      });
    },
  });
}

export function AccessPatternChart({ filters }: ChartProps) {
  useLocale();
  const { animate, font, space, tooltipTrigger } = useChartPreferences();

  const {
    data: sessions,
    isLoading,
    isError,
    error,
    refetch,
  } = useSessionData(filters);
  const hasData = sessions && sessions.length > 0;
  const hasRequiredIds = !!(
    filters.universityId &&
    (filters.studentId || filters.classId || filters.courseId)
  );

  return (
    <Card
      id="access-pattern-chart"
      className="dashboard-chart bg-surface border-white/10 flex flex-col"
    >
      <CardHeader className="dashboard-chart-header grid gap-0 p-0 space-y-0 border-b border-white/10">
        <div className="chart-heading min-w-0 px-4 py-5 sm:px-6">
          <div>
            <CardTitle className="text-white font-[Poppins]">
              {t("dashboard.detalhesDeAcessoPorSessao")}</CardTitle>
            <CardDescription className="text-white/50 font-[Poppins] mt-1">
              {t("dashboard.cadaPontoEUmaSessaoPasseO")}</CardDescription>
          </div>
        </div>
        <div className="chart-actions flex items-start justify-end px-4 pb-4 sm:px-6">
          <ChartDownloadButton
            containerId="access-pattern-chart"
            fileName={t("dashboard.export.padrao_acesso")}
            info={CHART_INFO()}
            insight={{
              chart: "access-pattern",
              title: t("dashboard.padraoDeAcesso"),
              filters,
              disabled: isLoading || !hasData,
            }}
          />
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        {!hasRequiredIds && (
          <NoData onRetry={refetch}>
            <p>
              {t("dashboard.selecioneUmAlunoTurmaOuCursoPara")}</p>
          </NoData>
        )}
        {hasRequiredIds && isLoading && (
          <ChartLoader text={t("common.carregandoDados")} />
        )}
        {hasRequiredIds && isError && (
          <ChartError message={apiError(error, "common.erroAoCarregarDados")} onRetry={refetch} />
        )}
        {hasRequiredIds && !isLoading && !isError && hasData && (
          <div style={{ height: space(300) }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 10, right: space(20), bottom: 10, left: 0 }}
              >
                <CartesianGrid stroke={chartLine(0.08)} />
                <XAxis
                  type="number"
                  dataKey="hour"
                  name={t("dashboard.axisHour")}
                  domain={[0, 24]}
                  ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24]}
                  tickFormatter={(h) => `${Math.floor(h)}h`}
                  stroke={chartLine(0.3)}
                  height={Math.ceil(font(12) * 1.5) + 12}
                  tick={{ fill: chartText(0.5), fontSize: font(12) }}
                />
                <YAxis
                  type="number"
                  dataKey="day"
                  name={t("dashboard.axisDay")}
                  domain={[-0.5, 6.5]}
                  ticks={[0, 1, 2, 3, 4, 5, 6]}
                  tickFormatter={(d) => DAYS()[d]}
                  stroke={chartLine(0.3)}
                  width={space(60)}
                  tick={{ fill: chartText(0.5), fontSize: font(12) }}
                />
                <Tooltip trigger={tooltipTrigger}
                  cursor={{ strokeDasharray: "3 3" }}
                  content={<CustomTooltip />}
                />
                <Scatter isAnimationActive={animate}
                  data={sessions}
                  fill={CHART_COLORS.accent}
                  fillOpacity={0.75}
                  shape={(point: any) => (
                    <>
                      <title>{`${formatDateTime(point.payload.startTime)} — ${point.payload.duration}`}</title>
                      <Symbols {...point} type="circle" />
                    </>
                  )}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
        {hasRequiredIds && !isLoading && !isError && hasData && (
          <ChartDataTable
            title={t("dashboard.padraoDeAcesso")}
            rows={sessions}
            rowKey={(row, index) => `${row.startTime.getTime()}-${index}`}
            columns={[
              { header: t("dashboard.table.entrada"), cell: (row) => formatDateTime(row.startTime) },
              { header: t("dashboard.table.saida"), cell: (row) => row.ongoing ? t("dashboard.time.ongoing") : formatDateTime(row.endTime) },
              { header: t("dashboard.table.duracao"), numeric: true, cell: (row) => row.durationSource === "unavailable" ? t("dashboard.time.unavailable") : row.duration },
              { header: t("dashboard.time.source"), cell: (row) => t(row.durationSource === "observed" ? "dashboard.time.observed" : row.durationSource === "estimated" ? "dashboard.time.estimated" : row.durationSource === "unavailable" ? "dashboard.time.unavailable" : "dashboard.time.recorded") },
              { header: t("dashboard.table.diaDaSemana"), cell: (row) => row.startTime.toLocaleDateString(getLanguage(), { weekday: "long" }) },
            ]}
            footer={`${t("dashboard.table.total")}: ${sessions.length}`}
          />
        )}
        {hasRequiredIds && !isLoading && !isError && !hasData && (
          <NoData onRetry={refetch}>
            <p>{t("dashboard.nenhumDadoDeSessaoDisponivelParaEsta")}</p>
          </NoData>
        )}
      </CardContent>
    </Card>
  );
}
