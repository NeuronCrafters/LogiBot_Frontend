import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { api } from "@/services/api";

interface ChartLogsProps {
  type: "course" | "class" | "discipline";
  id: string;
}

interface LogData {
  name: string;
  correct: number;
  wrong: number;
  usage: number;
}

interface UserAnalysisLog {
  name: string;
  totalCorrectAnswers: number;
  totalWrongAnswers: number;
  totalUsageTime: number;
}

function ChartLogs({ type, id }: ChartLogsProps) {
  const [data, setData] = useState<LogData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true);
        const response = await api.get(`/logs/${type}/${id}`, {
          withCredentials: true,
        });

        const logs: UserAnalysisLog[] =
          type === "class" ? response.data : response.data.logs;

        const formatted: LogData[] = logs.map((log) => ({
          name: log.name,
          correct: log.totalCorrectAnswers || 0,
          wrong: log.totalWrongAnswers || 0,
          usage: Math.floor(log.totalUsageTime || 0),
        }));

        setData(formatted);
      } catch (error) {
        console.error("Erro ao buscar logs:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, [type, id]);


  if (loading) {
    return <p className="text-white text-xl">Carregando gráficos...</p>;
  }

  if (data.length === 0) {
    return <p className="text-red-400 text-lg">Sem dados disponíveis</p>;
  }

  return (
    <div className="w-full max-w-5xl bg-[#1F1F1F] rounded-xl p-6 shadow-lg">
      <h2 className="text-white text-2xl font-bold mb-4 text-center">Desempenho Geral</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="name" stroke="#fff" />
          <YAxis stroke="#fff" />
          <Tooltip />
          <Legend />
          <Bar dataKey="correct" fill="#4ade80" name="Respostas Corretas" />
          <Bar dataKey="wrong" fill="#f87171" name="Respostas Incorretas" />
          <Bar dataKey="usage" fill="#60a5fa" name="Tempo de Uso (s)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export { ChartLogs };
