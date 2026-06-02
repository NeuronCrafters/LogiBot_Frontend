import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { dashboardApi } from "@/services/api/api_dashboard";
import { ChartLoader, ChartError, NoData } from "../ChartStates";
import { ChartDownloadButton } from "../ChartDownloadButton";

const CHART_INFO =
  "Mostra a evolucao da taxa de acerto por quiz concluido. Para turmas, cursos ou universidade, cada ponto representa a media do quiz correspondente entre os alunos.";

interface ApiData {
  labels: string[];
  data: number[];
}

interface ChartData {
  name: string;
  shortName: string;
  performance: number;
  deltaFromPrevious: number | null;
}

interface ChartProps {
  filters: {
    universityId?: string;
    courseId?: string;
    classId?: string;
    studentId?: string;
    disciplineId?: string;
  };
}

function useChartData(filters: ChartProps["filters"]) {
  return useQuery<ApiData, Error, ChartData[]>({
    queryKey: ["learningJourney", filters],
    queryFn: () =>
      dashboardApi.getLearningJourney(filters).then((res) => res.data),
    enabled: !!filters.universityId,
    staleTime: 1000 * 60 * 5,
    select: (apiData) => {
      if (!apiData?.labels?.length) return [];

      return apiData.labels.map((label, i) => {
        const performance = apiData.data[i] ?? 0;
        return {
          name: label,
          shortName: label.replace("Quiz ", "Q"),
          performance,
          deltaFromPrevious:
            i === 0 ? null : Number((performance - apiData.data[i - 1]).toFixed(1)),
        };
      });
    },
  });
}

export function LearningJourneyChart({ filters }: ChartProps) {
  const { data, isLoading, isError, error, refetch } = useChartData(filters);
  const hasData = data && data.length > 0;
  const hasRequiredIds = !!filters.universityId;
  const scopeLabel = filters.studentId ? "do estudante" : "media do grupo";

  const summary = useMemo(() => {
    if (!data?.length) return null;

    const average =
      data.reduce((sum, item) => sum + item.performance, 0) / data.length;
    const peak = data.reduce(
      (best, item) => (item.performance > best.performance ? item : best),
      data[0],
    );
    const low = data.reduce(
      (worst, item) => (item.performance < worst.performance ? item : worst),
      data[0],
    );
    const first = data[0];
    const last = data[data.length - 1];
    const evolution = Number((last.performance - first.performance).toFixed(1));
    const trend =
      evolution > 0
        ? "em alta"
        : evolution < 0
          ? "em queda"
          : "estavel";

    return {
      average: Number(average.toFixed(1)),
      peak,
      low,
      evolution,
      trend,
    };
  }, [data]);

  return (
    <Card
      id="learning-journey-chart"
      className="bg-[#1f1f1f] border-white/10 flex flex-col"
    >
      <CardHeader className="relative flex flex-col p-0 space-y-0 border-b border-white/10">
        <div className="flex items-start justify-between px-6 py-5 pr-28">
          <div>
            <CardTitle className="text-white font-[Poppins]">
              Jornada de Aprendizagem
            </CardTitle>
            <CardDescription className="text-white/50 font-[Poppins] mt-1">
              Evolucao da taxa de acerto por quiz concluido: {scopeLabel}
            </CardDescription>
          </div>
        </div>
        <div className="absolute top-5 right-4 z-40">
          <ChartDownloadButton
            containerId="learning-journey-chart"
            fileName="jornada_aprendizagem"
            info={CHART_INFO}
          />
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        {!hasRequiredIds && (
          <NoData onRetry={refetch}>
            <p>Selecione uma universidade para visualizar a Jornada de Aprendizagem.</p>
          </NoData>
        )}
        {hasRequiredIds && isLoading && (
          <ChartLoader text="Carregando dados..." />
        )}
        {hasRequiredIds && isError && (
          <ChartError message={(error as Error)?.message} onRetry={refetch} />
        )}
        {hasRequiredIds && !isLoading && !isError && hasData && summary && (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ left: 4, right: 18, top: 16, bottom: 6 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="rgba(255,255,255,0.08)"
                />
                <XAxis
                  dataKey="shortName"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  cursor={{ stroke: "rgba(255,255,255,0.15)", strokeDasharray: "4 4" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload as ChartData;
                    const delta =
                      item.deltaFromPrevious === null
                        ? "primeiro quiz"
                        : `${item.deltaFromPrevious > 0 ? "+" : ""}${item.deltaFromPrevious.toFixed(1)} p.p. vs. quiz anterior`;

                    return (
                      <div className="rounded-xl border border-white/10 bg-[#141414] px-3 py-2.5 text-sm shadow-xl">
                        <p className="mb-1 font-[Poppins] font-bold text-white">
                          {item.name}
                        </p>
                        <p className="font-[Poppins] text-zinc-400">
                          Taxa de acerto:{" "}
                          <span className="font-medium text-white">
                            {item.performance.toFixed(1)}%
                          </span>
                        </p>
                        <p className="font-[Poppins] text-zinc-400">
                          Variacao:{" "}
                          <span className="font-medium text-white">{delta}</span>
                        </p>
                      </div>
                    );
                  }}
                />
                <ReferenceLine
                  y={summary.average}
                  stroke="rgba(255,255,255,0.35)"
                  strokeDasharray="4 4"
                  label={{
                    value: `Media ${summary.average.toFixed(1)}%`,
                    fill: "rgba(255,255,255,0.55)",
                    fontSize: 11,
                    position: "insideTopLeft",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="performance"
                  stroke="#10b981"
                  strokeWidth={2.75}
                  dot={{ r: 4, strokeWidth: 2, stroke: "#1f1f1f", fill: "#10b981" }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: "#1f1f1f" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {hasRequiredIds && !isLoading && !isError && !hasData && (
          <NoData onRetry={refetch}>
            <p>Nenhum dado de jornada disponivel para esta entidade.</p>
          </NoData>
        )}
      </CardContent>

      {summary && (
        <CardFooter className="grid grid-cols-1 gap-4 border-t border-white/10 px-6 py-4 sm:grid-cols-4">
          <div>
            <p className="font-[Poppins] text-xs text-zinc-500">Media Geral</p>
            <p className="mt-0.5 font-[Poppins] font-bold text-white">
              {summary.average.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="font-[Poppins] text-xs text-zinc-500">Evolucao</p>
            <p
              className="mt-0.5 font-[Poppins] font-bold"
              style={{ color: summary.evolution >= 0 ? "#10b981" : "#ef4444" }}
            >
              {summary.evolution > 0 ? "+" : ""}
              {summary.evolution.toFixed(1)} p.p.
              <span className="ml-1 font-normal text-zinc-500 text-sm">
                {summary.trend}
              </span>
            </p>
          </div>
          <div>
            <p className="font-[Poppins] text-xs text-zinc-500">Melhor Quiz</p>
            <p className="mt-0.5 font-[Poppins] font-bold text-white">
              {summary.peak.name}
              <span className="ml-1.5 font-normal text-zinc-500 text-sm">
                {summary.peak.performance.toFixed(1)}%
              </span>
            </p>
          </div>
          <div>
            <p className="font-[Poppins] text-xs text-zinc-500">Ponto Critico</p>
            <p className="mt-0.5 font-[Poppins] font-bold text-white">
              {summary.low.name}
              <span className="ml-1.5 font-normal text-zinc-500 text-sm">
                {summary.low.performance.toFixed(1)}%
              </span>
            </p>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
