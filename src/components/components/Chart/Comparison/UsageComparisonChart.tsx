import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { Card } from "@/components/ui/card";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { motion } from "framer-motion";
import { api } from "@/services/api/api";
import type { ChartFilterState } from "@/@types/ChartsType";

export function UsageComparisonChart({ filter }: { filter: ChartFilterState }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.post("/dashboard/usage-comparison", filter).then((res) => setData(res.data));
  }, [filter]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
      <Card className="p-4 bg-[#1f1f1f] border border-white/10 rounded-xl shadow-lg">
        <Typograph
          text="Comparação de Tempo de uso Diário"
          variant="text6"
          weight="semibold"
          fontFamily="montserrat"
          colorText="text-white"
        />
        <div className="overflow-x-auto mt-4">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
              <XAxis dataKey="dia" stroke="#ffffffcc" />
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
                .filter((key) => key !== "dia")
                .map((user, index) => (
                  <Line
                    key={user}
                    type="monotone"
                    dataKey={user}
                    stroke={["#6366f1", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6"][index % 5]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
}
