import { useEffect, useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Card } from "@/components/ui/card";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { motion } from "framer-motion";
import { useChartData } from "@/hooks/use-ChartData";
import type { ChartFilterState, AccuracyData } from "@/@types/ChartsType";

const COLORS = ["#10b981", "#ef4444"];

export function CorrectWrongChart({ filter }: { filter: ChartFilterState }) {
  const validIds = Array.isArray(filter.ids) ? filter.ids.filter(id => typeof id === 'string' && id.trim() !== '') : [];
  const id = validIds[0] || "";
  const isValid = id !== "";

  console.log("[Chart] CorrectWrongChart - ID:", id, "É válido:", isValid);

  const {
    data,
    isLoading,
    isError,
    error,
    isSuccess,
    refresh,
  } = useChartData<any>(
    filter.type,
    "accuracy",
    "individual",
    id,
    !isValid
  );

  // Log detalhado dos dados brutos
  useEffect(() => {
    console.log("[Chart] CorrectWrongChart - Dados brutos recebidos:", data);
  }, [data]);

  // Processamento de dados robusto
  const processedData = useMemo(() => {
    if (!data) {
      console.log("[Chart] CorrectWrongChart - Nenhum dado para processar");
      return [];
    }

    try {
      console.log("[Chart] CorrectWrongChart - Processando dados:", data);

      // Se o objeto tem as propriedades necessárias
      if (typeof data === 'object' && 'totalCorrect' in data && 'totalWrong' in data) {
        const totalCorrect = Number(data.totalCorrect);
        const totalWrong = Number(data.totalWrong);
        console.log(`[Chart] CorrectWrongChart - Extraindo corretos=${totalCorrect}, errados=${totalWrong}`);

        if (totalCorrect === 0 && totalWrong === 0) {
          console.log("[Chart] CorrectWrongChart - Sem dados de acertos/erros");
          return [];
        }

        return [
          { name: "Acertos", value: totalCorrect },
          { name: "Erros", value: totalWrong }
        ];
      }

      // Se é um array de objetos
      if (Array.isArray(data)) {
        console.log("[Chart] CorrectWrongChart - Processando formato de array");

        // Tentar encontrar objetos com 'correct', 'wrong' ou similares
        const correctItem = data.find(item =>
          item && typeof item === 'object' && (
            'correct' in item ||
            'acertos' in item ||
            'right' in item ||
            'totalCorrect' in item
          )
        );

        const wrongItem = data.find(item =>
          item && typeof item === 'object' && (
            'wrong' in item ||
            'erros' in item ||
            'incorrect' in item ||
            'totalWrong' in item
          )
        );

        if (correctItem && wrongItem) {
          const correctValue = Number(
            correctItem.correct ||
            correctItem.acertos ||
            correctItem.right ||
            correctItem.totalCorrect || 0
          );

          const wrongValue = Number(
            wrongItem.wrong ||
            wrongItem.erros ||
            wrongItem.incorrect ||
            wrongItem.totalWrong || 0
          );

          console.log(`[Chart] CorrectWrongChart - Extraindo do array: corretos=${correctValue}, errados=${wrongValue}`);

          if (correctValue === 0 && wrongValue === 0) {
            return [];
          }

          return [
            { name: "Acertos", value: correctValue },
            { name: "Erros", value: wrongValue }
          ];
        }
      }

      // Verificar se há outras propriedades úteis no objeto
      if (typeof data === 'object') {
        // Tentar extrair de qualquer outro campo que pareça relevante
        let correctValue = null;
        let wrongValue = null;

        // Buscar campos com nomes relacionados a "correto"
        for (const [key, value] of Object.entries(data)) {
          const keyLower = key.toLowerCase();

          if (
            keyLower.includes('correct') ||
            keyLower.includes('acerto') ||
            keyLower.includes('right')
          ) {
            correctValue = Number(value);
            console.log(`[Chart] CorrectWrongChart - Encontrado campo para acertos: ${key}=${value}`);
          }

          if (
            keyLower.includes('wrong') ||
            keyLower.includes('erro') ||
            keyLower.includes('incorrect')
          ) {
            wrongValue = Number(value);
            console.log(`[Chart] CorrectWrongChart - Encontrado campo para erros: ${key}=${value}`);
          }
        }

        if (correctValue !== null && wrongValue !== null) {
          if (correctValue === 0 && wrongValue === 0) {
            return [];
          }

          return [
            { name: "Acertos", value: correctValue },
            { name: "Erros", value: wrongValue }
          ];
        }
      }

      console.log("[Chart] CorrectWrongChart - Formato desconhecido, não foi possível processar os dados");
      return [];
    } catch (error) {
      console.error("[Chart] CorrectWrongChart - Erro ao processar dados:", error);
      return [];
    }
  }, [data]);

  // Log dos dados processados
  useEffect(() => {
    console.log("[Chart] CorrectWrongChart - Dados processados finais:", processedData);
  }, [processedData]);

  const hasData = processedData.length > 0 && processedData.some(d => d.value > 0);

  return (
    <Card className="p-4 bg-[#141414] border-white/10">
      <div className="space-y-4">
        <Typograph
          text="Taxa de Acertos e Erros"
          variant="text6"
          weight="semibold"
          fontFamily="montserrat"
          colorText="text-white"
        />

        {!isValid && (
          <Fallback message="Selecione uma entidade para visualizar dados" />
        )}

        {isValid && isLoading && (
          <Fallback message="Carregando dados..." />
        )}

        {isValid && isError && (
          <Fallback message={error || "Erro ao carregar dados"} isError />
        )}

        {isValid && isSuccess && hasData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processedData}
                  cx="50%" cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {processedData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span style={{ color: "#fff" }}>{value}</span>}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f1f1f", borderColor: "#333" }}
                  labelStyle={{ color: "#fff" }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(value) => [`${value} questões`, ""]} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {isValid && isSuccess && !hasData && (
          <div className="flex items-center justify-center h-64 text-center text-white/70">
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-indigo-400/60">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p>Nenhum dado de acertos/erros disponível para esta entidade.</p>
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