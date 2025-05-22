import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, PolarRadiusAxis } from "recharts";
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
  ChartTooltipContent,
} from "@/components/ui/chart";
import { motion } from "framer-motion";
import { logApi } from "@/services/apiClient";
import type { ChartFilterState } from "@/@types/ChartsType";

// Configuração do gráfico
const chartConfig = {
  acessos: {
    label: "Acessos",
    color: "hsl(215, 100%, 50%)", // Azul vibrante
  },
} satisfies ChartConfig;

const useSubjectsData = (filter: ChartFilterState) => {
  const validIds = Array.isArray(filter.ids)
    ? filter.ids.filter(id => typeof id === 'string' && id.trim() !== '')
    : [];

  const id = validIds[0] || "";

  return useQuery({
    queryKey: ['subjects-summary', filter.type, id],
    queryFn: async () => {
      if (filter.type === 'student') {
        const response = await logApi.getFilteredStudentSummary({
          universityId: id || '',
        });
        return response;
      }

      if (!id) {
        throw new Error("ID inválido");
      }

      let response: any;
      switch (filter.type) {
        case 'university':
          response = await logApi.getUniversitySummary(id);
          break;
        case 'class':
          response = await logApi.getClassSummary(id);
          break;
        case 'course':
          response = await logApi.getCourseSummary(id);
          break;
        default:
          throw new Error(`Tipo de filtro inválido: ${filter.type}`);
      }

      return response;
    },
    enabled: filter.type === 'student' || !!id,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    select: (rawData: any) => {
      let subjectCounts: Record<string, number> = {};

      if (rawData && typeof rawData === 'object' && 'subjectCounts' in rawData) {
        subjectCounts = rawData.subjectCounts;
      }

      // Encontrar o valor máximo para normalização
      const maxValue = Math.max(...Object.values(subjectCounts), 1);

      // Criar dados para o radar chart com os 5 pontos
      const chartData = [
        {
          category: "Variáveis",
          acessos: subjectCounts.variaveis || 0
        },
        {
          category: "Tipos",
          acessos: subjectCounts.tipos || 0
        },
        {
          category: "Funções",
          acessos: subjectCounts.funcoes || 0
        },
        {
          category: "Loops",
          acessos: subjectCounts.loops || 0
        },
        {
          category: "Verificações",
          acessos: subjectCounts.verificacoes || 0
        },
      ];

      const totalAccesses = Object.values(subjectCounts).reduce((sum, val) => sum + val, 0);

      return {
        chartData,
        subjectCounts,
        totalAccesses
      };
    }
  });
};

export function CategoryChart({ filter }: { filter: ChartFilterState }) {
  const {
    data: processedData,
    isLoading,
    isError,
    error,
    refetch
  } = useSubjectsData(filter);

  const validIds = Array.isArray(filter.ids)
    ? filter.ids.filter(id => typeof id === 'string' && id.trim() !== '')
    : [];

  const id = validIds[0] || "";
  const isValid = filter.type === 'student' || id !== "";

  const hasData = useMemo(() => {
    return processedData && processedData.totalAccesses > 0;
  }, [processedData]);

  const topCategory = useMemo(() => {
    if (!processedData || !processedData.subjectCounts) return null;

    let maxCategory = '';
    let maxValue = 0;

    const categoryLabels: Record<string, string> = {
      variaveis: "Variáveis",
      tipos: "Tipos",
      funcoes: "Funções",
      loops: "Loops",
      verificacoes: "Verificações"
    };

    Object.entries(processedData.subjectCounts).forEach(([category, value]) => {
      if (value > maxValue) {
        maxValue = value;
        maxCategory = category;
      }
    });

    return maxValue > 0 ? {
      name: categoryLabels[maxCategory] || maxCategory,
      value: maxValue,
      percentage: Math.round((maxValue / processedData.totalAccesses) * 100)
    } : null;
  }, [processedData]);

  // Calcular tendência baseada nos dados reais
  const trend = useMemo(() => {
    if (!hasData || !processedData) return null;

    // Se há dados, é positivo
    const isPositive = processedData.totalAccesses > 0;

    return {
      isPositive,
      totalAccesses: processedData.totalAccesses
    };
  }, [hasData, processedData]);

  if (!isValid) {
    return (
      <Card className="bg-[#1f1f1f] border-white/10 w-full mb-0 flex flex-col">
        <CardContent className="flex items-center justify-center h-[200px] text-center text-white/70">
          <p>Selecione uma entidade para visualizar dados</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-[#1f1f1f] border-white/10 w-full mb-6">
        <CardContent className="flex items-center justify-center h-[200px] text-center text-white/70">
          <div className="flex flex-col items-center">
            <div className="animate-pulse w-10 h-10 rounded-full bg-indigo-600/30 mb-3"></div>
            <p>Carregando dados...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="bg-[#1f1f1f] border-white/10 w-full mb-6">
        <CardContent className="flex items-center justify-center h-[200px] text-center text-white/70">
          <div className="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-indigo-400/60">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>{error instanceof Error ? error.message : "Erro ao carregar dados."}</p>
            <button
              onClick={() => refetch()}
              className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasData) {
    return (
      <Card className="bg-[#1f1f1f] border-white/10 w-full mb-6">
        <CardContent className="flex items-center justify-center h-[200px] text-center text-white/70">
          <div className="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-indigo-400/60">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
            <p>Nenhum dado de categorias disponível para esta entidade.</p>
            <button
              onClick={() => refetch()}
              className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#1f1f1f] border-white/10 w-full mb-6">
      <CardHeader className="flex flex-col space-y-0 border-b border-white/10 pb-4">
        <CardTitle className="text-white">Distribuição por Assunto</CardTitle>
        <CardDescription className="text-white/70">
          Acessos por categoria de conteúdo
        </CardDescription>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full text-white"
          >
            <RadarChart
              data={processedData?.chartData || []}
              margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
            >
              <ChartTooltip
                cursor={false}
                content={(props) => {
                  if (!props.active || !props.payload || !props.payload[0]) {
                    return null;
                  }

                  const data = props.payload[0].payload;

                  return (
                    <div className="p-2 bg-[#1f1f1f] border border-[#333] rounded shadow text-white text-sm">
                      <p className="font-semibold mb-1">{data.category}</p>
                      <p>
                        <span className="text-[#999] mr-2">Acessos:</span>
                        <span className="font-medium">{data.acessos}</span>
                      </p>
                    </div>
                  );
                }}
              />
              <PolarGrid
                gridType="polygon"
                radialLines={true}
                stroke="#333"
                strokeOpacity={0.6}
                strokeDasharray="2 2"
              />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fill: '#999', fontSize: 11 }}
                className="text-white/70"
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 'dataMax']}
                tick={false}
                axisLine={false}
              />
              <Radar
                dataKey="acessos"
                fill="#274a96"
                fillOpacity={0.3}
                stroke="#274a96"
                strokeWidth={2}
                dot={{ fill: "#274a96", strokeWidth: 0, r: 4 }}
              />
            </RadarChart>
          </ChartContainer>
        </motion.div>
      </CardContent>

      {hasData && (
        <CardFooter className="flex justify-between items-center border-t border-white/10 px-6 py-4">
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-white">Total: {trend?.totalAccesses || 0}</span>
              {topCategory && (
                <>
                  <span className="text-white/50">|</span>
                  <span className="font-medium text-white">Mais acessado: {topCategory.name}</span>
                </>
              )}
            </div>
            {topCategory && (
              <div className="mt-1">
                <span className="text-sm text-white/70">Porcentagem: {topCategory.percentage}%</span>
              </div>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}