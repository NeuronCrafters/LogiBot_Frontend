import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { Card } from "@/components/ui/card";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { motion } from "framer-motion";
import { api } from "@/services/api/api";
import type { ChartFilterState } from "@/@types/ChartsType";

const barColors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

export function CategoryChart({ filter }: { filter: ChartFilterState }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.post("/dashboard/category-performance", filter).then(res => setData(res.data));
  }, [filter]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
      <Card className="p-4">
        <Typograph
          text="Desempenho por Categoria"
          variant="text6"
          weight="semibold"
          fontFamily="montserrat"
          colorText="text-white"
        />
        <div className="overflow-x-auto">
          <BarChart width={600} height={300} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value">
              {data.map((_, i) => <Cell key={i} fill={barColors[i % barColors.length]} />)}
            </Bar>
          </BarChart>
        </div>
      </Card>
    </motion.div>
  );
}
