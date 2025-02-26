import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";


const barData = [
  { name: "Produto A", value: 100 },
  { name: "Produto B", value: 75 },
  { name: "Produto C", value: 90 },
  { name: "Produto D", value: 20 },
];


const pieData = [
  { name: "Outras", value: 40, color: "#facc15" },
  { name: "Produto A", value: 35, color: "#a855f7" },
  { name: "Produto B", value: 25, color: "#6366f1" },
];


const progressValue = 75;

function Chart() {
  return (
    <div className="bg-[#141414] text-white min-h-screen p-6 flex flex-col gap-6 items-center lg:p-12">
  
      <h1 className="text-center pb-8 text-xl font-bold tracking-wide lg:text-4xl">
        Graficos
      </h1>

      <div className="w-full flex flex-col lg:px-32 content-start lg:grid lg:grid-cols-2 lg:gap-6">
        {/* Gráfico de Barras */}
        <Card className="bg-[#181818] p-6 border-transparent w-full rounded-xl flex flex-col justify-center">
          <CardContent>
            <h2 className="text-lg font-bold mb-4 text-center lg:text-2xl">
              Gráfico de Dados
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <XAxis dataKey="name" stroke="#fff" tick={{ fontSize: 14 }} />
                <YAxis stroke="#fff" tick={{ fontSize: 14 }} />
                <Tooltip
                  wrapperStyle={{ backgroundColor: "#222", color: "#fff" }}
                />
                <Legend wrapperStyle={{ color: "#fff" }} />
                <Bar
                  dataKey="value"
                  fill="#A259FF"
                  barSize={50}
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        
        <Card className="bg-[#181818] p-6 border-transparent w-full rounded-xl flex flex-col justify-center">
          <CardContent>
            <h2 className="text-lg font-bold mb-4 text-center lg:text-2xl">
              Gráfico de Dúvidas
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ color: "#fff" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        
        <Card className="bg-[#181818] border-transparent p-6 w-full rounded-xl flex flex-col justify-center mt-6 lg:mt-12">
          <CardContent className="flex flex-col items-center">
            <h2 className="text-lg font-bold mb-4 text-center lg:text-2xl">
              Progresso do Curso
            </h2>
            <div className="relative w-40 h-40 lg:w-64 lg:h-64 flex items-center justify-center">
              <CircularProgressbar
                value={progressValue}
                styles={buildStyles({
                  textColor: "#fff",
                  pathColor: "#A259FF",
                  trailColor: "#444",
                  textSize: "18px",
                  pathTransitionDuration: 0.8,
                  strokeLinecap: "round",
                })}
              />
              <div className="absolute text-center flex flex-col items-center">
                <p className="text-sm lg:text-lg text-gray-300">
                  Progresso Atual
                </p>
                <p className="text-3xl lg:text-4xl font-bold text-white">
                  {progressValue}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        
      </div>
    </div>
  );
}

export default Chart;
