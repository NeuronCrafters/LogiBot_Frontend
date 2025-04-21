import { useEffect, useState, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { api } from "@/services/api/api";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toPng } from "html-to-image";
import { downloadCSV } from "@/lib/downloadCSV";
import { MetricOption } from "./MetricCheckboxSelector";

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
  type: "university" | "course" | "discipline" | "class" | "student";
  ids: string[];
  metric: MetricOption;
  dateRange: {
    from: Date;
    to: Date;
  };
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

  const handleExportCSV = () => {
    const rows = data.map((item) => ({
      Data: item.date,
      "Grupo 1": item.groupA,
      "Grupo 2": item.groupB,
    }));

    downloadCSV(`comparativo_${metric}_linha.csv`, rows);
  };

  const handleExportPNG = () => {
    if (!chartRef.current) return;
    toPng(chartRef.current).then((dataUrl) => {
      const link = document.createElement("a");
      link.download = `comparativo_${metric}_linha.png`;
      link.href = dataUrl;
      link.click();
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Comparativo Temporal</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleExportCSV}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleExportPNG}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={chartRef}>
          {loading ? (
            <p className="text-center text-muted-foreground">Carregando comparativo...</p>
          ) : data.length === 0 ? (
            <p className="text-center text-destructive">Sem dados disponíveis para o período.</p>
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
      </CardContent>
    </Card>
  );
}
