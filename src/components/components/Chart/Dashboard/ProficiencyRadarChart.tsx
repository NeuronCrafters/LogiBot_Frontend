import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, PolarRadiusAxis } from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { motion } from "framer-motion";
import { dashboardApi } from "@/services/api/api_dashboard";

interface ChartProps {
  filters: { universityId?: string; courseId?: string; classId?: string; studentId?: string; disciplineId?: string; };
}

// Usando o mesmo padrão de cor do seu exemplo de referência
const chartConfig = {
  score: {
    label: "Acerto",
    color: "#274a96",
  },
} satisfies ChartConfig;

function useChartData(filters: ChartProps['filters']) {
  // Flag para verificar se os filtros mínimos necessários estão presentes
  const hasRequiredFilters = !!filters.universityId;

  return useQuery({
    queryKey: ['proficiencyRadar', filters],
    queryFn: () => dashboardApi.getProficiencyRadar(filters),
    // A query só é executada se 'hasRequiredFilters' for verdadeiro
    enabled: hasRequiredFilters,
    staleTime: 1000 * 60 * 5, // 5 minutos
    select: (response) => {
      const apiData = response.data;
      if (!apiData || !apiData.labels || !Array.isArray(apiData.labels)) {
        return [];
      }
      // Confia que o backend sempre enviará a lista completa de assuntos
      return apiData.labels.map((label, index) => ({
        subject: label.charAt(0).toUpperCase() + label.slice(1),
        score: apiData.data?.[index] ?? 0,
      }));
    }
  });
}

export function ProficiencyRadarChart({ filters }: ChartProps) {
  const { data: chartData, isLoading, isError, error, refetch } = useChartData(filters);

  // Replica a mesma lógica de verificação de filtros do seu componente de referência
  const hasRequired = !!filters.universityId;

  // Verifica se há dados de performance para desenhar a área azul
  const hasPerformanceData = useMemo(() => chartData?.some(item => item.score > 0) ?? false, [chartData]);

  // Calcula as métricas apenas se houver dados de performance
  const performanceMetrics = useMemo(() => {
    if (!hasPerformanceData || !chartData) return null;
    const interactedData = chartData.filter(item => item.score > 0);
    if (interactedData.length === 0) return null;

    const totalScore = interactedData.reduce((sum, item) => sum + item.score, 0);
    const averageScore = totalScore / interactedData.length;
    const bestSubject = interactedData.reduce((max, item) => item.score > max.score ? item : max, interactedData[0]);
    const worstSubject = interactedData.reduce((min, item) => item.score < min.score ? item : min, interactedData[0]);

    return { average: averageScore, best: bestSubject, worst: worstSubject };
  }, [chartData, hasPerformanceData]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
      <Card className="bg-[#1f1f1f] border-white/10 flex flex-col h-full">
        <CardHeader className="flex flex-col pb-4 space-y-0 border-b border-white/10">
          <CardTitle className="text-white">Assunto Mais Acessado: Quiz</CardTitle>
          <CardDescription className="text-white/70">Nível de acerto médio em cada assunto principal.</CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:p-6 h-[299px] flex items-center justify-center">

          {/* Lógica de renderização de estados, espelhada do seu componente CategoryChart */}

          {!hasRequired ? (
            <p className="text-white/70 text-center">Selecione uma universidade para visualizar os dados.</p>
          ) : isLoading ? (
            <div className="flex flex-col items-center">
              <div className="mb-3 w-10 h-10 rounded-full animate-pulse bg-indigo-600/30"></div>
              <p className="text-white/70">Carregando dados...</p>
            </div>
          ) : isError ? (
            <div className="text-center">
              <svg className="mx-auto mb-3 text-indigo-400/60" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-red-400 text-sm mb-2">{error?.message || 'Erro ao carregar dados'}</p>
              <button onClick={() => refetch()} className="mt-3 text-xs text-indigo-400 transition-colors hover:text-indigo-300">
                Tentar novamente
              </button>
            </div>
          ) : (
            // O gráfico é renderizado com a lista de assuntos vinda do backend
            <ChartContainer config={chartConfig} className="w-full h-full text-white aspect-auto">
              <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <ChartTooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0] || !hasPerformanceData) return null;
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
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />

                {/* A área azul só é renderizada se houver dados de performance */}
                {hasPerformanceData && (
                  <Radar
                    dataKey="score"
                    fill="var(--color-score)"
                    fillOpacity={0.3}
                    stroke="var(--color-score)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--color-score)', strokeWidth: 0, r: 4 }}
                  />
                )}
              </RadarChart>
            </ChartContainer>
          )}
        </CardContent>

        {/* O rodapé só aparece se houver dados de performance */}
        {hasPerformanceData && performanceMetrics && (
          <CardFooter className="flex justify-between items-center px-6 py-4 border-t border-white/10">
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-white">Média de Acerto: {performanceMetrics.average.toFixed(1)}%</span>
                <span className="text-white/50">|</span>
                <span className="font-medium text-white">Melhor: {performanceMetrics.best.subject}</span>
              </div>
              <div className="mt-1">
                <span className="text-sm text-white/70">A Melhorar: {performanceMetrics.worst.subject} ({performanceMetrics.worst.score.toFixed(1)}%)</span>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
}