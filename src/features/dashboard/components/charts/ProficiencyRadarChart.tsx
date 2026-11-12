import { apiError } from "@/shared/lib/apiError";
import { chartLine, chartText } from "../../chartColors";
import { CHART_COLORS, useChartPreferences } from "../../chartPreferences";
import { subjectLabel } from "../../subjectLabels";
import { percent, t, useLocale } from "@/i18n";
import { useQuery } from "@tanstack/react-query";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  PolarRadiusAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { dashboardApi } from "@/features/dashboard/api/dashboardApi";
import { ChartLoader, ChartError, NoData } from "../ChartStates";
import { ChartDownloadButton } from "../ChartDownloadButton";
import { ChartDataTable, MissingValue } from "../ChartDataTable";

const CHART_INFO =
  () => `${t("dashboard.nivelDeAcertoMedioPorAssuntoNo")} ${t("dashboard.proficiencyCoverage")}`;

const chartConfig = {
  score: { get label() { return t("dashboard.acerto"); }, color: CHART_COLORS.primary },
} satisfies ChartConfig;

interface ChartProps {
  filters: {
    universityId?: string;
    courseId?: string;
    classId?: string;
    studentId?: string;
    disciplineId?: string;
  };
}

function useProficiencyData(filters: ChartProps["filters"]) {
  useLocale();

  return useQuery({
    queryKey: ["proficiencyRadar", filters],
    queryFn: () => dashboardApi.getProficiencyRadar(filters),
    enabled: !!filters.universityId,
    staleTime: 1000 * 60 * 5,
    select: (response) => {
      const apiData = response.data;
      const labels = apiData.labels;
      const chartData = labels.map((label) => {
        const index = apiData.labels.indexOf(label);
        const hasResponses = index >= 0 && Number.isFinite(apiData.data[index]);
        return {
          subject: subjectLabel(label),
          score: hasResponses ? apiData.data[index] : 0,
          hasResponses,
        };
      });
      const interacted = chartData.filter((item) => item.hasResponses);
      const hasPerformanceData = interacted.length > 0;
      const avg =
        interacted.length > 0
          ? interacted.reduce((s, d) => s + d.score, 0) / interacted.length
          : 0;
      const best =
        interacted.length > 0
          ? interacted.reduce(
              (m, d) => (d.score > m.score ? d : m),
              interacted[0],
            )
          : { subject: "-", score: 0 };
      const worst =
        interacted.length > 0
          ? interacted.reduce(
              (m, d) => (d.score < m.score ? d : m),
              interacted[0],
            )
          : { subject: "-", score: 0 };
      return {
        chartData,
        hasPerformanceData,
        metrics: hasPerformanceData ? { average: avg, best, worst } : null,
      };
    },
  });
}

