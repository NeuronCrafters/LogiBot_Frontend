import { useEffect, useRef, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { api } from "@/services/api/api";
import { toPng } from "html-to-image";
import { downloadCSV } from "@/lib/downloadCSV";
import { MetricOption } from "./MetricCheckboxSelector";
import { cn } from "@/lib/utils";

const metricsColors: Record<string, string> = {
  correct: "#4ade80",
  wrong: "#f87171",
  usage: "#60a5fa",
  sessions: "#fbbf24",
};

// Adicionando uma paleta de cores mais ampla para os usuários
const userColors = [
  "#4ade80", "#f87171", "#60a5fa", "#fbbf24", // cores originais
  "#a78bfa", "#fb7185", "#2dd4bf", "#f472b6", // novas cores
  "#818cf8", "#f97316", "#22d3ee", "#e879f9", // mais cores
  "#34d399", "#f43f5e", "#38bdf8", "#f59e0b", // ainda mais cores
];

type ChartType = "bar" | "line" | "pie";

export interface ChartGraphicsProps {
  type: "university" | "course" | "discipline" | "class" | "student";
  id: string;
  metrics: MetricOption[];
}

interface UserAnalysisLog {
  name: string;
  totalCorrectAnswers: number;
  totalWrongAnswers: number;
  totalUsageTime: number;
  sessions?: Array<{ id: string; startTime: string; endTime: string }>;
}

interface ChartData {
  name: string;
  correct: number;
  wrong: number;
  usage: number;
  sessions: number;
}

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
  const [chartType, setChartType] = useState<ChartType>("bar");
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/logs/${type}/${id}`, {
          withCredentials: true,
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
  }, [type, id]);

  const handleExportCSV = () => {
    const rows = data.map((item) => {
      const row: Record<string, string | number> = { Nome: item.name };
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

  const handleExportJSON = () => {
    const jsonData = {
      type,
      id,
      metrics,
      data: data.map(item => ({
        name: item.name,
        correct: item.correct,
        wrong: item.wrong,
        usage: item.usage,
        sessions: item.sessions
      }))
    };

    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `interacoes_${type}_${format(new Date(), "yyyyMMdd_HHmmss")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderPieCharts = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
        {metrics.map((metric) => (
          <div key={metric} className="flex flex-col items-center h-full">
            <h3 className="text-white mb-2 text-sm">
              {metric === "correct" && "Questões Certas"}
              {metric === "wrong" && "Questões Erradas"}
              {metric === "usage" && "Tempo de Uso"}
              {metric === "sessions" && "Sessões"}
            </h3>
            <div className="w-full h-[calc(100%-2rem)]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius="80%"
                    fill="#8884d8"
                    dataKey={metric}
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={userColors[index % userColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => {
                      if (metric === "usage") {
                        return formatTimeUsage(value);
                      }
                      return value.toString();
                    }}
                    labelStyle={{ color: "#fff" }}
                    contentStyle={{ backgroundColor: "#222", borderRadius: "8px", border: "none" }}
                  />
                  <Legend
                    wrapperStyle={{ color: "#fff" }}
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderLineChart = () => {
    // Transforma os dados para o formato necessário
    const lineData = metrics.map(metric => {
      const metricData = data.map(user => ({
        name: user.name,
        value: user[metric],
        label: metric === "correct" ? "Questões Certas" :
          metric === "wrong" ? "Questões Erradas" :
            metric === "usage" ? "Tempo de Uso" :
              "Sessões"
      }));

      return {
        metric,
        data: metricData
      };
    });

    return (
      <LineChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#fff"
          tick={{ fontSize: 12 }}
        />
        <YAxis
          stroke="#fff"
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          formatter={(value: number, name: string) => {
            if (name.includes("usage")) {
              return formatTimeUsage(value);
            }
            return value.toString();
          }}
          labelStyle={{ color: "#fff" }}
          contentStyle={{ backgroundColor: "#222", borderRadius: "8px", border: "none" }}
          cursor={{ fill: "#333" }}
        />
        <Legend wrapperStyle={{ color: "#fff" }} />
        {lineData.map((metricData, index) => (
          <Line
            key={metricData.metric}
            type="monotone"
            dataKey="value"
            name={metricData.metric === "correct" ? "Questões Certas" :
              metricData.metric === "wrong" ? "Questões Erradas" :
                metricData.metric === "usage" ? "Tempo de Uso" :
                  "Sessões"}
            stroke={metricsColors[metricData.metric]}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            data={metricData.data}
            animationDuration={600}
          />
        ))}
      </LineChart>
    );
  };

  const renderChart = () => {
    switch (chartType) {
      case "bar":
        return (
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
        );
      case "line":
        return renderLineChart();
      case "pie":
        return renderPieCharts();
    }
  };

  return (
    <Card className="bg-[#1F1F1F] text-white">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold mb-4">Gráfico de Interações</CardTitle>
        <div className="flex flex-wrap justify-center gap-4 mt-2">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className={cn(
                "px-3 py-1 rounded transition-all duration-200",
                "hover:bg-gray-800/50",
                chartType === "bar" ? "bg-gray-800/30 text-gray-100" : "text-gray-400"
              )}
              onClick={() => setChartType("bar")}
            >
              Barras
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "px-3 py-1 rounded transition-all duration-200",
                "hover:bg-gray-800/50",
                chartType === "line" ? "bg-gray-800/30 text-gray-100" : "text-gray-400"
              )}
              onClick={() => setChartType("line")}
            >
              Linhas
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "px-3 py-1 rounded transition-all duration-200",
                "hover:bg-gray-800/50",
                chartType === "pie" ? "bg-gray-800/30 text-gray-100" : "text-gray-400"
              )}
              onClick={() => setChartType("pie")}
            >
              Pizza
            </Button>
          </div>
          <Button variant="outline" onClick={handleExportCSV}>Exportar CSV</Button>
          <Button variant="outline" onClick={handleExportPNG}>Exportar PNG</Button>
          <Button variant="outline" onClick={handleExportJSON}>Exportar JSON</Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-auto max-h-[calc(100vh-200px)]">
        {loading ? (
          <p className="text-white text-lg text-center">Carregando dados...</p>
        ) : data.length === 0 ? (
          <p className="text-red-500 text-lg text-center">Sem dados disponíveis</p>
        ) : (
          <div ref={chartRef} className="min-h-[300px]">
            {chartType === "pie" ? (
              <ResponsiveContainer width="100%" height={Math.max(300, metrics.length * 200)}>
                {renderChart()}
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                {renderChart()}
              </ResponsiveContainer>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
