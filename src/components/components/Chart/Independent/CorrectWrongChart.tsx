import { useState, useEffect } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Card } from "@/components/ui/card";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { motion } from "framer-motion";
import { logApi } from "@/services/apiClient";
import type { ChartFilterState } from "@/@types/ChartsType";

const COLORS = ["#10b981", "#ef4444"];

export function CorrectWrongChart({ filter }: { filter: ChartFilterState }) {
  console.log("CorrectWrongChart - Renderizado com filtro:", filter);

  // Estados para gerenciar dados e estado de carregamento
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [lastFetchedId, setLastFetchedId] = useState<string | null>(null);

  // Extração e validação robusta do ID
  const validIds = Array.isArray(filter.ids) ? filter.ids.filter(id => typeof id === 'string' && id.trim() !== '') : [];
  const id = validIds[0] || "";
  const isValid = id !== "";

  // Função para buscar dados da API
  const fetchData = async () => {
    if (!isValid) {
      console.log("CorrectWrongChart - ID inválido, não buscando dados");
      return;
    }

    // Verificar se já buscamos dados para este ID
    if (lastFetchedId === id && data !== null) {
      console.log("CorrectWrongChart - Já temos dados para este ID, pulando fetch");
      return;
    }

    console.log("CorrectWrongChart - Iniciando busca de dados para ID:", id);
    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      console.log("CorrectWrongChart - Buscando dados para:", filter.type, id);
      const response = await logApi.get<any>(
        filter.type,
        "accuracy",
        "individual",
        id
      );

      console.log("CorrectWrongChart - Dados recebidos:", response);
      setData(response);
      processData(response);
      setLastFetchedId(id);
    } catch (err: any) {
      console.error("CorrectWrongChart - Erro ao buscar dados:", err);
      setIsError(true);
      setError(err?.message || "Erro ao carregar dados de acertos/erros.");
      setProcessedData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para processar os dados recebidos
  const processData = (rawData: any) => {
    if (!rawData) {
      setProcessedData([]);
      return;
    }

    try {
      console.log("CorrectWrongChart - Processando dados:", rawData);
      let result: any[] = [];

      // Se o objeto tem as propriedades necessárias
      if (typeof rawData === 'object' && (
        ('totalCorrect' in rawData && 'totalWrong' in rawData) ||
        ('totalCorrectAnswers' in rawData && 'totalWrongAnswers' in rawData)
      )) {
        const totalCorrect = Number(rawData.totalCorrect || rawData.totalCorrectAnswers || 0);
        const totalWrong = Number(rawData.totalWrong || rawData.totalWrongAnswers || 0);
        console.log(`CorrectWrongChart - Extraindo corretos=${totalCorrect}, errados=${totalWrong}`);

        if (totalCorrect === 0 && totalWrong === 0) {
          console.log("CorrectWrongChart - Sem dados de acertos/erros");
          result = [];
        } else {
          result = [
            { name: "Acertos", value: totalCorrect },
            { name: "Erros", value: totalWrong }
          ];
        }
      }
      // Se é um array de objetos
      else if (Array.isArray(rawData)) {
        console.log("CorrectWrongChart - Processando formato de array");

        // Tentar encontrar objetos com 'correct', 'wrong' ou similares
        const correctItem = rawData.find(item =>
          item && typeof item === 'object' && (
            'correct' in item ||
            'acertos' in item ||
            'right' in item ||
            'totalCorrect' in item
          )
        );

        const wrongItem = rawData.find(item =>
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

          console.log(`CorrectWrongChart - Extraindo do array: corretos=${correctValue}, errados=${wrongValue}`);

          if (correctValue === 0 && wrongValue === 0) {
            result = [];
          } else {
            result = [
              { name: "Acertos", value: correctValue },
              { name: "Erros", value: wrongValue }
            ];
          }
        }
      }
      // Verificar se há outras propriedades úteis no objeto
      else if (typeof rawData === 'object') {
        // Tentar extrair de qualquer outro campo que pareça relevante
        let correctValue = null;
        let wrongValue = null;

        // Buscar campos com nomes relacionados a "correto"
        for (const [key, value] of Object.entries(rawData)) {
          const keyLower = key.toLowerCase();

          if (
            keyLower.includes('correct') ||
            keyLower.includes('acerto') ||
            keyLower.includes('right')
          ) {
            correctValue = Number(value);
            console.log(`CorrectWrongChart - Encontrado campo para acertos: ${key}=${value}`);
          }

          if (
            keyLower.includes('wrong') ||
            keyLower.includes('erro') ||
            keyLower.includes('incorrect')
          ) {
            wrongValue = Number(value);
            console.log(`CorrectWrongChart - Encontrado campo para erros: ${key}=${value}`);
          }
        }

        if (correctValue !== null && wrongValue !== null) {
          if (correctValue === 0 && wrongValue === 0) {
            result = [];
          } else {
            result = [
              { name: "Acertos", value: correctValue },
              { name: "Erros", value: wrongValue }
            ];
          }
        }
      } else {
        console.log("CorrectWrongChart - Formato desconhecido, não foi possível processar os dados");
        result = [];
      }

      console.log("CorrectWrongChart - Dados processados finais:", result);
      setProcessedData(result);
    } catch (error) {
      console.error("CorrectWrongChart - Erro ao processar dados:", error);
      setProcessedData([]);
    }
  };

  // Efeito para buscar dados quando o filtro mudar
  useEffect(() => {
    console.log("CorrectWrongChart - Filtro mudou, ID:", id, "Válido:", isValid);
    if (isValid) {
      fetchData();
    } else {
      // Limpar dados quando não há ID válido
      setData(null);
      setProcessedData([]);
      setLastFetchedId(null);
    }
  }, [filter.type, id]);

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
          <div className="flex items-center justify-center h-64 text-center text-white/70">
            <p>Selecione uma entidade para visualizar dados</p>
          </div>
        )}

        {isValid && isLoading && (
          <div className="flex items-center justify-center h-64 text-center text-white/70">
            <div className="flex flex-col items-center">
              <div className="animate-pulse w-10 h-10 rounded-full bg-indigo-600/30 mb-3"></div>
              <p>Carregando dados...</p>
            </div>
          </div>
        )}

        {isValid && isError && (
          <div className="flex items-center justify-center h-64 text-center text-red-400">
            <p>{error || "Erro ao carregar dados."}</p>
          </div>
        )}

        {isValid && !isLoading && !isError && hasData && (
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

        {isValid && !isLoading && !isError && !hasData && (
          <div className="flex items-center justify-center h-64 text-center text-white/70">
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-indigo-400/60">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p>Nenhum dado de acertos/erros disponível para esta entidade.</p>
              <button
                onClick={fetchData}
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