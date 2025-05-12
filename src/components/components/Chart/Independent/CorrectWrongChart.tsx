import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { motion } from "framer-motion";
import { api } from "@/services/api/api";
import type { ChartFilterState } from "@/@types/ChartsType";

const COLORS = ["#10b981", "#ef4444"];

export function CorrectWrongChart({ filter }: { filter: ChartFilterState }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.post("/dashboard/correct-vs-wrong", filter).then(res => setData(res.data));
  }, [filter]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
      <Card className="p-4">
        <Typograph
          text="Acertos x Erros"
          variant="text6"
          weight="semibold"
          fontFamily="montserrat"
          colorText="text-white"
        />
        <div className="flex justify-center">
          <PieChart width={280} height={240}>
            <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
      </Card>
    </motion.div>
  );
}
