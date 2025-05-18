import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { motion } from "framer-motion";
import { logApi } from "@/services/apiClient";
import type { ChartFilterState, UsageComparisonData } from "@/@types/ChartsType";

export function UsageComparisonChart({ filter }: { filter: ChartFilterState }) {
  const [data, setData] = useState<UsageComparisonData[]>([]);
  const [loading, setLoading] = useState(false);

  const hasMultipleIds = filter.ids.length > 1;

  useEffect(() => {
    if (!hasMultipleIds) return;

    setLoading(true);

    logApi
      .get<UsageComparisonData[]>(filter.type, "usage", "compare", filter.ids)
      .then((response) => {
        setData(response);
      })
      .catch((error) => {
        console.error("Erro ao carregar dados de comparação de uso:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [filter, hasMultipleIds]);

  if (!hasMultipleIds) {
    return (
      <Card className="p-4 bg-[#1f1f1f] border border-white/10 rounded-xl shadow-lg">
        <Typograph
          text="Comparação de Tempo de uso Diário"
          variant="text6"
          weight="semibold"
          fontFamily="montserrat"
          colorText="text-white"
        />
        <div className="flex items-center justify-center h-64 text-white/70">
          Selecione mais entidades para visualizar a comparação.
        </div>
      </Card>
    );
  }

  const userKeys = data.length > 0
    ? Object.keys(data[0]).filter((key) => key !== "dia")
    : [];

  const colors = ["#6366f1", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
      className="w-full"
    >
      <Card className="p-4 bg-[#1f1f1f] border border-white/10 rounded-xl shadow-lg">
        <Typograph
          text="Comparação de Tempo de uso Diário"
          variant="text6"
          weight="semibold"
          fontFamily="montserrat"
          colorText="text-white"
        />

        {loading ? (
          <div className="flex items-center justify-center h-64 text-white/70">
            Carregando dados de uso...
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-white/70">
            Nenhum dado disponível para comparação.
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
                <XAxis
                  dataKey="dia"
                  stroke="#ffffffcc"
                  tickFormatter={(value) => {
                    try {
                      const date = new Date(value);
                      return date.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                      });
                    } catch {
                      return value;
                    }
                  }}
                />
                <YAxis
                  stroke="#ffffffcc"
                  label={{
                    value: "Minutos",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "#ffffffcc" },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f1f1f",
                    border: "1px solid #ffffff22",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#ffffff" }}
                  itemStyle={{ color: "#ffffff" }}
                  labelFormatter={(value) => {
                    try {
                      const date = new Date(value);
                      return date.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      });
                    } catch {
                      return value;
                    }
                  }}
                />
                <Legend wrapperStyle={{ color: "#ffffff" }} />
                {userKeys.map((user, index) => (
                  <Line
                    key={user}
                    type="monotone"
                    dataKey={user}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    name={user}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
