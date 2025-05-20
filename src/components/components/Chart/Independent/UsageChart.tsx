import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Card } from "@/components/ui/card";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { motion } from "framer-motion";
import { logApi } from "@/services/apiClient";
import type { ChartFilterState, UsageData, UsageApiResponse } from "@/@types/ChartsType";

export function UsageChart({ filter }: { filter: ChartFilterState }) {
  console.log("UsageChart - Renderizado com filtro:", filter);

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
      console.log("UsageChart - ID inválido, não buscando dados");
      return;
    }

    // Verificar se já buscamos dados para este ID
    if (lastFetchedId === id && data !== null) {
      console.log("UsageChart - Já temos dados para este ID, pulando fetch");
      return;
    }

    console.log("UsageChart - Iniciando busca de dados para ID:", id);
    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      console.log("UsageChart - Buscando dados para:", filter.type, id);
      const response = await logApi.get<any>(
        filter.type,
        "usage",
        "individual",
        id
      );

      console.log("UsageChart - Dados recebidos:", response);
      setData(response);
      processData(response);
      setLastFetchedId(id);
    } catch (err: any) {
      console.error("UsageChart - Erro ao buscar dados:", err);
      setIsError(true);
      setError(err?.message || "Erro ao carregar dados de uso.");
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
      console.log("UsageChart - Processando dados:", rawData);
      let result: any[] = [];

      // Caso com sessionDetails - agora suportado para todas as entidades
      if (typeof rawData === 'object' && "sessionDetails" in rawData && Array.isArray(rawData.sessionDetails)) {
        console.log("UsageChart - Formato: objeto com sessionDetails");

        // Se não houver detalhes de sessão, cria um ponto de dados com o tempo total
        if (rawData.sessionDetails.length === 0 && 'totalUsageTime' in rawData) {
          console.log("UsageChart - Usando totalUsageTime por falta de sessionDetails");
          result = [{
            day: new Date().toISOString().split("T")[0],
            minutes: Number(rawData.totalUsageTime) / 60 // Convertendo para minutos se for em segundos
          }];
        } else {
          // Processa os detalhes da sessão
          const usageByDay = new Map<string, number>();
          rawData.sessionDetails.forEach((s: any) => {
            try {
              // Tenta extrair a data da sessão
              const sessionDate = s.sessionStart ? new Date(s.sessionStart) : new Date();
              const day = sessionDate.toISOString().split("T")[0];
              // Verifica se a duração é em segundos e converte para minutos
              const duration = typeof s.sessionDuration === 'number' ? s.sessionDuration / 60 : 0;

              usageByDay.set(day, (usageByDay.get(day) || 0) + duration);
              console.log(`UsageChart - Processado: dia=${day}, duração=${duration} minutos`);
            } catch (e) {
              console.error("UsageChart - Erro ao processar detalhe de sessão:", e, s);
            }
          });

          // Se não conseguiu processar nenhum dia, cria um ponto com o tempo total
          if (usageByDay.size === 0 && 'totalUsageTime' in rawData) {
            console.log("UsageChart - Nenhum dia processado, usando totalUsageTime");
            result = [{
              day: new Date().toISOString().split("T")[0],
              minutes: Number(rawData.totalUsageTime) / 60 // Convertendo para minutos
            }];
          } else {
            result = Array.from(usageByDay, ([day, minutes]) => ({ day, minutes }));
          }
        }
      }
      // Modo alternativo: usar diretamente totalUsageTime
      else if (typeof rawData === 'object' && 'totalUsageTime' in rawData) {
        console.log("UsageChart - Formato: objeto com totalUsageTime");
        result = [{
          day: new Date().toISOString().split("T")[0],
          minutes: Number(rawData.totalUsageTime) / 60 // Convertendo para minutos se for em segundos
        }];
      }
      // Se houver usageTimeInSeconds, esse é o formato adaptado do nosso backend
      else if (typeof rawData === 'object' && 'usageTimeInSeconds' in rawData) {
        console.log("UsageChart - Formato adaptado com usageTimeInSeconds");
        result = [{
          day: new Date().toISOString().split("T")[0],
          minutes: Number(rawData.usageTimeInSeconds) / 60 // Convertendo para minutos
        }];
      }
      // Caso com array de objetos
      else if (Array.isArray(rawData)) {
        console.log("UsageChart - Formato: array de objetos");
        result = (rawData as any[]).map((d: any) => ({
          day: d.day || d.date || new Date().toISOString().split("T")[0],
          minutes: Number(d.minutes || d.duration || 0)
        }));
      } else {
        console.log("UsageChart - Formato desconhecido, não foi possível processar os dados");
        result = [];
      }

      console.log("UsageChart - Dados processados finais:", result);
      setProcessedData(result);
    } catch (error) {
      console.error("UsageChart - Erro ao processar dados:", error);
      setProcessedData([]);
    }
  };

  // Efeito para buscar dados quando o filtro mudar
  useEffect(() => {
    console.log("UsageChart - Filtro mudou, ID:", id, "Válido:", isValid);
    if (isValid) {
      fetchData();
    } else {
      // Limpar dados quando não há ID válido
      setData(null);
      setProcessedData([]);
      setLastFetchedId(null);
    }
  }, [filter.type, id]);

  return (
    <Card className="p-4 bg-[#141414] border-white/10 w-full mb-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Typograph
            text="Tempo de Uso Diário"
            variant="text6"
            weight="semibold"
            fontFamily="montserrat"
            colorText="text-white"
          />
          {!isLoading && !isError && processedData.length > 0 && (
            <div className="text-xs text-white/50">
              {processedData.length} registro(s)
            </div>
          )}
        </div>

        {!isValid && (
          <div className="flex items-center justify-center h-64 text-center text-white/70">
            <p>Selecione uma entidade para visualizar dados.</p>
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

        {isValid && !isLoading && !isError && processedData.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="h-64 w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="day"
                  stroke="#999"
                  tickFormatter={v =>
                    new Date(v).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    })
                  }
                />
                <YAxis
                  stroke="#999"
                  label={{
                    value: "Minutos",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "#999" },
                  }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f1f1f", borderColor: "#333" }}
                  labelStyle={{ color: "#fff" }}
                  itemStyle={{ color: "#fff" }}
                  labelFormatter={v => new Date(v).toLocaleDateString("pt-BR")}
                  formatter={(value: number) => [`${value.toFixed(2)} minutos`, "Tempo de uso"]}
                />
                <Legend
                  wrapperStyle={{ color: "#fff" }}
                  formatter={() => <span style={{ color: "#fff" }}>Tempo de uso</span>}
                />
                <Line
                  type="monotone"
                  dataKey="minutes"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{
                    r: 4,
                    fill: "#6366f1",
                    stroke: "#fff",
                    strokeWidth: 1,
                  }}
                  activeDot={{
                    r: 6,
                    fill: "#6366f1",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {isValid && !isLoading && !isError && processedData.length === 0 && (
          <div className="flex items-center justify-center h-64 text-center text-white/70">
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-indigo-400/60">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p>Nenhum dado de uso disponível para esta entidade.</p>
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