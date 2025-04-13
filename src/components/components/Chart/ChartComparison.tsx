import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { api } from "@/services/api";

interface UserAnalysisLog {
  name: string;
  totalCorrectAnswers: number;
  totalWrongAnswers: number;
  totalUsageTime: number;
}

interface ComparisonData {
  name: string;
  groupA: number;
  groupB: number;
}

interface ChartComparisonProps {
  type: "course" | "class" | "discipline";
  ids: string[];
  metric: "correct" | "wrong" | "usage";
}

export function ChartComparison({ type, ids, metric }: ChartComparisonProps) {
  const [data, setData] = useState<ComparisonData[]>([]);
  const [labelA, setLabelA] = useState("Grupo A");
  const [labelB, setLabelB] = useState("Grupo B");

  useEffect(() => {
    async function fetchData() {
      try {
        const [resA, resB] = await Promise.all([
          api.get(`/logs/${type}/${ids[0]}`, { withCredentials: true }),
          api.get(`/logs/${type}/${ids[1]}`, { withCredentials: true }),
        ]);

        const logsA: UserAnalysisLog[] = resA.data.logs || resA.data;
        const logsB: UserAnalysisLog[] = resB.data.logs || resB.data;

        const mergedData: ComparisonData[] = logsA.map((log, i) => {
          const bLog = logsB[i];
          const getMetricValue = (log: UserAnalysisLog | undefined) => {
            if (!log) return 0;
            if (metric === "correct") return log.totalCorrectAnswers;
            if (metric === "wrong") return log.totalWrongAnswers;
            return Math.floor(log.totalUsageTime);
          };

          return {
            name: log.name,
            groupA: getMetricValue(log),
            groupB: getMetricValue(bLog),
          };
        });

        setLabelA(logsA[0]?.name || "Grupo A");
        setLabelB(logsB[0]?.name || "Grupo B");
        setData(mergedData);
      } catch (err) {
        console.error("Erro ao buscar dados comparativos", err);
      }
    }

    if (ids.length === 2) fetchData();
  }, [type, ids, metric]);

  if (ids.length !== 2)
    return <p className="text-red-400">Selecione dois grupos para comparar.</p>;
  if (data.length === 0)
    return <p className="text-white">Carregando comparativo...</p>;

  const title =
    metric === "correct"
      ? "Respostas Corretas"
      : metric === "wrong"
        ? "Respostas Incorretas"
        : "Tempo de Uso";

  return (
    <div className="w-full max-w-5xl bg-[#1F1F1F] rounded-xl p-6 shadow-lg">
      <h2 className="text-white text-2xl font-bold mb-4 text-center">
        Comparativo de {title}
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="name" stroke="#fff" tick={{ fontSize: 12 }} />
          <YAxis stroke="#fff" tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend wrapperStyle={{ color: "#fff" }} />
          <Bar dataKey="groupA" fill="#4ade80" name={labelA} />
          <Bar dataKey="groupB" fill="#60a5fa" name={labelB} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
