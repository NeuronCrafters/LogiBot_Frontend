import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
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

      // Criar dados para o radar chart com os 5 pontos
      const chartData = [
        { category: "Variáveis", acessos: subjectCounts.variaveis || 0 },
        { category: "Tipos", acessos: subjectCounts.tipos || 0 },
        { category: "Funções", acessos: subjectCounts.funcoes || 0 },
        { category: "Loops", acessos: subjectCounts.loops || 0 },
        { category: "Verificações", acessos: subjectCounts.verificacoes || 0 },
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
      <Card className="bg-[#1f1f1f] border-white/10 w-full h-full">
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-white/70">Selecione uma entidade para visualizar dados</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-[#1f1f1f] border-white/10 w-full h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center">
            <div className="animate-pulse w-10 h-10 rounded-full bg-indigo-600/30 mb-3"></div>
            <p className="text-white/70">Carregando dados...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="bg-[#1f1f1f] border-white/10 w-full h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-indigo-400/60">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p className="text-white/70">{error instanceof Error ? error.message : "Erro ao carregar dados."}</p>
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
      <Card className="bg-[#1f1f1f] border-white/10 w-full h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-indigo-400/60">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
            <p className="text-white/70">Nenhum dado de categorias disponível para esta entidade.</p>
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
    <Card className="bg-[#1f1f1f] border-white/10 w-full h-full flex flex-col">
      <CardHeader >
        <CardTitle className="text-white">Distribuição por Assunto</CardTitle>
        <CardDescription className="text-white/70">
          Acessos por categoria de conteúdo
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[300px]"
          >
            <RadarChart data={processedData?.chartData || []}>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <PolarGrid
                gridType="circle"
                radialLines={true}
                stroke="#444444"
                strokeOpacity={0.5}
              />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fill: '#999', fontSize: 12 }}
              />
              <Radar
                dataKey="acessos"
                fill="hsl(215, 100%, 50%)"
                fillOpacity={0.3}
                stroke="hsl(215, 100%, 50%)"
                strokeWidth={2}
              />
            </RadarChart>
          </ChartContainer>
        </motion.div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="text-sm">
          {topCategory ? (
            <div className="text-white/70">
              Mais acessado: <span className="text-white font-medium">{topCategory.name}</span> ({topCategory.percentage}%)
            </div>
          ) : (
            <div className="text-white/70">Distribuição de acessos</div>
          )}
        </div>
        <div className="text-sm">
          {trend && (
            <div className="flex items-center gap-2 font-medium text-white">
              Total: {trend.totalAccesses} acesso{trend.totalAccesses !== 1 ? 's' : ''}
              {/* {trend.isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )} */}
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}