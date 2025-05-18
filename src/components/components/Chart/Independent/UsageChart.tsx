import { useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { Card } from "@/components/ui/card";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { motion } from "framer-motion";
import { useChartData } from "@/hooks/use-ChartData";
import type { ChartFilterState, UsageData, UsageApiResponse } from "@/@types/ChartsType";

export function UsageChart({ filter }: { filter: ChartFilterState }) {
  const isValidFilter = !!filter.ids[0] && filter.ids[0].trim() !== "";

  const {
    data,
    isLoading,
    isError,
    error,
    loadingState,
    hasValidIds,
  } = useChartData<UsageApiResponse | null>(
    filter.type,
    "usage",
    "individual",
    filter.ids[0] || "",
    !isValidFilter
  );

  const processedData = useMemo(() => processUsageData(data), [data]);

  useEffect(() => {
    if (data && import.meta.env.DEV) {
      console.log("Dados brutos de uso:", data);
      console.log("Dados processados:", processedData);
    }
  }, [data, processedData]);

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
        </div>

        {!isValidFilter ? (
          <div className="flex items-center justify-center h-64 text-white/70">
            Selecione uma entidade para visualizar dados
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-64 text-white/70">
            Carregando dados...
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center h-64 text-red-400">
            {error}
          </div>
        ) : processedData.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="h-64 w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={processedData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="day"
                  stroke="#999"
                  tickFormatter={(value) => {
                    if (!value) return "";
                    const date = new Date(value);
                    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
                  }}
                />
                <YAxis
                  stroke="#999"
                  label={{
                    value: "Minutos",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "#999" }
                  }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f1f1f", borderColor: "#333" }}
                  labelStyle={{ color: "#fff" }}
                  itemStyle={{ color: "#fff" }}
                  labelFormatter={(value) => {
                    if (!value) return "";
                    const date = new Date(value);
                    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
                  }}
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
                  dot={{ r: 4, fill: "#6366f1", stroke: "#fff", strokeWidth: 1 }}
                  activeDot={{ r: 6, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
                  name="Tempo de uso"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        ) : (
          <div className="flex items-center justify-center h-64 text-white/70 text-center">
            <div>
              <p>Nenhum dado de uso disponível.</p>
              <p className="text-sm mt-2 max-w-md">O usuário pode não ter sessões registradas ou os dados estão em formato diferente.</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function processUsageData(data: UsageApiResponse | any | null): UsageData[] {
  if (!data) return [];

  if (data.sessionDetails && Array.isArray(data.sessionDetails)) {
    const usageByDay = new Map<string, number>();

    data.sessionDetails.forEach((session: { sessionStart: string; sessionDuration: number }) => {
      if (session.sessionStart && session.sessionDuration) {
        const date = new Date(session.sessionStart);
        const dateStr = date.toISOString().split("T")[0];
        const currentMinutes = usageByDay.get(dateStr) || 0;
        usageByDay.set(dateStr, currentMinutes + Number(session.sessionDuration));
      }
    });

    return Array.from(usageByDay.entries())
      .map(([day, minutes]) => ({ day, minutes }))
      .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());
  }

  if (Array.isArray(data) && data.length > 0 && "day" in data[0]) {
    return data.map((item: any) => ({
      day: item.day,
      minutes: Number(item.minutes)
    }));
  }

  if (Array.isArray(data) && data.length > 0 && "date" in data[0]) {
    return data.map((item: any) => ({
      day: item.date,
      minutes: Number(item.minutes)
    }));
  }

  if (data.totalUsageTime !== undefined) {
    const today = new Date().toISOString().split("T")[0];
    return [{ day: today, minutes: Number(data.totalUsageTime) }];
  }

  console.warn("Formato de dados de uso não reconhecido:", data);
  return [];
}
