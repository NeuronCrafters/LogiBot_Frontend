import { useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell, ResponsiveContainer
} from "recharts";
import { Card } from "@/components/ui/card";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { motion } from "framer-motion";
import { useChartData } from "@/hooks/use-ChartData";
import type { ChartFilterState, CategoryData } from "@/@types/ChartsType";

const barColors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

export function CategoryChart({ filter }: { filter: ChartFilterState }) {
  const validIds = Array.isArray(filter.ids) ? filter.ids.filter(id => typeof id === 'string' && id.trim() !== '') : [];
  const id = validIds[0] || "";
  const isValid = id !== "";

  console.log("[Chart] CategoryChart - ID:", id, "É válido:", isValid);

  const {
    data,
    isLoading,
    isError,
    error,
    isSuccess,
    refresh,
  } = useChartData<any>(
    filter.type,
    "subjects",
    "individual",
    id,
    !isValid
  );

  // Log detalhado dos dados brutos
  useEffect(() => {
    console.log("[Chart] CategoryChart - Dados brutos recebidos:", data);
  }, [data]);

  // Processamento de dados robusto
  const processedData = useMemo(() => {
    if (!data) {
      console.log("[Chart] CategoryChart - Nenhum dado para processar");
      return [];
    }

    try {
      console.log("[Chart] CategoryChart - Processando dados:", data);

      // Caso com subjectFrequency
      if (typeof data === 'object' && 'subjectFrequency' in data && typeof data.subjectFrequency === 'object') {
        console.log("[Chart] CategoryChart - Formato: objeto com subjectFrequency");

        // Converter subjectFrequency para array de {category, value}
        const result = Object.entries(data.subjectFrequency)
          .filter(([key, value]) => key && value)
          .map(([category, value]) => ({
            category,
            value: Number(value)
          }));

        console.log("[Chart] CategoryChart - Dados processados:", result);
        return result;
      }

      // Caso com array de objetos
      if (Array.isArray(data)) {
        console.log("[Chart] CategoryChart - Formato: array de objetos");

        // Verificar se os objetos têm as propriedades necessárias
        if (data.length > 0 && typeof data[0] === 'object') {
          // Verificar quais propriedades usar como categoria e valor
          const sampleObject = data[0];
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
            console.log(`[Chart] CategoryChart - Usando ${categoryKey} e ${valueKey} do array`);
            return data.map(item => ({
              category: item[categoryKey],
              value: Number(item[valueKey])
            }));
          }
        }
      }

      // Se chegou até aqui, tenta extrair qualquer coisa útil do objeto
      if (typeof data === 'object') {
        console.log("[Chart] CategoryChart - Tentando extrair dados de formato desconhecido:", data);

        // Procurar qualquer objeto que possa conter frequências por assunto/categoria
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Verificar se este objeto parece uma tabela de frequências
            const entries = Object.entries(value);
            if (entries.length > 0 && typeof entries[0][1] === 'number') {
              console.log(`[Chart] CategoryChart - Usando objeto ${key} como fonte de dados`);
              return entries.map(([category, count]) => ({
                category,
                value: Number(count)
              }));
            }
          }
        }
      }

      console.log("[Chart] CategoryChart - Formato desconhecido, não foi possível processar os dados");
      return [];
    } catch (error) {
      console.error("[Chart] CategoryChart - Erro ao processar dados:", error);
      return [];
    }
  }, [data]);

  // Log dos dados processados
  useEffect(() => {
    console.log("[Chart] CategoryChart - Dados processados finais:", processedData);
  }, [processedData]);

  return (
    <Card className="p-4 bg-[#141414] border-white/10 w-full mb-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Typograph
            text="Distribuição por Assunto"
            variant="text6"
            weight="semibold"
            fontFamily="montserrat"
            colorText="text-white"
          />
          {isSuccess && processedData.length > 0 && (
            <div className="text-xs text-white/50">
              {processedData.length} categoria(s)
            </div>
          )}
        </div>

        {!isValid && (
          <Fallback message="Selecione uma entidade para visualizar dados" />
        )}

        {isValid && isLoading && (
          <Fallback message="Carregando dados..." />
        )}

        {isValid && isError && (
          <Fallback message={error || "Erro ao carregar dados"} isError />
        )}

        {isValid && isSuccess && processedData.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData} margin={{ top: 5, right: 20, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="category" stroke="#999" angle={-45} textAnchor="end" tick={{ fontSize: 12 }} />
                <YAxis stroke="#999" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f1f1f", borderColor: "#333" }}
                  labelStyle={{ color: "#fff" }}
                  itemStyle={{ color: "#fff" }}
                />
                <Bar dataKey="value" name="Quantidade">
                  {processedData.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={barColors[i % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {isValid && isSuccess && processedData.length === 0 && (
          <div className="flex items-center justify-center h-64 text-center text-white/70">
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-indigo-400/60">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p>Nenhum dado de categorias disponível para esta entidade.</p>
              <button
                onClick={() => refresh()}
                className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function Fallback({ message, isError = false }: { message: string; isError?: boolean }) {
  return (
    <div className={`flex items-center justify-center h-64 ${isError ? "text-red-400" : "text-white/70"} text-center`}>
      <p>{message}</p>
    </div>
  );
}