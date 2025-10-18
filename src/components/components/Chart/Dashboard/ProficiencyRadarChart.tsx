import { useQuery } from "@tanstack/react-query";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, PolarRadiusAxis } from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { motion } from "framer-motion";
import { dashboardApi } from "@/services/api/api_dashboard";

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

// Hook de dados refatorado para seguir o padrão do CategoryChart
function useProficiencyData(filters: ChartProps['filters']) {
  const hasRequiredFilters = !!filters.universityId;

  return useQuery({
    queryKey: ['proficiencyRadar', filters],
    queryFn: () => dashboardApi.getProficiencyRadar(filters),
    enabled: hasRequiredFilters,
    staleTime: 1000 * 60 * 5, // 5 minutos
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

      // Métricas opcionais
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
  const { data, isLoading, isError, refetch } = useProficiencyData(filters);

  // Lógica de verificação replicada para a UI
  const hasRequired = !!filters.universityId;
  const hasData = data?.hasPerformanceData ?? false;

  return (
    <Card className="bg-[#1f1f1f] border-white/10 flex flex-col h-full">
      <CardHeader className="flex flex-col pb-4 space-y-0 border-b border-white/10">
        <CardTitle className="text-white">Proficiência por Assunto: Quiz</CardTitle>
        <CardDescription className="text-white/70">Nível de acerto médio em cada assunto principal.</CardDescription>
      </CardHeader>

      <CardContent className="px-2 sm:p-6 h-[299px] flex items-center justify-center">
        {/* Bloco de renderização condicional unificado, igual ao CategoryChart */}
        {(!hasRequired || isLoading || isError || !hasData) && (
          <div className="flex flex-col items-center text-center">
            {isLoading && <div className="mb-3 w-10 h-10 rounded-full animate-pulse bg-indigo-600/30"></div>}
            {isError && (
              <svg className="mb-3 text-indigo-400/60" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            {!isLoading && !isError && !hasRequired && <p className="text-white/70">Selecione uma universidade para visualizar.</p>}
            {!isLoading && !isError && hasRequired && !hasData && <p className="text-white/70">Nenhum dado de proficiência disponível.</p>}
            {(isError || (!hasData && hasRequired)) && (
              <button onClick={() => refetch()} className="mt-3 text-xs text-indigo-400 transition-colors hover:text-indigo-300">Tentar novamente</button>
            )}
          </div>
        )}

        {/* Renderização do gráfico quando há dados */}
        {!isLoading && !isError && hasData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="w-full h-full">
            <ChartContainer config={chartConfig} className="w-full h-full text-white aspect-auto">
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
      </CardContent>

      {/* Rodapé condicional, exibindo as métricas calculadas no hook */}
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