export function ProficiencyRadarChart({ filters }: ChartProps) {
  useLocale();

  const { data, isLoading, isError, refetch, error } =
    useProficiencyData(filters);
  const hasRequired = !!filters.universityId;
  const hasData = !!data?.chartData.length;
  const hasAnswers = data?.hasPerformanceData ?? false;
  const refetchTyped = refetch as () => void;
  const errorMessage =
    apiError(error, "common.erroAoCarregarDados");
  const { animate, font, space } = useChartPreferences();

  return (
    <Card
      id="proficiency-radar-chart"
      className="bg-surface border-white/10 flex flex-col h-full"
    >
      <CardHeader className="relative flex flex-col p-0 space-y-0 border-b border-white/10">
        <div className="flex items-start justify-between px-6 py-5 pr-36">
          <div>
            <CardTitle className="text-white font-[Poppins]">
              {t("dashboard.proficienciaPorAssuntoQuiz")}</CardTitle>
            <CardDescription className="text-white/50 font-[Poppins] mt-1">
              {t("dashboard.nivelDeAcertoMedioEmCadaAssunto")}</CardDescription>
          </div>
        </div>
        <div className="absolute top-5 right-4 z-40">
          <ChartDownloadButton
            containerId="proficiency-radar-chart"
            fileName={t("dashboard.export.proficiencia_radar")}
            info={CHART_INFO()}
            insight={{
              chart: "proficiency-radar",
              title: t("dashboard.proficienciaPorAssunto"),
              filters,
              disabled: isLoading || !hasAnswers,
            }}
          />
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col min-h-0 px-2 sm:p-6">
        {!hasRequired && (
          <NoData onRetry={refetchTyped}>
            <p>
              {t("dashboard.selecioneUmaUniversidadeParaVisualizarORadar")}</p>
          </NoData>
        )}
        {hasRequired && isLoading && <ChartLoader text={t("common.carregandoDados")} />}
        {hasRequired && isError && (
          <ChartError message={errorMessage} onRetry={refetchTyped} />
        )}
        {hasRequired && !isLoading && !isError && hasData && (
          <div className="relative flex-1 min-h-[260px]">
            <ChartContainer
              config={chartConfig}
              className="absolute inset-0 h-full w-full text-white"
            >
              <RadarChart
                data={data!.chartData}
                margin={{ top: space(20), right: space(36), bottom: space(20), left: space(36) }}
              >
                <ChartTooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const entry = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-white/10 bg-surface-sunken px-3 py-2.5 text-sm shadow-xl">
                        <p className="mb-1 font-[Poppins] font-semibold text-white">
                          {entry.subject}
                        </p>
                        <p className="font-[Poppins] text-zinc-400">
                          {t("dashboard.acerto_479")}{" "}
                          <span className="font-medium text-white">
                            {entry.hasResponses ? percent(entry.score / 100, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : t("dashboard.noQuizAnswers")}
                          </span>
                        </p>
                      </div>
                    );
                  }}
                />
                <PolarGrid
                  gridType="polygon"
                  stroke={chartLine(0.1)}
                  strokeDasharray="2 2"
                />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: chartText(0.6), fontSize: font(11) }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar isAnimationActive={animate}
                  dataKey="score"
                  fill={CHART_COLORS.primary}
                  fillOpacity={0.25}
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  dot={(props: any) => props.payload?.payload?.hasResponses
                    ? <circle key={props.index} cx={props.cx} cy={props.cy} r={4} fill={CHART_COLORS.primary} />
                    : <g key={props.index} />}
                />
              </RadarChart>
            </ChartContainer>
          </div>
        )}
        {hasRequired && !isLoading && !isError && hasData && (
          <ChartDataTable
            title={t("dashboard.proficienciaPorAssunto")}
            rows={data!.chartData}
            rowKey={(row, index) => `${row.subject}-${index}`}
            columns={[
              { header: t("dashboard.table.assunto"), cell: (row) => row.subject },
              {
                header: t("dashboard.table.acertoMedio"),
                numeric: true,
                cell: (row) => row.hasResponses
                  ? percent(row.score / 100, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                  : <MissingValue label={t("dashboard.table.semRespostas")} />,
              },
            ]}
          />
        )}
        {hasRequired && !isLoading && !isError && !hasData && (
          <NoData onRetry={refetchTyped}>
            <p>{t("dashboard.nenhumDadoDeProficienciaDisponivel")}</p>
          </NoData>
        )}
      </CardContent>

      {hasAnswers && (
        <CardFooter className="flex justify-between items-center px-6 py-4 border-t border-white/10">
          <div className="flex items-center gap-4">
            <span className="font-[Poppins] text-sm text-zinc-400">
              {t("common.media")}{" "}
              <span className="font-semibold text-white">
                {percent((data!.metrics?.average) / 100, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </span>
            </span>
            <span className="text-white/20">|</span>
            <span className="font-[Poppins] text-sm text-zinc-400">
              {t("dashboard.melhor")}{" "}
              <span className="font-semibold text-white">
                {data!.metrics?.best.subject}
              </span>
            </span>
            <span className="text-white/20">|</span>
            <span className="font-[Poppins] text-sm text-zinc-400">
              {t("dashboard.aMelhorar")}{" "}
              <span className="font-semibold text-white">
                {data!.metrics?.worst.subject}
              </span>{" "}
              <span className="text-zinc-600">
                ({percent((data!.metrics?.worst.score) / 100, { minimumFractionDigits: 1, maximumFractionDigits: 1 })})
              </span>
            </span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
