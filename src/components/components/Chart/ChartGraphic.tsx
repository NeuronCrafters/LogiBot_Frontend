import { useEffect, useRef, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { api } from "@/services/api/api";
import { toPng } from "html-to-image";
import { downloadCSV } from "@/lib/downloadCSV";
import { MetricOption } from "./MetricCheckboxSelector";

// Definindo as cores para cada métrica
const metricsColors: Record<string, string> = {
  correct: "#4ade80",
  wrong: "#f87171",
  usage: "#60a5fa",
  sessions: "#fbbf24",
};

export interface ChartGraphicsProps {
  type: "course" | "class" | "discipline" | "student";
  id: string;
  metrics?: MetricOption[];
}

interface UserAnalysisLog {
  name: string;
  totalCorrectAnswers: number;
  totalWrongAnswers: number;
  totalUsageTime: number;
  sessions?: any[];
}

interface ChartData {
  name: string;
  correct: number;
  wrong: number;
  usage: number;
  sessions: number;
}

// Helper para converter segundos em um formato amigável
function formatTimeUsage(seconds: number): string {
  if (seconds < 60) return `${seconds} seg`;
  const mins = seconds / 60;
  if (mins < 60) return `${mins.toFixed(1)} min`;
  const hrs = mins / 60;
  if (hrs < 24) return `${hrs.toFixed(1)} hrs`;
  const days = hrs / 24;
  if (days < 7) return `${days.toFixed(1)} dias`;
  const weeks = days / 7;
  if (weeks < 4) return `${weeks.toFixed(1)} sem`;
  const months = days / 30.44;
  if (months < 12) return `${months.toFixed(1)} mes`;
  const years = days / 365;
  return `${years.toFixed(1)} anos`;
}

export function ChartGraphics({ type, id, metrics = ["correct", "wrong", "usage", "sessions"] }: ChartGraphicsProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  // Filtros de data (que já são passados para a API, supondo que o back-end use aggregation para filtrar sessions)
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        // Envia query params para que o back-end filtre as sessões conforme necessário
        const params: Record<string, string> = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        const response = await api.get(`/logs/${type}/${id}`, {
          withCredentials: true,
          params,
        });
        const logsArray: UserAnalysisLog[] = Array.isArray(response.data)
          ? response.data
          : response.data.logs || [];
        const formatted: ChartData[] = logsArray.map((log) => ({
          name: log.name,
          correct: log.totalCorrectAnswers ?? 0,
          wrong: log.totalWrongAnswers ?? 0,
          usage: Math.floor(log.totalUsageTime ?? 0),
          sessions: log.sessions ? log.sessions.length : 0,
        }));
        setData(formatted);
      } catch (error) {
        console.error("Erro ao buscar dados de logs:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [type, id, startDate, endDate]);

  const handleExportCSV = () => {
    // Cria as colunas a partir das métricas selecionadas
    const rows = data.map((item) => {
      const row: any = { Nome: item.name };
      metrics.forEach((metric) => {
        if (metric === "correct") row["Questões Certas"] = item.correct;
        if (metric === "wrong") row["Questões Erradas"] = item.wrong;
        if (metric === "usage") row["Tempo de Uso (s)"] = item.usage;
        if (metric === "sessions") row["Sessões"] = item.sessions;
      });
      return row;
    });
    downloadCSV(`interacoes_${type}_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`, rows);
  };

  const handleExportPNG = () => {
    if (!chartRef.current) return;
    toPng(chartRef.current)
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `grafico_${type}_${format(new Date(), "yyyyMMdd_HHmmss")}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error("Erro ao exportar imagem:", err);
      });
  };

  return (
    <Card className="bg-[#1F1F1F] text-white">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold mb-4">Gráfico de Interações</CardTitle>
        <div className="flex flex-wrap justify-center gap-4 mt-2">
          <input
            type="date"
            className="bg-[#1F1F1F] border border-gray-600 rounded p-1 text-white"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span className="text-white">até</span>
          <input
            type="date"
            className="bg-[#1F1F1F] border border-gray-600 rounded p-1 text-white"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Button variant="outline" onClick={handleExportCSV}>Exportar CSV</Button>
          <Button variant="outline" onClick={handleExportPNG}>Exportar PNG</Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-white text-lg text-center">Carregando dados...</p>
        ) : data.length === 0 ? (
          <p className="text-red-500 text-lg text-center">Sem dados disponíveis</p>
        ) : (
          <div ref={chartRef}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <XAxis dataKey="name" stroke="#fff" tick={{ fontSize: 12 }} />
                <YAxis stroke="#fff" tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === "Tempo de Uso (s)") {
                      return formatTimeUsage(value);
                    }
                    return value.toString();
                  }}
                  labelStyle={{ color: "#fff" }}
                  contentStyle={{ backgroundColor: "#222", borderRadius: "8px", border: "none" }}
                  cursor={{ fill: "#333" }}
                />
                <Legend wrapperStyle={{ color: "#fff" }} />
                {metrics.includes("correct") && (
                  <Bar dataKey="correct" fill={metricsColors.correct} name="Questões Certas" animationDuration={600} />
                )}
                {metrics.includes("wrong") && (
                  <Bar dataKey="wrong" fill={metricsColors.wrong} name="Questões Erradas" animationDuration={600} />
                )}
                {metrics.includes("usage") && (
                  <Bar dataKey="usage" fill={metricsColors.usage} name="Tempo de Uso" animationDuration={600} />
                )}
                {metrics.includes("sessions") && (
                  <Bar dataKey="sessions" fill={metricsColors.sessions} name="Sessões" animationDuration={600} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
