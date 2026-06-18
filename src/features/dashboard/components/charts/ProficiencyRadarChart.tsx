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

const CHART_INFO =
  "Nível de acerto médio (%) por assunto no quiz. Quanto maior a área preenchida, maior o domínio naquele tópico. Ajuda a identificar onde concentrar os esforços de ensino.";

const chartConfig = {
  score: { label: "Acerto", color: "#3b82f6" },
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
  return useQuery({
    queryKey: ["proficiencyRadar", filters],
    queryFn: () => dashboardApi.getProficiencyRadar(filters),
    enabled: !!filters.universityId,
    staleTime: 1000 * 60 * 5,
    select: (response) => {
      const apiData = response.data;
      const subjectMap: Record<string, string[]> = {
        Variáveis: ["variáveis", "variaveis"],
        Listas: ["listas"],
        Condicionais: [
          "condicionais",
          "o_que_são_condicionais",
          "verificacoes",
        ],
        Funções: ["funções", "funcoes"],
        "Op. Lógicos": ["operadores_lógicos", "operadores_logicos"],
      };
      const chartData = Object.entries(subjectMap).map(([label, keys]) => {
        const index =
          apiData.labels?.findIndex((l: string) =>
            keys.some((k) => l.toLowerCase() === k.toLowerCase()),
          ) ?? -1;
        return {
          subject: label,
          score: index !== -1 ? (apiData.data?.[index] ?? 0) : 0,
        };
      });
      const hasPerformanceData = chartData.some((d) => d.score > 0);
      const interacted = chartData.filter((d) => d.score > 0);
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
  const { data, isLoading, isError, refetch, error } =
    useProficiencyData(filters);
  const hasRequired = !!filters.universityId;
  const hasData = data?.hasPerformanceData ?? false;
  const refetchTyped = refetch as () => void;
  const errorMessage =
    error instanceof Error ? error.message : "Erro ao carregar dados.";

  return (
    <Card
      id="proficiency-radar-chart"
      className="bg-[#1f1f1f] border-white/10 flex flex-col h-full"
    >
      <CardHeader className="relative flex flex-col p-0 space-y-0 border-b border-white/10">
        <div className="flex items-start justify-between px-6 py-5 pr-36">
          <div>
            <CardTitle className="text-white font-[Poppins]">
              Proficiência por Assunto: Quiz
            </CardTitle>
            <CardDescription className="text-white/50 font-[Poppins] mt-1">
              Nível de acerto médio em cada assunto principal
            </CardDescription>
          </div>
        </div>
        <div className="absolute top-5 right-4 z-40">
          <ChartDownloadButton
            containerId="proficiency-radar-chart"
            fileName="proficiencia_radar"
            info={CHART_INFO}
            insight={{
              chart: "proficiency-radar",
              title: "Proficiência por assunto",
              filters,
              disabled: isLoading || !hasData,
            }}
          />
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col min-h-0 px-2 sm:p-6">
        {!hasRequired && (
          <NoData onRetry={refetchTyped}>
            <p>
              Selecione uma universidade para visualizar o radar de
              proficiência.
            </p>
          </NoData>
        )}
        {hasRequired && isLoading && <ChartLoader text="Carregando dados..." />}
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
                margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
              >
                <ChartTooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const entry = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-white/10 bg-[#141414] px-3 py-2.5 text-sm shadow-xl">
                        <p className="mb-1 font-[Poppins] font-semibold text-white">
                          {entry.subject}
                        </p>
                        <p className="font-[Poppins] text-zinc-400">
                          Acerto:{" "}
                          <span className="font-medium text-white">
                            {entry.score.toFixed(1)}%
                          </span>
                        </p>
                      </div>
                    );
                  }}
                />
                <PolarGrid
                  gridType="polygon"
                  stroke="rgba(255,255,255,0.1)"
                  strokeDasharray="2 2"
                />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, "dataMax"]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  dataKey="score"
                  fill="#3b82f6"
                  fillOpacity={0.25}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", strokeWidth: 0, r: 4 }}
                />
              </RadarChart>
            </ChartContainer>
          </div>
        )}
        {hasRequired && !isLoading && !isError && !hasData && (
          <NoData onRetry={refetchTyped}>
            <p>Nenhum dado de proficiência disponível.</p>
          </NoData>
        )}
      </CardContent>

      {hasData && (
        <CardFooter className="flex justify-between items-center px-6 py-4 border-t border-white/10">
          <div className="flex items-center gap-4">
            <span className="font-[Poppins] text-sm text-zinc-400">
              Média:{" "}
              <span className="font-semibold text-white">
                {data!.metrics?.average.toFixed(1)}%
              </span>
            </span>
            <span className="text-white/20">|</span>
            <span className="font-[Poppins] text-sm text-zinc-400">
              Melhor:{" "}
              <span className="font-semibold text-white">
                {data!.metrics?.best.subject}
              </span>
            </span>
            <span className="text-white/20">|</span>
            <span className="font-[Poppins] text-sm text-zinc-400">
              A melhorar:{" "}
              <span className="font-semibold text-white">
                {data!.metrics?.worst.subject}
              </span>{" "}
              <span className="text-zinc-600">
                ({data!.metrics?.worst.score.toFixed(1)}%)
              </span>
            </span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
