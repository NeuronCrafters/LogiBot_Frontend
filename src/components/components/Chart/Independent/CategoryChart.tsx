import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
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

// Função para traduzir nomes de categorias
const translateCategory = (category: string): string => {
  const translations: Record<string, string> = {
    "variaveis": "Variáveis",
    "tipos": "Tipos",
    "funcoes": "Funções",
    "loops": "Loops",
    "verificacoes": "Verificações",
    // Adicione mais traduções conforme necessário
  };

  return translations[category] || category;
};

// Hook personalizado para buscar dados de categorias
const useSubjectsData = (filter: ChartFilterState) => {
  // Extração e validação robusta do ID
  const validIds = Array.isArray(filter.ids)
    ? filter.ids.filter(id => typeof id === 'string' && id.trim() !== '')
    : [];

  const id = validIds[0] || "";

  return useQuery({
    queryKey: ['subjects', filter.type, id],
    queryFn: async () => {
      if (!id) {
        throw new Error("ID inválido");
      }

      console.log("CategoryChart - Buscando dados para:", filter.type, id);
      const response = await logApi.get(
        filter.type,
        "subjects",
        "individual",
        id
      );

      console.log("CategoryChart - Dados recebidos:", response);
      return response;
    },
    enabled: !!id,
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    select: (rawData: any) => {
      console.log("CategoryChart - Processando dados:", rawData);
      let result: any[] = [];

      // Caso com subjectFrequency
      if (typeof rawData === 'object' && 'subjectFrequency' in rawData && typeof rawData.subjectFrequency === 'object') {
        console.log("CategoryChart - Formato: objeto com subjectFrequency");

        // Converter subjectFrequency para array de {category, value}
        result = Object.entries(rawData.subjectFrequency)
          .filter(([key, value]) => key && value)
          .map(([category, value]) => ({
            category,
            value: Number(value)
          }));
      }
      // Caso com mostAccessedSubjects
      else if (typeof rawData === 'object' && 'mostAccessedSubjects' in rawData && Array.isArray(rawData.mostAccessedSubjects)) {
        console.log("CategoryChart - Formato: objeto com mostAccessedSubjects");

        result = rawData.mostAccessedSubjects.map((item: any) => ({
          category: item.subject,
          value: Number(item.count)
        }));
      }
      // Caso com array de objetos
      else if (Array.isArray(rawData)) {
        console.log("CategoryChart - Formato: array de objetos");

        // Verificar se os objetos têm as propriedades necessárias
        if (rawData.length > 0 && typeof rawData[0] === 'object') {
          // Verificar quais propriedades usar como categoria e valor
          const sampleObject = rawData[0];
          let categoryKey = null;
          let valueKey = null;

          // Tentar encontrar chaves apropriadas
          for (const key of Object.keys(sampleObject)) {
            const keyLower = key.toLowerCase();
            if (
              keyLower.includes('category') ||
              keyLower.includes('subject') ||
              keyLower.includes('topic') ||
              keyLower.includes('name')
            ) {
              categoryKey = key;
            }

            if (
              keyLower.includes('value') ||
              keyLower.includes('count') ||
              keyLower.includes('frequency') ||
              keyLower.includes('total')
            ) {
              valueKey = key;
            }
          }

          if (categoryKey && valueKey) {
            console.log(`CategoryChart - Usando ${categoryKey} e ${valueKey} do array`);
            result = rawData.map((item: any) => ({
              category: item[categoryKey],
              value: Number(item[valueKey])
            }));
          }
        }
      }
      // Se chegou até aqui, tenta extrair qualquer coisa útil do objeto
      else if (typeof rawData === 'object') {
        console.log("CategoryChart - Tentando extrair dados de formato desconhecido:", rawData);

        // Procurar qualquer objeto que possa conter frequências por assunto/categoria
        for (const [key, value] of Object.entries(rawData)) {
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Verificar se este objeto parece uma tabela de frequências
            const entries = Object.entries(value);
            if (entries.length > 0 && typeof entries[0][1] === 'number') {
              console.log(`CategoryChart - Usando objeto ${key} como fonte de dados`);
              result = entries.map(([category, count]) => ({
                category,
                value: Number(count)
              }));
              break;
            }
          }
        }
      }

      // Ordenar por valor (decrescente)
      result.sort((a, b) => b.value - a.value);

      // Limitar a 5 categorias para melhor visualização
      if (result.length > 5) {
        result = result.slice(0, 5);
      }

      return result;
    }
  });
};

export function CategoryChart({ filter }: { filter: ChartFilterState }) {
  console.log("CategoryChart - Renderizado com filtro:", filter);

  // Usar o hook personalizado para buscar dados
  const {
    data: processedData = [],
    isLoading,
    isError,
    error,
    refetch
  } = useSubjectsData(filter);

  // Extração e validação robusta do ID
  const validIds = Array.isArray(filter.ids)
    ? filter.ids.filter(id => typeof id === 'string' && id.trim() !== '')
    : [];

  const id = validIds[0] || "";
  const isValid = id !== "";

  // Verificar se temos dados
  const hasData = processedData.length > 0;

  // Configuração do gráfico
  const chartConfig = useMemo(() => {
    // Criar configuração para cada categoria
    const config: Record<string, any> = {
      value: {
        label: "Acessos",
        color: "hsl(var(--chart-1))"
      }
    };

    return config;
  }, []);

  // Calcular o total de acessos
  const totalAccesses = useMemo(() => {
    if (!processedData || processedData.length === 0) return 0;
    return processedData.reduce((acc, curr) => acc + curr.value, 0);
  }, [processedData]);

  // Identificar a categoria mais acessada
  const topCategory = useMemo(() => {
    if (!processedData || processedData.length === 0) return null;
    return processedData[0];
  }, [processedData]);

  return (
    <Card className="bg-[#141414] border-white/10 w-full mb-6">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b border-white/10 p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5">
          <CardTitle className="text-white">Distribuição por Assunto</CardTitle>
          <CardDescription className="text-white/70">
            {hasData
              ? `Tópicos mais acessados (${processedData.length})`
              : "Estatísticas de uso por assunto"}
          </CardDescription>
        </div>
        {hasData && topCategory && (
          <div className="flex">
            <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t border-white/10 px-6 py-4 text-left data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0">
              <span className="text-xs text-white/50">
                Tópico mais acessado
              </span>
              <span className="text-lg font-bold leading-none text-white sm:text-2xl">
                {translateCategory(topCategory.category)}
              </span>
            </div>
            <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t border-l border-white/10 px-6 py-4 text-left data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0">
              <span className="text-xs text-white/50">
                Total de acessos
              </span>
              <span className="text-lg font-bold leading-none text-white sm:text-2xl">
                {totalAccesses}
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
                data={processedData}
                margin={{
                  left: 12,
                  right: 12,
                }}
                layout="vertical" // Barras horizontais para melhor visualização de categorias
              >
                <CartesianGrid horizontal={true} vertical={false} stroke="#333" />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  stroke="#999"
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      className="w-[150px] bg-[#1f1f1f] border-[#333] text-white"
                      nameKey="value"
                      labelFormatter={(value) => {
                        return translateCategory(value);
                      }}
                    />
                  }
                />
                <Bar
                  dataKey="value"
                  name="Acessos"
                  fill="hsl(var(--chart-1))"
                  radius={8}
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
              <p>Nenhum dado de categorias disponível para esta entidade.</p>
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