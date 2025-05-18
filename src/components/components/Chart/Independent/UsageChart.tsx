import { useEffect, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Card } from "@/components/ui/card";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { motion } from "framer-motion";
import { useChartData } from "@/hooks/use-ChartData";
import type { ChartFilterState, UsageData, UsageApiResponse } from "@/@types/ChartsType";

export function UsageChart({ filter }: { filter: ChartFilterState }) {
  // Extração e validação robusta do ID
  const validIds = Array.isArray(filter.ids) ? filter.ids.filter(id => typeof id === 'string' && id.trim() !== '') : [];
  const id = validIds[0] || "";
  const isValid = id !== "";

  console.log("[Chart] UsageChart - ID:", id, "É válido:", isValid);

  const {
    data,
    isLoading,
    isError,
    error,
    isSuccess,
    refresh,
  } = useChartData<UsageApiResponse | null>(
    filter.type,
    "usage",
    "individual",
    id,
    !isValid
  );

  // Log detalhado dos dados brutos
  useEffect(() => {
    console.log("[Chart] UsageChart - Dados brutos recebidos:", data);
  }, [data]);

  // Processamento de dados robusto
  const processedData = useMemo(() => {
    if (!data) {
      console.log("[Chart] UsageChart - Nenhum dado para processar");
      return [];
    }

    try {
      console.log("[Chart] UsageChart - Processando dados:", data);

      // Caso com sessionDetails
      if (typeof data === 'object' && "sessionDetails" in data && Array.isArray(data.sessionDetails)) {
        console.log("[Chart] UsageChart - Formato: objeto com sessionDetails");

        // Se não houver detalhes de sessão, cria um ponto de dados com o tempo total
        if (data.sessionDetails.length === 0 && 'totalUsageTime' in data) {
          console.log("[Chart] UsageChart - Usando totalUsageTime por falta de sessionDetails");
          return [{
            day: new Date().toISOString().split("T")[0],
            minutes: Number(data.totalUsageTime)
          }];
        }

        // Processa os detalhes da sessão
        const usageByDay = new Map<string, number>();
        data.sessionDetails.forEach((s: any) => {
          try {
            // Tenta extrair a data da sessão
            const sessionDate = s.sessionStart ? new Date(s.sessionStart) : new Date();
            const day = sessionDate.toISOString().split("T")[0];
            const duration = typeof s.sessionDuration === 'number' ? s.sessionDuration : 0;

            usageByDay.set(day, (usageByDay.get(day) || 0) + duration);
            console.log(`[Chart] UsageChart - Processado: dia=${day}, duração=${duration}`);
          } catch (e) {
            console.error("[Chart] UsageChart - Erro ao processar detalhe de sessão:", e, s);
          }
        });

        // Se não conseguiu processar nenhum dia, cria um ponto com o tempo total
        if (usageByDay.size === 0 && 'totalUsageTime' in data) {
          console.log("[Chart] UsageChart - Nenhum dia processado, usando totalUsageTime");
          return [{
            day: new Date().toISOString().split("T")[0],
            minutes: Number(data.totalUsageTime)
          }];
        } const result = Array.from(usageByDay, ([day, minutes]) => ({ day, minutes }));
        console.log("[Chart] UsageChart - Dados processados:", result);
        return result;
      }

      // Modo alternativo: usar diretamente totalUsageTime
      if (typeof data === 'object' && 'totalUsageTime' in data) {
        console.log("[Chart] UsageChart - Formato: objeto com totalUsageTime");
        return [{
          day: new Date().toISOString().split("T")[0],
          minutes: Number(data.totalUsageTime)
        }];
      }

      // Caso com array de objetos
      if (Array.isArray(data)) {
        console.log("[Chart] UsageChart - Formato: array de objetos");
        return (data as any[]).map((d: any) => ({
          day: d.day || d.date || new Date().toISOString().split("T")[0],
          minutes: Number(d.minutes || d.duration || 0)
        }));
      }

      // Se chegou até aqui, tenta extrair qualquer coisa útil do objeto
      if (typeof data === 'object') {
        console.log("[Chart] UsageChart - Tentando extrair dados de formato desconhecido:", data);
        const entries = Object.entries(data);

        if (entries.length > 0) {
          // Tenta encontrar campos que pareçam conter dados de uso
          const today = new Date().toISOString().split("T")[0];

          // Tenta encontrar propriedades que pareçam minutos/tempo
          for (const [key, value] of entries) {
            if (
              typeof value === 'number' &&
              (key.toLowerCase().includes('time') ||
                key.toLowerCase().includes('usage') ||
                key.toLowerCase().includes('duration') ||
                key.toLowerCase().includes('minutes'))
            ) {
              console.log(`[Chart] UsageChart - Encontrado possível valor de tempo: ${key}=${value}`);
              return [{ day: today, minutes: value }];
            }
          }

          // Se não encontrou nada específico, use o primeiro número encontrado
          for (const [key, value] of entries) {
            if (typeof value === 'number') {
              console.log(`[Chart] UsageChart - Usando primeiro valor numérico: ${key}=${value}`);
              return [{ day: today, minutes: value }];
            }
          }
        }
      }

      console.log("[Chart] UsageChart - Formato desconhecido, não foi possível processar os dados");
      return [];
    } catch (error) {
      console.error("[Chart] UsageChart - Erro ao processar dados:", error);
      return [];
    }
  }, [data]);

  // Log dos dados processados
  useEffect(() => {
    console.log("[Chart] UsageChart - Dados processados finais:", processedData);
  }, [processedData]);

  // Forçar nova requisição se retorno vazio após sucesso
  useEffect(() => {
    if (isSuccess && isValid && processedData.length === 0) {
      console.log("[Chart] UsageChart - Dados vazios após sucesso, tentando novamente...");
      refresh();
    }
  }, [isSuccess, isValid, processedData, refresh]);

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
          {isSuccess && processedData.length > 0 && (
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

        {isValid && isSuccess && processedData.length > 0 && (
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

        {isValid && isSuccess && processedData.length === 0 && (
          <div className="flex items-center justify-center h-64 text-center text-white/70">
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-indigo-400/60">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p>Nenhum dado de uso disponível para esta entidade.</p>
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