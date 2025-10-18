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

const chartConfig = {
  score: {
    label: "Acerto",
    color: "#274a96",
  },
} satisfies ChartConfig;

function useChartData(filters: ChartProps['filters']) {
  return useQuery({
    queryKey: ['proficiencyRadar', filters],
    queryFn: () => dashboardApi.getProficiencyRadar(filters).then(res => res.data),
    enabled: !!filters.universityId,
    staleTime: 1000 * 60 * 5,
    select: (apiData) => {
      if (!apiData || apiData.labels.length === 0) return [];
      return apiData.labels.map((label, index) => ({
        subject: label.charAt(0).toUpperCase() + label.slice(1),
        score: apiData.data[index],
      }));
    }
  });
}

export function ProficiencyRadarChart({ filters }: ChartProps) {
  const { data, isLoading, isError, refetch } = useChartData(filters);
  const hasData = data && data.length > 0;

  // --- NOVA LÓGICA PARA O FOOTER ---
  // Calcula as métricas de proficiência (melhor, pior, média)
  const performanceMetrics = useMemo(() => {
    if (!hasData) return null;

    const totalScore = data.reduce((sum, item) => sum + item.score, 0);
    const averageScore = totalScore / data.length;

    const bestSubject = data.reduce((max, item) => item.score > max.score ? item : max, data[0]);
    const worstSubject = data.reduce((min, item) => item.score < min.score ? item : min, data[0]);

    return {
      average: averageScore,
      best: bestSubject,
      worst: worstSubject,
    };
  }, [data, hasData]);
  // --- FIM DA NOVA LÓGICA ---

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
      <Card className="bg-[#1f1f1f] border-white/10 flex flex-col h-full">
        <CardHeader className="flex flex-col pb-4 space-y-0 border-b border-white/10">
          <CardTitle className="text-white">Assunto Mais Acessado: Quiz</CardTitle>
          <CardDescription className="text-white/70">Nível de acerto médio em cada assunto principal.</CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:p-6 h-[299px] flex items-center justify-center">
          {(!hasData || isLoading || isError) && (
            <div className="flex flex-col items-center">
              {isLoading && <div className="mb-3 w-10 h-10 rounded-full animate-pulse bg-indigo-600/30"></div>}
              {isError && (
                <svg className="mb-3 text-indigo-400/60" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
              {isLoading && <p className="text-white/70">Carregando dados...</p>}
              {!isLoading && !isError && !hasData && <p className="text-white/70">Nenhum dado de proficiência disponível.</p>}
              {isError && <button onClick={() => refetch()} className="mt-3 text-xs text-indigo-400 transition-colors hover:text-indigo-300">Tentar novamente</button>}
            </div>
          )}

          {!isLoading && !isError && hasData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="w-full h-full">
              <ChartContainer config={chartConfig} className="w-full h-full text-white aspect-auto">
                <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <ChartTooltip
                    cursor={false}
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const entry = payload[0].payload;
                      return (
                        <div className="p-2 bg-[#1f1f1f] border border-[#333] rounded shadow text-white text-sm">
                          <p className="mb-1 font-semibold">{entry.subject}</p>
                          <p><span className="text-[#999] mr-2">Acerto:</span><span className="font-medium">{entry.score}%</span></p>
                        </div>
                      );
                    }}
                  />
                  <PolarGrid gridType="polygon" radialLines stroke="#d4d0d0" strokeOpacity={0.6} strokeDasharray="2 2" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#FFF', fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    dataKey="score"
                    fill="var(--color-score)"
                    fillOpacity={0.3}
                    stroke="var(--color-score)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--color-score)', strokeWidth: 0, r: 4 }}
                  />
                </RadarChart>
              </ChartContainer>
            </motion.div>
          )}
        </CardContent>

        {/* --- CardFooter CORRIGIDO --- */}
        {hasData && performanceMetrics && (
          <CardFooter className="flex justify-between items-center px-6 py-4 border-t border-white/10">
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-white">Média de Acerto: {performanceMetrics.average.toFixed(1)}%</span>
                <span className="text-white/50">|</span>
                <span className="font-medium text-white">Melhor Desempenho: {performanceMetrics.best.subject}</span>
              </div>
              <div className="mt-1">
                <span className="text-sm text-white/70">Ponto a Melhorar: {performanceMetrics.worst.subject} ({performanceMetrics.worst.score.toFixed(1)}%)</span>
              </div>
            </div>
          </CardFooter>
        )}
        {/* --- FIM DA CORREÇÃO --- */}
      </Card>
    </motion.div>
  );
}