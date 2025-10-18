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
      console.log('🔍 [TopicPerformance] Iniciando requisição com filtros:', filters);
      try {
        const response = await dashboardApi.getTopicPerformance(filters);
        console.log('✅ [TopicPerformance] Resposta completa da API:', response);
        console.log('📊 [TopicPerformance] response.data:', response.data);
        console.log('📊 [TopicPerformance] Tipo de response.data:', typeof response.data);
        console.log('📊 [TopicPerformance] É array?', Array.isArray(response.data));

        if (response.data && typeof response.data === 'object') {
          console.log('🔑 [TopicPerformance] Keys do objeto:', Object.keys(response.data));
          console.log('📝 [TopicPerformance] Estrutura JSON completa:', JSON.stringify(response.data, null, 2));

          // Verifica se existe alguma propriedade que é array
          Object.keys(response.data).forEach(key => {
            const value = response.data[key];
            console.log(`🔎 [TopicPerformance] response.data.${key}:`, {
              tipo: typeof value,
              isArray: Array.isArray(value),
              length: Array.isArray(value) ? value.length : 'N/A',
              valor: value
            });
          });
        }

        if (Array.isArray(response.data) && response.data.length > 0) {
          console.log('📋 [TopicPerformance] Primeiro item do array:', response.data[0]);
          console.log('📋 [TopicPerformance] Estrutura do primeiro item:', JSON.stringify(response.data[0], null, 2));
        }

        return response.data;
      } catch (error) {
        console.error('❌ [TopicPerformance] Erro na requisição:', error);
        if (error instanceof Error) {
          console.error('❌ [TopicPerformance] Mensagem do erro:', error.message);
          console.error('❌ [TopicPerformance] Stack do erro:', error.stack);
        }
        throw error;
      }
    },
    enabled: !!filters.universityId,
    staleTime: 1000 * 60 * 5,
  });
}

export function TopicPerformanceChart({ filters }: ChartProps) {
  const { data, isLoading, isError, error, refetch } = useChartData(filters);
  const hasData = data && data.length > 0;

  useEffect(() => {
    console.log('📈 [TopicPerformance] Estado atual do componente:', {
      isLoading,
      isError,
      errorMessage: error?.message,
      hasData,
      dataType: typeof data,
      isDataArray: Array.isArray(data),
      dataLength: Array.isArray(data) ? data.length : 'N/A',
      data: data
    });

    if (data && !Array.isArray(data)) {
      console.warn('⚠️ [TopicPerformance] ATENÇÃO: data não é um array! Tipo:', typeof data);
      console.warn('⚠️ [TopicPerformance] Conteúdo de data:', data);
    }

    if (Array.isArray(data) && data.length === 0) {
      console.warn('⚠️ [TopicPerformance] Array de dados está vazio!');
    }
  }, [isLoading, isError, error, hasData, data]);

  const { topicWithHighestSuccess, topicWithHighestError } = useMemo(() => {
    console.log('🧮 [TopicPerformance] Calculando métricas. hasData:', hasData);

    if (!hasData) {
      console.log('⚠️ [TopicPerformance] Não há dados para calcular métricas');
      return { topicWithHighestSuccess: null, topicWithHighestError: null };
    }

    console.log('📊 [TopicPerformance] Dados para cálculo:', data);

    const highestSuccess = data.reduce((max, item) => {
      console.log('  Comparando success:', item.successPercentage, 'vs', max.successPercentage);
      return item.successPercentage > max.successPercentage ? item : max;
    }, data[0]);

    const highestError = data.reduce((max, item) => {
      console.log('  Comparando error:', item.errorPercentage, 'vs', max.errorPercentage);
      return item.errorPercentage > max.errorPercentage ? item : max;
    }, data[0]);

    console.log('✅ [TopicPerformance] Métricas calculadas:', {
      highestSuccess,
      highestError
    });

    return {
      topicWithHighestSuccess: highestSuccess,
      topicWithHighestError: highestError
    };
  }, [data, hasData]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="bg-[#1f1f1f] border-white/10 flex flex-col h-full">
        <CardHeader className="border-b border-white/10 pb-4">
          <CardTitle className="text-white">Desempenho por Tópico Individual</CardTitle>
          <CardDescription className="text-white/70">Proporção de acertos vs. erros em cada assunto do quiz.</CardDescription>
        </CardHeader>

        <CardContent className="flex-grow pt-6">
          {isLoading && (
            <>
              {console.log('⏳ [TopicPerformance] Renderizando estado de loading')}
              <ChartLoader />
            </>
          )}
          {isError && (
            <>
              {console.log('❌ [TopicPerformance] Renderizando estado de erro:', error)}
              <div className="text-center">
                <ChartError message={error instanceof Error ? error.message : "Erro desconhecido"} onRetry={refetch} />
                <p className="text-xs text-white/50 mt-2">Verifique o console (F12) para mais detalhes</p>
              </div>
            </>
          )}
          {!isLoading && !isError && !hasData && (
            <>
              {console.log('📭 [TopicPerformance] Renderizando estado sem dados')}
              <div className="text-center">
                <NoData onRetry={refetch} />
                <p className="text-xs text-white/50 mt-2">Verifique o console (F12) para mais detalhes</p>
              </div>
            </>
          )}
          {!isLoading && !isError && hasData && (
            <>
              {console.log('📊 [TopicPerformance] Renderizando gráfico com dados:', data)}
              <div className="min-h-[300px] w-full">
                <ChartContainer config={chartConfig} className="w-full h-full">
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
              </div>
            </>
          )}
        </CardContent>

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
    </motion.div>
  );
}