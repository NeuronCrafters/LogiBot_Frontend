import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Card } from "@/components/ui/card";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { motion } from "framer-motion";
import { api } from "@/services/api/api";
import type { ChartFilterState } from "@/@types/ChartsType";

export function UsageComparisonChart({ filter }: { filter: ChartFilterState }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.post("/dashboard/usage-comparison", filter).then(res => setData(res.data));
  }, [filter]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
      <Card className="p-4">
        <Typograph
          text="Comparação de Tempo de Uso"
          variant="text6"
          weight="semibold"
          fontFamily="montserrat"
          colorText="text-white"
        />
        <div className="overflow-x-auto">
          <LineChart width={600} height={250} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dia" />
            <YAxis />
            <Tooltip />
            <Legend />
            {Object.keys(data[0] || {}).filter(key => key !== "dia").map((user, index) => (
              <Line key={user} type="monotone" dataKey={user} stroke={["#6366f1", "#10b981", "#ef4444"][index % 3]} />
            ))}
          </LineChart>
        </div>
      </Card>
    </motion.div>
  );
}
