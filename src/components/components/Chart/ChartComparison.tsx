import { useEffect, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { api } from "@/services/api/api";
import { Button } from "@/components/ui/button";
import { toPng } from "html-to-image";
import { downloadCSV } from "@/lib/downloadCSV";
import type { Payload } from "recharts/types/component/DefaultTooltipContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { MetricOption } from "./MetricCheckboxSelector";

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
  variation: string;
}

interface ChartComparisonProps {
  type: "university" | "course" | "discipline" | "class" | "student";
  ids: string[];
  metric: MetricOption;
  dateRange: { from: Date; to: Date };
}

function formatTimeUsage(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  const weeks = (days / 7).toFixed(1);
  const months = (days / 30.44).toFixed(1);
  const years = (days / 365).toFixed(1);
  return `${seconds} seg / ${mins} min / ${hrs} hrs / ${days} dias / ${weeks} sem / ${months} mes / ${years} anos`;
}

function ChartComparison({ type, ids, metric, dateRange }: ChartComparisonProps) {
  const [data, setData] = useState<ComparisonData[]>([]);
  const [labelA, setLabelA] = useState("Grupo A");
  const [labelB, setLabelB] = useState("Grupo B");
  const chartRef = useRef<HTMLDivElement>(null);

  const title =
    metric === "correct"
      ? "Respostas Corretas"
      : metric === "wrong"
        ? "Respostas Incorretas"
        : metric === "usage"
          ? "Tempo de Uso"
          : "Sessões";

  useEffect(() => {
    if (ids.length !== 2) return;

    async function fetchData() {
      try {
        const [resA, resB] = await Promise.all([
          api.get(`/logs/${type}/${ids[0]}`, { withCredentials: true }),
          api.get(`/logs/${type}/${ids[1]}`, { withCredentials: true }),
        ]);

        const logsA: UserAnalysisLog[] = resA.data.logs || resA.data;
        const logsB: UserAnalysisLog[] = resB.data.logs || resB.data;

        const getMetricValue = (log?: UserAnalysisLog): number => {
          if (!log) return 0;
          return metric === "correct"
            ? log.totalCorrectAnswers
            : metric === "wrong"
              ? log.totalWrongAnswers
              : metric === "usage"
                ? Math.floor(log.totalUsageTime)
                : 0;
        };

        const mergedData: ComparisonData[] = logsA.map((log, i) => {
          const valueA = getMetricValue(log);
          const valueB = getMetricValue(logsB[i]);
          const variation =
            valueA === 0 && valueB !== 0
              ? "+100%"
              : valueA === 0 && valueB === 0
                ? "0%"
                : `${(((valueB - valueA) / valueA) * 100).toFixed(1)}%`;

          return {
            name: log.name,
            groupA: valueA,
            groupB: valueB,
            variation,
          };
        });

        setLabelA(`Grupo 1 (${logsA.length} registros)`);
        setLabelB(`Grupo 2 (${logsB.length} registros)`);
        setData(mergedData);
      } catch (error) {
        console.error("Erro ao buscar dados comparativos:", error);
      }
    }

    fetchData();
  }, [type, ids, metric]);

  const handleExportCSV = () => {
    const rows = data.map((item) => ({
      Nome: item.name,
      [labelA]: item.groupA,
      [labelB]: item.groupB,
      Variação: item.variation,
    }));

    downloadCSV(`comparativo_${metric}.csv`, rows);
  };

  const handleExportPNG = () => {
    if (!chartRef.current) return;
    toPng(chartRef.current).then((dataUrl) => {
      const link = document.createElement("a");
      link.download = `comparativo_${metric}.png`;
      link.href = dataUrl;
      link.click();
    });
  };

  if (ids.length !== 2) {
    return <p className="text-red-400">Selecione dois grupos para comparar.</p>;
  }

  if (data.length === 0) {
    return <p className="text-white text-center">Carregando comparativo...</p>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Comparativo de {title}</CardTitle>
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
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <XAxis dataKey="name" stroke="#fff" tick={{ fontSize: 12 }} />
              <YAxis stroke="#fff" tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(
                  value: number,
                  name: string,
                  payload: Payload<number, string>
                ) => {
                  const index = data.findIndex((d) => d.name === payload.payload.name);
                  const variation = data[index]?.variation ?? "0%";
                  return metric === "usage"
                    ? formatTimeUsage(value)
                    : `${value} (${variation})`;
                }}
                contentStyle={{ backgroundColor: "#2a2a2a", borderRadius: "8px" }}
                labelStyle={{ color: "#fff" }}
                itemStyle={{ color: "#fff" }}
              />
              <Legend wrapperStyle={{ color: "#fff" }} />
              <Bar dataKey="groupA" fill="#4ade80" name={labelA} />
              <Bar dataKey="groupB" fill="#60a5fa" name={labelB} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export { ChartComparison };
