// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from "recharts";
// import { Card } from "@/components/ui/card";
// import { Typograph } from "@/components/components/Typograph/Typograph";
// import { motion } from "framer-motion";
// import { useChartData } from "@/hooks/use-ChartData";
// import type { ChartFilterState, CategoryComparisonData } from "@/@types/ChartsType";

// export function CategoryParticipationChart({ filter }: { filter: ChartFilterState }) {
//   const hasEnoughIds = filter.ids.length > 1;

//   const {
//     data,
//     isLoading,
//     isError,
//     error,
//     hasValidIds,
//   } = useChartData<CategoryComparisonData[]>(
//     filter.type,
//     "subjects",
//     "compare",
//     filter.ids,
//     !hasEnoughIds
//   );

//   const processedData = Array.isArray(data) ? data : [];

//   const categories =
//     processedData.length > 0
//       ? Object.keys(processedData[0]).filter((key) => key !== "user")
//       : [];

//   const categoryColors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       transition={{ delay: 0.6 }}
//       className="w-full"
//     >
//       <Card className="p-4 bg-[#1f1f1f] border border-white/10 rounded-xl shadow-lg">
//         <Typograph
//           text="Participação por Categoria"
//           variant="text6"
//           weight="semibold"
//           fontFamily="montserrat"
//           colorText="text-white"
//         />

//         {!hasValidIds ? (
//           <div className="flex items-center justify-center h-64 text-white/70">
//             Selecione mais entidades para visualizar a comparação.
//           </div>
//         ) : isLoading ? (
//           <div className="flex items-center justify-center h-64 text-white/70">
//             Carregando dados de comparação...
//           </div>
//         ) : isError ? (
//           <div className="flex items-center justify-center h-64 text-red-400">
//             {error}
//           </div>
//         ) : processedData.length === 0 ? (
//           <div className="flex items-center justify-center h-64 text-white/70">
//             Nenhum dado de participação encontrado.
//           </div>
//         ) : (
//           <div className="mt-4 overflow-x-auto">
//             <ResponsiveContainer width="100%" height={300}>
//               <BarChart data={processedData}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
//                 <XAxis dataKey="user" stroke="#ffffffcc" />
//                 <YAxis stroke="#ffffffcc" />
//                 <Tooltip
//                   contentStyle={{
//                     backgroundColor: "#1f1f1f",
//                     border: "1px solid #ffffff22",
//                     borderRadius: "8px",
//                   }}
//                   labelStyle={{ color: "#fff" }}
//                   itemStyle={{ color: "#fff" }}
//                 />
//                 <Legend wrapperStyle={{ color: "#ffffff" }} />
//                 {categories.map((category, i) => (
//                   <Bar
//                     key={category}
//                     dataKey={category}
//                     name={category}
//                     fill={categoryColors[i % categoryColors.length]}
//                   />
//                 ))}
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         )}
//       </Card>
//     </motion.div>
//   );
// }
