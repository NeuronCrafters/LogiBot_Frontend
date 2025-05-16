import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-Auth";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { publicApi, logApi } from "@/services/apiClient";
import { ChartFilterState } from "@/@types/ChartsType";

interface ChartProps {
  filter: ChartFilterState;
}

interface ChartData {
  name: string;
  correct: number;
  incorrect: number;
}

export function ComparisonAccuracyChart({ filter }: ChartProps) {
  const { user } = useAuth();
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  const shouldRender =
    filter.type === "student" &&
    filter.mode === "compare" &&
    filter.ids.length > 0;

  useEffect(() => {
    if (!shouldRender) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const accuracy = await logApi.get<any[]>("student", "accuracy", "compare", filter.ids);

        const students = await Promise.all(
          filter.ids.map((id) => publicApi.getStudentById<{ name: string }>(id))
        );

        const chartData = accuracy.map((entry, index) => ({
          name: students[index].name,
          correct: entry.correctAnswers,
          incorrect: entry.wrongAnswers,
        }));

        setData(chartData);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filter]);

  if (!shouldRender) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-[#141414] p-4 rounded-2xl shadow-lg mt-4 w-full"
    >
      <Typograph
        text="Acertos e Erros por Estudante"
        variant="text9"
        weight="semibold"
        fontFamily="montserrat"
        colorText="text-white"
      />

      {loading ? (
        <p className="text-white">Carregando dados...</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="name" stroke="#ffffff" />
            <YAxis stroke="#ffffff" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                borderRadius: "8px",
                color: "#fff",
              }}
              labelStyle={{ color: "#fff" }}
            />
            <Bar dataKey="correct" fill="#22c55e" name="Acertos" />
            <Bar dataKey="incorrect" fill="#ef4444" name="Erros" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}
