import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { motion } from "framer-motion";
import { logApi } from "@/services/apiClient";
import type { ChartFilterState } from "@/@types/ChartsType";

interface DataPoint {
  user: string;
  [key: string]: string | number;
}

export function CategoryParticipationChart({ filter }: { filter: ChartFilterState }) {
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    if (filter.mode !== "compare" || !filter.ids.length) return;

    logApi
      .get<DataPoint[]>(filter.type, "subjects", "compare", filter.ids)
      .then(setData)
      .catch(console.error);
  }, [filter]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
      <Card className="p-4 bg-[#1f1f1f] border border-white/10 rounded-xl shadow-lg">
        <Typograph
          text="Participação por Categoria"
          variant="text6"
          weight="semibold"
          fontFamily="montserrat"
          colorText="text-white"
        />
        <div className="overflow-x-auto mt-4">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
              <XAxis dataKey="user" stroke="#ffffffcc" />
              <YAxis stroke="#ffffffcc" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f1f1f",
                  border: "1px solid #ffffff22",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#ffffff" }}
                itemStyle={{ color: "#ffffff" }}
              />
              <Legend wrapperStyle={{ color: "#ffffff" }} />
              {Object.keys(data[0] || {})
                .filter((key) => key !== "user")
                .map((key, i) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"][i % 5]}
                  />
                ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
}
