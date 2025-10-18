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

// Cor azul mais vibrante para melhor visualizaçãos
const chartConfig = {
  score: {
    label: "Acerto",
    color: "#3b82f6", // tailwind-css blue-500
  },
} satisfies ChartConfig;

// Dados padrão para exibir a estrutura do gráfico mesmo quando não há dados da API
const defaultData = [
  { subject: "Variáveis", score: 0 },
  { subject: "Tipos", score: 0 },
  { subject: "Funções", score: 0 },
  { subject: "Loops", score: 0 },
  { subject: "Verificações", score: 0 },
];

function useChartData(filters: ChartProps['filters']) {
  return useQuery({
    queryKey: ['proficiencyRadar', filters],
    queryFn: async () => {
      console.log('🔍 [ProficiencyRadar] Iniciando requisição com filtros:', filters);
      try {
        const response = await dashboardApi.getProficiencyRadar(filters);
        console.log('✅ [ProficiencyRadar] Resposta da API recebida:', response);
        return response.data;
      } catch (error) {
        console.error('❌ [ProficiencyRadar] Erro na requisição:', error);
        throw error;
      }
    },
    enabled: !!filters.universityId,
    staleTime: 1000 * 60 * 5,
    select: (apiData) => {
      if (!apiData || !apiData.labels || !Array.isArray(apiData.labels) || apiData.labels.length === 0) {
        console.warn('⚠️ [ProficiencyRadar] Nenhum dado válido da API. Usando array vazio.');
        return []; // Retorna um array vazio se não houver dados
      }
      return apiData.labels.map((label, index) => ({
        subject: label.charAt(0).toUpperCase() + label.slice(1),
        score: apiData.data?.[index] ?? 0,
      }));
    }
  });
}

export function ProficiencyRadarChart({ filters }: ChartProps) {
  const { data, isLoading, isError, error, refetch } = useChartData(filters);

  // A verificação de 'hasData' continua a mesma.
  const hasData = data && data.length > 0;

  // Escolhe entre os dados da API ou os dados padrão.
  // Isso garante que o gráfico sempre tenha uma estrutura para renderizar.
  const chartData = hasData ? data : defaultData;

  const performanceMetrics = useMemo(() => {
    if (!hasData || !data) return null;
    const totalScore = data.reduce((sum, item) => sum + item.score, 0);
    const averageScore = totalScore / data.length;
    const bestSubject = data.reduce((max, item) => item.score > max.score ? item : max, data[0]);
    const worstSubject = data.reduce((min, item) => item.score < min.score ? item : min, data[0]);
    return { average: averageScore, best: bestSubject, worst: worstSubject };
  }, [data, hasData]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
      <Card className="bg-[#1f1f1f] border-white/10 flex flex-col h-full">
        <CardHeader className="flex flex-col pb-4 space-y-0 border-b border-white/10">
          <CardTitle className="text-white">Assunto Mais Acessado: Quiz</CardTitle>
          <CardDescription className="text-white/70">Nível de acerto médio em cada assunto principal.</CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:p-6 h-[299px] flex items-center justify-center">
          {isLoading ? (
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
            <ChartContainer config={chartConfig} className="w-full h-full text-white aspect-auto">
              <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <ChartTooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0] || !hasData) return null;
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

                {hasData && (
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

        {hasData && performanceMetrics && (
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