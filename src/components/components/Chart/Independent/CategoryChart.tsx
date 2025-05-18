import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { motion } from "framer-motion";
import { useChartData } from "@/hooks/use-ChartData";
import type { ChartFilterState, CategoryData } from "@/@types/ChartsType";

const barColors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

export function CategoryChart({ filter }: { filter: ChartFilterState }) {
  const isValidFilter = !!filter.ids[0] && filter.ids[0].trim() !== "";

  const {
    data,
    isLoading,
    isError,
    error,
  } = useChartData<any>(
    filter.type,
    "subjects",
    "individual",
    filter.ids[0] || "",
    !isValidFilter
  );

  const processedData: CategoryData[] = !data
    ? []
    : Array.isArray(data)
      ? data
      : Object.entries(data.subjectFrequency || data).map(([category, value]) => ({
        category,
        value: Number(value),
      }));

  return (
    <Card className="p-4 bg-[#141414] border-white/10 w-full mb-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Typograph
            text="Distribuição por Assunto"
            variant="text6"
            weight="semibold"
            fontFamily="montserrat"
            colorText="text-white"
          />
          {import.meta.env.DEV && (
            <span className="text-xs text-white/40">
              Cache TTL de 5 min
            </span>
          )}
        </div>

        {!isValidFilter ? (
          <div className="flex items-center justify-center h-64 text-white/70">
            Selecione uma entidade para visualizar dados
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-64 text-white/70">
            Carregando dados...
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center h-64 text-red-400">
            {error}
          </div>
        ) : processedData.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="h-64 w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={processedData}
                margin={{ top: 5, right: 20, left: 0, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="category"
                  stroke="#999"
                  angle={-45}
                  textAnchor="end"
                  tick={{ fontSize: 12 }}
                />
                <YAxis stroke="#999" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f1f1f",
                    borderColor: "#333",
                  }}
                  labelStyle={{ color: "#fff" }}
                  itemStyle={{ color: "#fff" }}
                />
                <Bar dataKey="value" name="Quantidade">
                  {processedData.map((_, i) => (
                    <Cell
                      key={`cell-${i}`}
                      fill={barColors[i % barColors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        ) : (
          <div className="flex items-center justify-center h-64 text-white/70">
            Nenhum dado disponível para este assunto.
          </div>
        )}
      </div>
    </Card>
  );
}
