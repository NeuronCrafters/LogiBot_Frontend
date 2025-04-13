import { useEffect, useState, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { api } from "@/services/api";
import { format } from "date-fns";

interface SessionData {
  sessionStart: string;
  metricValue: number;
}

interface UserAnalysisLog {
  name: string;
  sessions: {
    sessionStart: string;
    sessionEnd?: string;
    sessionDuration?: number;
    totalCorrectAnswers: number;
    totalWrongAnswers: number;
  }[];
}

interface ChartComparisonLineProps {
  type: "course" | "class" | "discipline" | "student";
  ids: string[];
  metric: "correct" | "wrong" | "usage";
}

interface CombinedData {
  date: string;
  groupA: number;
  groupB: number;
}

export function ChartComparisonLine({ type, ids, metric }: ChartComparisonLineProps) {
  const [data, setData] = useState<CombinedData[]>([]);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ids.length !== 2) return;
    async function fetchData() {
      try {
        setLoading(true);
        const [resA, resB] = await Promise.all([
          api.get(`/logs/${type}/${ids[0]}`, { withCredentials: true }),
          api.get(`/logs/${type}/${ids[1]}`, { withCredentials: true }),
        ]);
        const logA: UserAnalysisLog = resA.data.logs || resA.data;
        const logB: UserAnalysisLog = resB.data.logs || resB.data;

        // Extrai as sessões para cada log, calculando o valor da métrica
        const sessionsA = (logA.sessions || []).map((s) => {
          let metricValue = 0;
          if (metric === "correct") metricValue = s.totalCorrectAnswers;
          else if (metric === "wrong") metricValue = s.totalWrongAnswers;
          else if (metric === "usage") metricValue = s.sessionDuration ? Math.floor(s.sessionDuration) : 0;
          return { sessionStart: s.sessionStart, metricValue };
        });
        const sessionsB = (logB.sessions || []).map((s) => {
          let metricValue = 0;
          if (metric === "correct") metricValue = s.totalCorrectAnswers;
          else if (metric === "wrong") metricValue = s.totalWrongAnswers;
          else if (metric === "usage") metricValue = s.sessionDuration ? Math.floor(s.sessionDuration) : 0;
          return { sessionStart: s.sessionStart, metricValue };
        });

        // Agrupa por data (formato yyyy-MM-dd)
        const combinedMap: Record<string, { groupA: number; groupB: number }> = {};
        sessionsA.forEach(({ sessionStart, metricValue }) => {
          const dateKey = format(new Date(sessionStart), "yyyy-MM-dd");
          if (!combinedMap[dateKey]) combinedMap[dateKey] = { groupA: 0, groupB: 0 };
          combinedMap[dateKey].groupA += metricValue;
        });
        sessionsB.forEach(({ sessionStart, metricValue }) => {
          const dateKey = format(new Date(sessionStart), "yyyy-MM-dd");
          if (!combinedMap[dateKey]) combinedMap[dateKey] = { groupA: 0, groupB: 0 };
          combinedMap[dateKey].groupB += metricValue;
        });
        const combinedData: CombinedData[] = Object.entries(combinedMap).map(([date, values]) => ({
          date,
          ...values,
        }));
        combinedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setData(combinedData);
      } catch (error) {
        console.error("Erro ao buscar dados comparativos (line):", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [type, ids, metric]);

  return (
    <div ref={chartRef} className="w-full max-w-5xl bg-[#1F1F1F] rounded-xl p-6 shadow-lg">
      {loading ? (
        <p className="text-white text-lg text-center">Carregando comparativo (Line)...</p>
      ) : data.length === 0 ? (
        <p className="text-red-500 text-lg text-center">Sem dados disponíveis para o período.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <XAxis dataKey="date" stroke="#fff" tick={{ fontSize: 12 }} />
            <YAxis stroke="#fff" tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: "#222", borderRadius: "8px", border: "none" }} labelStyle={{ color: "#fff" }} />
            <Legend wrapperStyle={{ color: "#fff" }} />
            <Line type="monotone" dataKey="groupA" stroke="#4ade80" name="Grupo 1" />
            <Line type="monotone" dataKey="groupB" stroke="#f87171" name="Grupo 2" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
