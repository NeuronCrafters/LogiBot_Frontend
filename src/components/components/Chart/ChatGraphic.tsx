import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";

interface ShadcnBarChartProps {
  type: "course" | "class" | "discipline";
  id: string;
}

interface UserAnalysisLog {
  name: string;
  totalCorrectAnswers: number;
  totalWrongAnswers: number;
  totalUsageTime: number;
}

interface ChartData {
  name: string;
  correct: number;
  wrong: number;
  usage: number;
}

function ChartGraphics({ type, id }: ShadcnBarChartProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await api.get(`/logs/${type}/${id}`, {
          withCredentials: true,
        });

        const logs: UserAnalysisLog[] =
          type === "class" ? response.data : response.data.logs;

        const formatted: ChartData[] = logs.map((log) => ({
          name: log.name,
          correct: log.totalCorrectAnswers || 0,
          wrong: log.totalWrongAnswers || 0,
          usage: Math.floor(log.totalUsageTime || 0),
        }));

        setData(formatted);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [type, id]);

  if (loading) {
    return <p className="text-white text-lg">Carregando dados...</p>;
  }

  if (data.length === 0) {
    return <p className="text-red-500 text-lg">Sem dados disponíveis</p>;
  }

  return (
    <Card className="bg-[#1F1F1F] text-white">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">
          Gráfico de Interações
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="name" stroke="#fff" tick={{ fontSize: 12 }} />
            <YAxis stroke="#fff" tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend wrapperStyle={{ color: "#fff" }} />
            <Bar dataKey="correct" fill="#4ade80" name="Corretas" />
            <Bar dataKey="wrong" fill="#f87171" name="Incorretas" />
            <Bar dataKey="usage" fill="#60a5fa" name="Tempo de Uso (s)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export { ChartGraphics }