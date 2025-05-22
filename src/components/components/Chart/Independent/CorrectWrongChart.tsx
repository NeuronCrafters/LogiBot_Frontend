import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { motion } from "framer-motion";
import { logApi } from "@/services/apiClient";
import type { ChartFilterState } from "@/@types/ChartsType";

interface CorrectWrongChartProps {
  filter: ChartFilterState;
}

const useAccuracyData = (filter: ChartFilterState) => {
  // Extração e validação robusta do ID
  const validIds = Array.isArray(filter.ids)
    ? filter.ids.filter(id => typeof id === 'string' && id.trim() !== '')
    : [];

  const id = validIds[0] || "";

  return useQuery({
    queryKey: ['accuracy', filter.type, id],
    queryFn: async () => {
      if (!id) {
        throw new Error("ID inválido");
      }

      console.log("CorrectWrongChart - Buscando dados para:", filter.type, id);
      const response = await logApi.get(
        filter.type,
        "accuracy",
        "individual",
        id
      );

      console.log("CorrectWrongChart - Dados recebidos:", response);
      return response;
    },
    enabled: !!id,
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    select: (rawData: any) => {
      console.log("CorrectWrongChart - Processando dados:", rawData);

      // Extrair valores de acertos e erros
      const totalCorrect = Number(
        rawData.totalCorrect ||
        rawData.totalCorrectAnswers ||
        0
      );

      const totalWrong = Number(
        rawData.totalWrong ||
        rawData.totalWrongAnswers ||
        0
      );

      // Calcular a porcentagem de acertos
      const total = totalCorrect + totalWrong;
      const accuracy = total > 0 ? (totalCorrect / total) * 100 : 0;

      // Formatar os dados para o gráfico de barras
      // Formato alterado para ter colunas separadas para acertos e erros
      const chartData = [
        { category: "Respostas", correct: totalCorrect, wrong: totalWrong }
      ];

      return {
        chartData,
        totalCorrect,
        totalWrong,
        accuracy
      };
    }
  });
};

export function CorrectWrongChart({ filter }: CorrectWrongChartProps) {
  console.log("CorrectWrongChart - Renderizado com filtro:", filter);

  // Usar o hook de consulta para buscar e processar dados
  const {
    data: accuracyData,
    isLoading,
    isError,
    error,
    refetch
  } = useAccuracyData(filter);

  // Extração e validação robusta do ID
  const validIds = Array.isArray(filter.ids)
    ? filter.ids.filter(id => typeof id === 'string' && id.trim() !== '')
    : [];

  const id = validIds[0] || "";
  const isValid = id !== "";

  // Verificar se temos dados válidos
  const hasData = accuracyData &&
    accuracyData.chartData.length > 0 &&
    (accuracyData.totalCorrect > 0 || accuracyData.totalWrong > 0);

  // Configuração para o gráfico
  const chartConfig = {
    correct: {
      label: "Acertos",
      color: "hsl(var(--chart-2))"
    },
    wrong: {
      label: "Erros",
      color: "hsl(var(--chart-1))"
    }
  };

  return (
    <Card className="bg-[#141414] border-white/10 w-full mb-6">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b border-white/10">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5">
          <CardTitle className="text-white">Taxa de Acertos e Erros</CardTitle>
          <CardDescription className="text-white/70">
            {hasData
              ? `Precisão: ${accuracyData.accuracy.toFixed(1)}%`
              : "Estatísticas de perguntas respondidas"}
          </CardDescription>
        </div>

        {hasData && (
          <div className="flex">
            <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t border-white/10 px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50">
              <span className="text-xs text-white/50">Acertos</span>
              <span className="text-lg font-bold leading-none text-green-500 sm:text-2xl">
                {accuracyData.totalCorrect}
              </span>
            </div>
            <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t border-l border-white/10 px-6 py-4 text-left data-[active=true]:bg-muted/50">
              <span className="text-xs text-white/50">Erros</span>
              <span className="text-lg font-bold leading-none text-red-500 sm:text-2xl">
                {accuracyData.totalWrong}
              </span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        {!isValid && (
          <div className="flex items-center justify-center h-[250px] text-center text-white/70">
            <p>Selecione uma entidade para visualizar dados</p>
          </div>
        )}

        {isValid && isLoading && (
          <div className="flex items-center justify-center h-[250px] text-center text-white/70">
            <div className="flex flex-col items-center">
              <div className="animate-pulse w-10 h-10 rounded-full bg-indigo-600/30 mb-3"></div>
              <p>Carregando dados...</p>
            </div>
          </div>
        )}

        {isValid && isError && (
          <div className="flex items-center justify-center h-[250px] text-center text-red-400">
            <p>{error instanceof Error ? error.message : "Erro ao carregar dados."}</p>
          </div>
        )}

        {isValid && !isLoading && !isError && hasData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[250px] w-full text-white"
            >
              <BarChart
                accessibilityLayer
                data={accuracyData.chartData}
                margin={{
                  left: 12,
                  right: 12,
                }}
                barGap={8}
              >
                <CartesianGrid horizontal={true} vertical={false} stroke="#333" />
                <XAxis
                  dataKey="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  stroke="#999"
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      className="w-[120px] bg-[#1f1f1f] border-[#333] text-white"
                    />
                  }
                />
                <Bar
                  dataKey="correct"
                  fill="#10b981" // Verde para acertos
                  radius={[8, 8, 0, 0]}
                  name="Acertos"
                />
                <Bar
                  dataKey="wrong"
                  fill="#ef4444" // Vermelho para erros
                  radius={[8, 8, 0, 0]}
                  name="Erros"
                />
              </BarChart>
            </ChartContainer>
          </motion.div>
        )}

        {isValid && !isLoading && !isError && !hasData && (
          <div className="flex items-center justify-center h-[250px] text-center text-white/70">
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-indigo-400/60">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p>Nenhum dado de acertos/erros disponível para esta entidade.</p>
              <button
                onClick={() => refetch()}
                className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}