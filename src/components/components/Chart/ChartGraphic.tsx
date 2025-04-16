import { useEffect, useRef, useState } from "react";
import { api } from "@/services/api/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toPng } from "html-to-image";
import { downloadCSV } from "@/lib/downloadCSV";
import { format } from "date-fns";

// Definição para os dados do gráfico
export interface ChartData {
  name: string;
  correct: number;
  wrong: number;
  usage: number;
  sessions: number;
}

interface ChartGraphicProps {
  type: "course" | "class" | "discipline" | "student";
  id: string;
  metrics: ("correct" | "wrong" | "usage" | "sessions")[];
}

const metricsColors: Record<string, string> = {
  correct: "#4ade80",
  wrong: "#f87171",
  usage: "#60a5fa",
  sessions: "#fbbf24",
};

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

function ChartGraphic({ type, id, metrics }: ChartGraphicProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const response = await api.get(`/logs/${type}/${id}`, {
          withCredentials: true,
          params: { startDate, endDate },
        });
        const logsArray: ChartData[] = response.data.logs || response.data;
        setData(logsArray);
      } catch (error) {
        console.error("Erro ao buscar dados de logs:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [type, id, startDate, endDate]);

  const handleExportCSV = () => {
    const rows = data.map((item) => ({
      Nome: item.name,
      "Questões Certas": item.correct,
      "Questões Erradas": item.wrong,
      "Tempo de Uso (s)": item.usage,
      Sessões: item.sessions,
    }));
    downloadCSV(`grafico_${type}_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`, rows);
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
      .catch((err) => console.error("Erro ao exportar imagem:", err));
  };

  return (
    <Card className="bg-[#1F1F1F] text-white">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold mb-4">
          Gráfico de Interações
        </CardTitle>
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
          <Button variant="outline" onClick={handleExportCSV}>
            Exportar CSV
          </Button>
          <Button variant="outline" onClick={handleExportPNG}>
            Exportar PNG
          </Button>
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
                  contentStyle={{
                    backgroundColor: "#222",
                    borderRadius: "8px",
                    border: "none",
                  }}
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

export { ChartGraphic };
