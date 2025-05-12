import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
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

export function CategoryParticipationChart({ filter }: { filter: ChartFilterState }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.post("/dashboard/category-participation", filter).then(res => setData(res.data));
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
              <Bar dataKey="Variáveis" fill="#6366f1" />
              <Bar dataKey="Tipos de Dados" fill="#8b5cf6" />
              <Bar dataKey="Laços" fill="#ec4899" />
              <Bar dataKey="Verificações" fill="#f59e0b" />
              <Bar dataKey="Funções" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
}
