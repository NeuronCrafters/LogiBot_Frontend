import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { logApi, publicApi } from "@/services/apiClient";
import type { ChartFilterState, AccuracyComparisonData } from "@/@types/ChartsType";

interface ChartProps {
  filter: ChartFilterState;
}

export function ComparisonAccuracyChart({ filter }: ChartProps) {
  const [data, setData] = useState<AccuracyComparisonData[]>([]);
  const [loading, setLoading] = useState(true);

  const hasEnoughIds = filter.ids.length > 1;

  useEffect(() => {
    if (!hasEnoughIds) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const accuracyData = await logApi.get<any[]>(
          filter.type,
          "accuracy",
          "compare",
          filter.ids
        );

        if (filter.type === "student") {
          const studentDetails = await Promise.all(
            filter.ids.map((id) => publicApi.getStudentById<{ name: string }>(id))
          );

          const chartData = accuracyData.map((entry, index) => ({
            name: studentDetails[index]?.name || `Aluno ${index + 1}`,
            correct: entry.totalCorrect || 0,
            incorrect: entry.totalWrong || 0,
          }));

          setData(chartData);
        } else {
          const chartData = accuracyData.map((entry) => ({
            name: entry.name || entry.entityName || `Entidade ${entry.id}`,
            correct: entry.totalCorrect || 0,
            incorrect: entry.totalWrong || 0,
          }));

          setData(chartData);
        }
      } catch (error) {
        console.error("Erro ao buscar dados de comparação de acurácia:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filter, hasEnoughIds]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="p-4 bg-[#1f1f1f] border border-white/10 rounded-xl shadow-lg">
        <Typograph
          text={`Acertos e Erros por ${filter.type === "student" ? "Estudante" : "Entidade"}`}
          variant="text9"
          weight="semibold"
          fontFamily="montserrat"
          colorText="text-white"
        />

        {!hasEnoughIds ? (
          <div className="flex items-center justify-center h-64 text-white/70">
            Selecione mais entidades para visualizar a comparação.
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-64 text-white/70">
            Carregando dados comparativos...
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-white/70">
            Nenhum dado disponível para comparação.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
              <XAxis
                dataKey="name"
                stroke="#ffffffcc"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#ffffffcc" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Legend wrapperStyle={{ color: "#ffffff" }} />
              <Bar dataKey="correct" fill="#22c55e" name="Acertos" />
              <Bar dataKey="incorrect" fill="#ef4444" name="Erros" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </motion.div>
  );
}
