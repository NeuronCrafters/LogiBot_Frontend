import { useQuery } from "@tanstack/react-query";
import { useMemo, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { motion } from "framer-motion";
import { dashboardApi } from "@/services/api/api_dashboard";
import { ChartLoader, ChartError, NoData } from "../ChartStates";

interface TopicData {
  topic: string;
  successPercentage: number;
  errorPercentage: number;
}

interface ChartProps {
  filters: { universityId?: string; courseId?: string; classId?: string; studentId?: string; disciplineId?: string; };
}

const chartConfig = {
  successPercentage: {
    label: "Acertos",
    color: "hsl(180 31% 37%)",
  },
  errorPercentage: {
    label: "Erros",
    color: "hsl(0 31% 37%)",
  },
} satisfies ChartConfig;

function useChartData(filters: ChartProps['filters']) {
  return useQuery<TopicData[]>({
    queryKey: ['topicPerformance', filters],
    queryFn: async () => {
      const response = await dashboardApi.getTopicPerformance(filters);
      return response.data;
    },
    enabled: !!filters.universityId,
    staleTime: 1000 * 60 * 5,
  });
}

export function TopicPerformanceChart({ filters }: ChartProps) {
  const { data, isLoading, isError, error, refetch } = useChartData(filters);
  const hasData = data && data.length > 0;
  const hasRequired = !!filters.universityId;

  const { topicWithHighestSuccess, topicWithHighestError } = useMemo(() => {
    if (!hasData || !data || data.length === 0) {
      return { topicWithHighestSuccess: null, topicWithHighestError: null };
    }

    const highestSuccess = data.reduce((max, item) => {
      return item.successPercentage > max.successPercentage ? item : max;
    }, data[0]);

    const highestError = data.reduce((max, item) => {
      return item.errorPercentage > max.errorPercentage ? item : max;
    }, data[0]);

    return {
      topicWithHighestSuccess: highestSuccess,
      topicWithHighestError: highestError
    };
  }, [data, hasData]);

  const refetchTyped = refetch as () => void;
  const errorMessage = error instanceof Error ? error.message : "Erro ao carregar dados.";

  return (
    <Card className="bg-[#1f1f1f] border-white/10 w-full mb-6">
      {/* HEADER PADRONIZADO EM ALTURA */}
      <CardHeader className="flex flex-col items-stretch p-0 space-y-0 border-b border-white/10">
        <div className="flex flex-col flex-1 gap-1 justify-center px-6 py-5">
          <CardTitle className="text-white">Desempenho por Tópico Individual</CardTitle>
          <CardDescription className="text-white/70">
            Proporção de acertos vs. erros em cada assunto do quiz.
          </CardDescription>
        </div>
        {/* Elemento invisível para manter a altura do CardHeader consistente com o UsageChart */}
        <div className="flex">
          <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t border-white/10 px-6 py-4 text-left invisible h-0" aria-hidden="true" />
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        {/* Estados: falta seleção */}
        {!hasRequired && (
          <NoData onRetry={refetchTyped}>
            <p>Selecione uma universidade para visualizar o desempenho por tópico.</p>
          </NoData>
        )}

        {/* Estados: loading */}
        {hasRequired && isLoading && <ChartLoader text="Carregando dados..." />}

        {/* Estados: erro */}
        {hasRequired && isError && <ChartError message={errorMessage} onRetry={refetchTyped} />}

        {/* Gráfico */}
        {hasRequired && !isLoading && !isError && hasData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
              <BarChart
                accessibilityLayer
                data={data}
                layout="vertical"
                stackOffset="expand"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid vertical={true} horizontal={false} stroke="rgba(255, 255, 255, 0.1)" />
                <YAxis
                  dataKey="topic"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={80}
                  tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
                />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `${Math.round(value * 100)}%`}
                  tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
                />
                <ChartTooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  content={
                    <ChartTooltipContent
                      className="bg-[#1f1f1f] border-white/10 text-white"
                      indicator="dot"
                      formatter={(value, name) => [
                        `${(Number(value) || 0).toFixed(1)}%`,
                        chartConfig[name as keyof typeof chartConfig]?.label
                      ]}
                      labelStyle={{ color: "#fff" }}
                    />
                  }
                />
                <Bar dataKey="errorPercentage" stackId="a" fill="var(--color-errorPercentage)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="successPercentage" stackId="a" fill="var(--color-successPercentage)" radius={[4, 0, 0, 4]} />
              </BarChart>
            </ChartContainer>
          </motion.div>
        )}

        {/* Sem dados */}
        {hasRequired && !isLoading && !isError && !hasData && (
          <NoData onRetry={refetchTyped}>
            <p>Nenhum dado de desempenho por tópico disponível.</p>
          </NoData>
        )}
      </CardContent>

      {/* Rodapé condicional, com estrutura padronizada */}
      {hasData && (
        <CardFooter className="flex-col items-start gap-4 px-6 py-4 border-t border-white/10">
          <div className="flex w-full items-center gap-2">
            <div className="flex-1">
              <p className="text-sm text-white/70">Maior Índice de Acerto</p>
              <p className="font-bold text-white truncate" title={topicWithHighestSuccess?.topic}>
                {topicWithHighestSuccess?.topic ?? 'N/A'}
              </p>
            </div>
            <div className="h-10 w-px bg-white/10"></div>
            <div className="flex-1">
              <p className="text-sm text-white/70">Maior Índice de Erro</p>
              <p className="font-bold text-white truncate" title={topicWithHighestError?.topic}>
                {topicWithHighestError?.topic ?? 'N/A'}
              </p>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}