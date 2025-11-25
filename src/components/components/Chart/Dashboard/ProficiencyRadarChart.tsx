import { useQuery } from "@tanstack/react-query";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, PolarRadiusAxis } from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { motion } from "framer-motion";
import { dashboardApi } from "@/services/api/api_dashboard";
import { ChartLoader, ChartError, NoData } from "../ChartStates";
import { ChartExportMenu } from "../ChartExportMenu";

const chartConfig = {
  score: {
    label: "Acerto",
    color: "#274a96",
  },
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

function useProficiencyData(filters: ChartProps['filters']) {
  const hasRequiredFilters = !!filters.universityId;

  return useQuery({
    queryKey: ['proficiencyRadar', filters],
    queryFn: () => dashboardApi.getProficiencyRadar(filters),
    enabled: hasRequiredFilters,
    staleTime: 1000 * 60 * 5,
    select: (response) => {
      const apiData = response.data;

      const fixedSubjects = ['Variáveis', 'Tipos', 'Funções', 'Loops', 'Verificações', 'listas'];

      const chartData = fixedSubjects.map(subject => {
        const index = apiData.labels?.findIndex(l => l.toLowerCase() === subject.toLowerCase());
        return {
          subject,
          score: index !== -1 ? apiData.data?.[index] ?? 0 : 0
        };
      });

      const hasPerformanceData = chartData.some(item => item.score > 0);

      const interactedData = chartData.filter(item => item.score > 0);
      const totalScore = interactedData.reduce((sum, item) => sum + item.score, 0);
      const averageScore = interactedData.length > 0 ? totalScore / interactedData.length : 0;
      const bestSubject = interactedData.reduce((max, item) => item.score > max.score ? item : max, interactedData[0]);
      const worstSubject = interactedData.reduce((min, item) => item.score < min.score ? item : min, interactedData[0]);

      const metrics = hasPerformanceData ? {
        average: averageScore,
        best: bestSubject,
        worst: worstSubject,
      } : null;

      return { chartData, hasPerformanceData, metrics };
    }
  });
}

export function ProficiencyRadarChart({ filters }: ChartProps) {
  const { data, isLoading, isError, refetch, error } = useProficiencyData(filters);

  const hasRequired = !!filters.universityId;
  const hasData = data?.hasPerformanceData ?? false;

  const refetchTyped = refetch as () => void;
  const errorMessage = error instanceof Error ? error.message : "Erro ao carregar dados.";

  return (
    <Card id="proficiency-radar-chart" className="bg-[#1f1f1f] border-white/10 w-full mb-6">
      <CardHeader className="relative flex flex-col items-stretch p-0 space-y-0 border-b border-white/10">
        <div className="flex flex-col flex-1 gap-1 justify-center px-6 py-5">
          <CardTitle className="text-white">Proficiência por Assunto: Quiz</CardTitle>
          <CardDescription className="text-white/70">
            Nível de acerto médio em cada assunto principal.
          </CardDescription>
        </div>

        <div className="flex">
          <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t border-white/10 px-6 py-4 text-left invisible h-0" aria-hidden="true" />
        </div>

        <div className="absolute top-5 right-4 z-40">
          <ChartExportMenu containerId="proficiency-radar-chart" fileName="proficiencia_radar" />
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        {!hasRequired && (
          <NoData onRetry={refetchTyped}>
            <p>Selecione uma universidade para visualizar o radar de proficiência.</p>
          </NoData>
        )}

        {hasRequired && isLoading && <ChartLoader text="Carregando dados..." />}

        {hasRequired && isError && <ChartError message={errorMessage} onRetry={refetchTyped} />}

        {hasRequired && !isLoading && !isError && hasData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full text-white">
              <RadarChart data={data!.chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <ChartTooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const entry = payload[0].payload;
                    return (
                      <div className="p-2 bg-[#1f1f1f] border border-[#333] rounded shadow text-white text-sm">
                        <p className="mb-1 font-semibold">{entry.subject}</p>
                        <p><span className="text-[#999] mr-2">Acerto:</span><span className="font-medium">{entry.score.toFixed(1)}%</span></p>
                      </div>
                    );
                  }}
                />
                <PolarGrid gridType="polygon" radialLines stroke="#d4d0d0" strokeOpacity={0.6} strokeDasharray="2 2" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#FFF', fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} tick={false} axisLine={false} />
                <Radar dataKey="score" fill="#274a96" fillOpacity={0.3} stroke="#274a96" strokeWidth={2} dot={{ fill: '#274a96', strokeWidth: 0, r: 4 }} />
              </RadarChart>
            </ChartContainer>
          </motion.div>
        )}

        {hasRequired && !isLoading && !isError && !hasData && (
          <NoData onRetry={refetchTyped}>
            <p>Nenhum dado de proficiência disponível.</p>
          </NoData>
        )}
      </CardContent>

      {hasData && (
        <CardFooter className="flex justify-between items-center px-6 py-4 border-t border-white/10">
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-white">Média de Acerto: {data!.metrics?.average.toFixed(1)}%</span>
              <span className="text-white/50">|</span>
              <span className="font-medium text-white">Melhor: {data!.metrics?.best.subject}</span>
            </div>
            <div className="mt-1">
              <span className="text-sm text-white/70">A Melhorar: {data!.metrics?.worst.subject} ({data!.metrics?.worst.score.toFixed(1)}%)</span>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}