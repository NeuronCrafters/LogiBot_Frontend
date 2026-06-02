import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { AreaChart, Area, XAxis, CartesianGrid } from "recharts";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { dashboardApi } from "@/services/api/api_dashboard";
import { ChartLoader, ChartError, NoData } from "../ChartStates";
import { ChartDownloadButton } from "../ChartDownloadButton";

const CHART_INFO =
  "Evolução do desempenho do estudante ao longo das questões respondidas no quiz. Uma curva ascendente indica aprendizado progressivo; quedas indicam tópicos de maior dificuldade.";

interface ApiData {
  labels: string[];
  data: number[];
}
interface ChartData {
  name: string;
  performance: number;
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

const chartConfig = {
  performance: { label: "Desempenho", color: "#10b981" },
} satisfies ChartConfig;

function useChartData(filters: ChartProps["filters"]) {
  return useQuery<ApiData, Error, ChartData[]>({
    queryKey: ["learningJourney", filters],
    queryFn: () =>
      dashboardApi.getLearningJourney(filters).then((res) => res.data),
    enabled: !!filters.universityId,
    staleTime: 1000 * 60 * 5,
    select: (apiData) => {
      if (!apiData?.labels?.length) return [];
      return apiData.labels.map((label, i) => ({
        name: label,
        performance: apiData.data[i],
      }));
    },
  });
}

export function LearningJourneyChart({ filters }: ChartProps) {
  const { data, isLoading, isError, error, refetch } = useChartData(filters);
  const hasData = data && data.length > 0;
  const hasRequiredIds = !!filters.universityId;

  const summary = useMemo(() => {
    if (!data || data.length < 2) return null;
    const peak = data.reduce(
      (m, d) => (d.performance > m.performance ? d : m),
      data[0],
    );
    const low = data.reduce(
      (m, d) => (d.performance < m.performance ? d : m),
      data[0],
    );
    return { peak, low };
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
              Evolução do desempenho ao longo das questões
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
            <p>
              Selecione uma universidade para visualizar a Jornada de
              Aprendizagem.
            </p>
          </NoData>
        )}
        {hasRequiredIds && isLoading && (
          <ChartLoader text="Carregando dados..." />
        )}
        {hasRequiredIds && isError && (
          <ChartError message={(error as Error)?.message} onRetry={refetch} />
        )}
        {hasRequiredIds && !isLoading && !isError && hasData && (
          <div className="h-[300px]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <AreaChart
                data={data}
                margin={{ left: 12, right: 12, top: 10, bottom: 5 }}
              >
                <defs>
                  <linearGradient
                    id="performanceGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="rgba(255,255,255,0.08)"
                />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                  tickFormatter={(v) => v.replace("Questões ", "Q")}
                  interval="preserveStartEnd"
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      className="bg-[#141414] border-white/10 text-white rounded-xl"
                      indicator="line"
                      labelStyle={{ color: "#fff", fontWeight: "bold" }}
                      formatter={(value) => [
                        `${Number(value).toFixed(1)}%`,
                        "Desempenho",
                      ]}
                    />
                  }
                />
                <Area
                  dataKey="performance"
                  type="natural"
                  fill="url(#performanceGrad)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        )}
        {hasRequiredIds && !isLoading && !isError && !hasData && (
          <NoData onRetry={refetch}>
            <p>Nenhum dado de jornada disponível para esta entidade.</p>
          </NoData>
        )}
      </CardContent>

      {summary && (
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 px-6 py-4 border-t border-white/10">
          <div>
            <p className="font-[Poppins] text-xs text-zinc-500">
              Pico de Desempenho
            </p>
            <p className="font-[Poppins] font-bold text-white mt-0.5">
              {summary.peak.performance.toFixed(1)}%
              <span className="ml-1.5 font-normal text-zinc-500 text-sm">
                em "{summary.peak.name}"
              </span>
            </p>
          </div>
          <div className="sm:text-right">
            <p className="font-[Poppins] text-xs text-zinc-500">
              Ponto de Dificuldade
            </p>
            <p className="font-[Poppins] font-bold text-white mt-0.5">
              {summary.low.performance.toFixed(1)}%
              <span className="ml-1.5 font-normal text-zinc-500 text-sm">
                em "{summary.low.name}"
              </span>
            </p>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
