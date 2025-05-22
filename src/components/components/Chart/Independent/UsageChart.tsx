import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Card } from "@/components/ui/card";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { motion } from "framer-motion";
import { logApi } from "@/services/apiClient";
import type { ChartFilterState } from "@/@types/ChartsType";

interface UsageChartProps {
  filter: ChartFilterState;
}

function useUsageData(filter: ChartFilterState) {
  const validIds = Array.isArray(filter.ids) ?
    filter.ids.filter(id => typeof id === 'string' && id.trim() !== '') :
    [];

  const id = validIds[0] || "";

  return useQuery({
    queryKey: ['usage', filter.type, id],
    queryFn: () => id ? logApi.get(filter.type, "usage", "individual", id) : Promise.reject("ID inválido"),
    enabled: !!id,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    select: (rawData: any) => {
      console.log("Dados brutos COMPLETOS:", JSON.stringify(rawData, null, 2));

      // Log detalhado de todas as possíveis fontes de tempo
      console.log("Fontes de tempo de uso:", {
        usageTimeInSeconds: rawData.usageTimeInSeconds,
        usageTime: rawData.usageTime,
        usersUsageTime: rawData.users?.usageTime,
        usersTotalUsageTime: rawData.users?.totalUsageTime
      });

      // Estratégia de extração de tempo
      const minutes =
        rawData.usageTime?.minutes ||
        (rawData.usageTimeInSeconds / 60) ||
        (rawData.users?.usageTime?.minutes) ||
        (rawData.users?.totalUsageTime / 60) || 0;

      console.log("Minutos calculados:", minutes);

      // Criar ponto de dados
      const result = [{
        day: new Date().toISOString().split("T")[0],
        minutes: minutes,
        formatted: rawData.usageTime?.formatted || "00:00:00"
      }];

      console.log("Resultado final processado:", result);
      return result;
    }
  });
}

export function UsageChart({ filter }: UsageChartProps) {
  const {
    data: processedData = [],
    isLoading,
    isError,
    error,
    refetch
  } = useUsageData(filter);

  // Extração e validação robusta do ID
  const validIds = Array.isArray(filter.ids) ?
    filter.ids.filter(id => typeof id === 'string' && id.trim() !== '') :
    [];

  const id = validIds[0] || "";
  const isValid = id !== "";

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
            <p>{error instanceof Error ? error.message : "Erro ao carregar dados."}</p>
            <button
              onClick={() => refetch()}
              className="ml-2 text-indigo-400 hover:text-indigo-300"
            >
              Tentar novamente
            </button>
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
                onClick={() => refetch()}
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