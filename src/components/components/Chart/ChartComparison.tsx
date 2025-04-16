// ChartComparison.tsx
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
  type: "course" | "class" | "discipline";
  ids: string[];
  metric: "correct" | "wrong" | "usage";
}

// Helper para converter tempo (em segundos) para um formato legível
function formatTimeUsage(seconds: number): string {
  const totalSeconds = seconds;
  const mins = Math.floor(totalSeconds / 60);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  const weeks = (days / 7).toFixed(1);
  const months = (days / 30.44).toFixed(1);
  const years = (days / 365).toFixed(1);
  return `${totalSeconds} seg / ${mins} min / ${hrs} hrs / ${days} dias / ${weeks} sem / ${months} mes / ${years} anos`;
}

function ChartComparison({ type, ids, metric }: ChartComparisonProps) {
  const [data, setData] = useState<ComparisonData[]>([]);
  const [labelA, setLabelA] = useState("Grupo A");
  const [labelB, setLabelB] = useState("Grupo B");
  const chartRef = useRef<HTMLDivElement>(null);

  const title =
    metric === "correct"
      ? "Respostas Corretas"
      : metric === "wrong"
        ? "Respostas Incorretas"
        : "Tempo de Uso";

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
          switch (metric) {
            case "correct":
              return log.totalCorrectAnswers;
            case "wrong":
              return log.totalWrongAnswers;
            case "usage":
              return Math.floor(log.totalUsageTime);
          }
        };

        const mergedData: ComparisonData[] = logsA.map((log, i) => {
          const valueA = getMetricValue(log);
          const valueB = getMetricValue(logsB[i]);
          const variation = valueA === 0 ? "0%" : `${(((valueB - valueA) / valueA) * 100).toFixed(1)}%`;

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
    <div className="w-full max-w-5xl bg-[#1F1F1F] rounded-xl p-6 shadow-lg">
      <h2 className="text-white text-2xl font-bold mb-4 text-center">
        Comparativo de {title}
      </h2>

      <div className="flex flex-wrap justify-center gap-4 mb-4">
        <Button variant="outline" onClick={handleExportCSV}>
          Exportar CSV
        </Button>
        <Button variant="outline" onClick={handleExportPNG}>
          Exportar PNG
        </Button>
      </div>

      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="name" stroke="#fff" tick={{ fontSize: 12 }} />
            <YAxis stroke="#fff" tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number, name: string, props: any) => {
                if (metric === "usage") {
                  return formatTimeUsage(value);
                }
                // Exibe o valor e a variação (se existir)
                const variation = data[props?.payload?.index]?.variation ?? "0%";
                return `${value} (${variation})`;
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
    </div>
  );
}

export { ChartComparison }