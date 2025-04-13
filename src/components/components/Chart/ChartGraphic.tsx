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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { api } from "@/services/api";
import { toPng } from "html-to-image";
import { downloadCSV } from "@/lib/downloadCSV";

interface ChartGraphicsProps {
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

const colors = {
  correct: "#4ade80",
  wrong: "#f87171",
  usage: "#60a5fa",
};

export function ChartGraphics({ type, id }: ChartGraphicsProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
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
    const rows = data.map((item) => ({
      Nome: item.name,
      Corretas: item.correct,
      Incorretas: item.wrong,
      "Tempo de Uso (s)": item.usage,
    }));

    downloadCSV(
      `interacoes_${type}_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`,
      rows
    );
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

  const handleClickBar = (entry: ChartData) => {
    console.log("Clique em:", entry.name);
  };

  const filteredData = data.filter(() => {
    // Placeholder: lógica para filtrar por datas (a ser aprimorada com dados reais)
    if (!startDate || !endDate) return true;
    // Substitua por uma propriedade real, se disponível.
    const itemDate = new Date();
    return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
  });

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
        ) : filteredData.length === 0 ? (
          <p className="text-red-500 text-lg text-center">Sem dados disponíveis</p>
        ) : (
          <div ref={chartRef}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredData}>
                <XAxis dataKey="name" stroke="#fff" tick={{ fontSize: 12 }} />
                <YAxis stroke="#fff" tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => value.toString()}
                  labelStyle={{ color: "#fff" }}
                  contentStyle={{
                    backgroundColor: "#222",
                    borderRadius: "8px",
                    border: "none",
                  }}
                  cursor={{ fill: "#333" }}
                />
                <Legend wrapperStyle={{ color: "#fff" }} />
                <Bar
                  dataKey="correct"
                  fill={colors.correct}
                  name="Corretas"
                  animationDuration={600}
                  onClick={(entry) => handleClickBar(entry as ChartData)}
                />
                <Bar
                  dataKey="wrong"
                  fill={colors.wrong}
                  name="Incorretas"
                  animationDuration={600}
                  onClick={(entry) => handleClickBar(entry as ChartData)}
                />
                <Bar
                  dataKey="usage"
                  fill={colors.usage}
                  name="Tempo de Uso (s)"
                  animationDuration={600}
                  onClick={(entry) => handleClickBar(entry as ChartData)}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
