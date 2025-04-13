// import { Card, CardContent } from "@/components/ui/card";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
//   Legend,
// } from "recharts";
// import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
// import "react-circular-progressbar/dist/styles.css";
// import { useEffect, useState } from "react";
// import { api } from "@/services/api";


// // Interface para os dados do gráfico de barras
// interface BarChartData {
//   name: string;
//   value: number;
// }

// // Interface para os dados do gráfico de pizza
// interface PieChartData {
//   name: string;
//   value: number;
//   color: string;
// }

// // Interface para os dados do progresso
// interface ProgressData {
//   value: number;
// }

// // Interface para os dados da instituição
// interface Institution {
//   id: string;
//   name: string;
//   shortName?: string;
//   email?: string;
//   phone?: string;
//   address?: string;
//   site?: string;
//   students: number;
//   courses: number;
//   rating: number;
//   createdAt?: string;
//   updatedAt?: string;
// }

// // Cores para o gráfico de pizza
// const colors = ["#a855f7", "#6366f1", "#facc15", "#14b8a6", "#f43f5e", "#8b5cf6", "#f97316", "#06b6d4"];

// // Função para buscar dados de instituições e preparar para o gráfico de barras
// const getBarChartData = async (): Promise<BarChartData[]> => {
//   try {
//     const response = await api.get("/public/institutions");
//     const institutions: Institution[] = response.data;

//     if (!institutions || institutions.length === 0) {
//       throw new Error("Nenhum dado de instituição foi encontrado");
//     }

//     // Transformando os dados de instituições para o formato do gráfico de barras
//     // Usamos o número de estudantes como valor para o gráfico
//     return institutions.map(institution => ({
//       name: institution.shortName || institution.name,
//       value: institution.students
//     }));
//   } catch (error) {
//     console.error("Erro ao buscar dados do gráfico de barras:", error);
//     // Não retorna dados mockados, apenas um array vazio
//     return [];
//   }
// };

// // Função para buscar dados de instituições e preparar para o gráfico de pizza
// const getPieChartData = async (): Promise<PieChartData[]> => {
//   try {
//     const response = await api.get("/public/institutions");
//     const institutions: Institution[] = response.data;

//     if (!institutions || institutions.length === 0) {
//       throw new Error("Nenhum dado de instituição foi encontrado");
//     }

//     // Transformando os dados de instituições para o formato do gráfico de pizza
//     // Usamos o número de cursos como valor para o gráfico
//     return institutions.map((institution, index) => ({
//       name: institution.shortName || institution.name,
//       value: institution.courses,
//       color: colors[index % colors.length] // Atribuir cores de forma cíclica
//     }));
//   } catch (error) {
//     console.error("Erro ao buscar dados do gráfico de pizza:", error);
//     // Não retorna dados mockados, apenas um array vazio
//     return [];
//   }
// };

// // Função para calcular o progresso com base na média de avaliações das instituições
// const getProgressData = async (): Promise<ProgressData | null> => {
//   try {
//     const response = await api.get("/public/institutions");
//     const institutions: Institution[] = response.data;

//     if (!institutions || institutions.length === 0) {
//       throw new Error("Nenhum dado de instituição foi encontrado");
//     }

//     // Calcular a média das avaliações das instituições
//     const totalRating = institutions.reduce((acc, inst) => acc + inst.rating, 0);
//     const averageRating = institutions.length > 0 ? (totalRating / institutions.length) : 0;

//     // Convertendo a média (que provavelmente é de 0-10 ou 0-5) para porcentagem (0-100)
//     // Assumindo que a nota máxima é 5
//     const progressPercentage = Math.round((averageRating / 5) * 100);

//     return { value: progressPercentage };
//   } catch (error) {
//     console.error("Erro ao buscar dados de progresso:", error);
//     // Não retorna dados mockados, apenas null
//     return null;
//   }
// };

// function Chart() {
//   const [barData, setBarData] = useState<BarChartData[]>([]);
//   const [pieData, setPieData] = useState<PieChartData[]>([]);
//   const [progressValue, setProgressValue] = useState<number | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         const [barDataResponse, pieDataResponse, progressDataResponse] = await Promise.all([
//           getBarChartData(),
//           getPieChartData(),
//           getProgressData()
//         ]);

//         setBarData(barDataResponse);
//         setPieData(pieDataResponse);
//         setProgressValue(progressDataResponse?.value || null);

//         if (
//           (!barDataResponse || barDataResponse.length === 0) &&
//           (!pieDataResponse || pieDataResponse.length === 0) &&
//           !progressDataResponse
//         ) {
//           setError("Não foi possível obter dados da API. Verifique se a API está ativa em: http://localhost:3000/public/institutions");
//         } else {
//           setError(null);
//         }
//       } catch (err) {
//         console.error("Erro ao buscar dados dos gráficos:", err);
//         setError("Erro ao carregar dados dos gráficos. Verifique se a API está disponível em: http://localhost:3000/public/institutions");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   if (loading) {
//     return (
//       <div className="bg-[#141414] text-white min-h-screen flex items-center justify-center">
//         <p className="text-2xl">Carregando dados...</p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="bg-[#141414] text-white min-h-screen flex flex-col items-center justify-center p-6">
//         <p className="text-2xl text-red-500 text-center mb-4">{error}</p>
//         <p className="text-lg text-center">Apenas dados reais são exibidos neste dashboard. Sem dados fictícios.</p>
//       </div>
//     );
//   }

//   interface CustomTooltipProps {
//     active?: boolean;
//     payload?: { name: string; value: number }[];
//     label?: string;
//   }

//   const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
//     if (active && payload && payload.length) {
//       return (
//         <div className="bg-[#222] p-3 border border-gray-700 rounded">
//           <p className="font-bold">{label}</p>
//           <p className="text-[#A259FF]">{`${payload[0].name}: ${payload[0].value.toLocaleString()}`}</p>
//         </div>
//       );
//     }

//     return null;
//   };

//   const NoDataMessage = () => (
//     <div className="flex items-center justify-center h-64">
//       <p className="text-red-400 text-lg">Sem dados disponíveis</p>
//     </div>
//   );

//   return (
//     <div className="bg-[#141414] text-white min-h-screen p-6 flex flex-col gap-6 items-center lg:p-12">

//       <h1 className="text-center pb-8 text-xl font-bold tracking-wide lg:text-4xl">
//         Dashboard Institucional
//       </h1>

//       <div className="w-full flex flex-col lg:px-32 content-start lg:grid lg:grid-cols-2 lg:gap-6">
//         {/* Gráfico de Barras */}
//         <Card className="bg-[#181818] p-6 border-transparent w-full rounded-xl flex flex-col justify-center">
//           <CardContent>
//             <h2 className="text-lg font-bold mb-4 text-center lg:text-2xl">
//               Número de Estudantes por Instituição
//             </h2>
//             {barData.length > 0 ? (
//               <ResponsiveContainer width="100%" height={280}>
//                 <BarChart data={barData}>
//                   <XAxis dataKey="name" stroke="#fff" tick={{ fontSize: 14 }} />
//                   <YAxis stroke="#fff" tick={{ fontSize: 14 }} />
//                   <Tooltip content={<CustomTooltip />} />
//                   <Legend wrapperStyle={{ color: "#fff" }} />
//                   <Bar
//                     dataKey="value"
//                     name="Estudantes"
//                     fill="#A259FF"
//                     barSize={50}
//                     radius={[5, 5, 0, 0]}
//                   />
//                 </BarChart>
//               </ResponsiveContainer>
//             ) : (
//               <NoDataMessage />
//             )}
//           </CardContent>
//         </Card>


//         <Card className="bg-[#181818] p-6 border-transparent w-full rounded-xl flex flex-col justify-center">
//           <CardContent>
//             <h2 className="text-lg font-bold mb-4 text-center lg:text-2xl">
//               Cursos Oferecidos por Instituição
//             </h2>
//             {pieData.length > 0 ? (
//               <ResponsiveContainer width="100%" height={280}>
//                 <PieChart>
//                   <Pie
//                     data={pieData}
//                     dataKey="value"
//                     nameKey="name"
//                     cx="50%"
//                     cy="50%"
//                     outerRadius={90}
//                     label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
//                   >
//                     {pieData.map((entry, index) => (
//                       <Cell key={`cell-${index}`} fill={entry.color} />
//                     ))}
//                   </Pie>
//                   <Legend
//                     verticalAlign="bottom"
//                     wrapperStyle={{ color: "#fff" }}
//                   />
//                 </PieChart>
//               </ResponsiveContainer>
//             ) : (
//               <NoDataMessage />
//             )}
//           </CardContent>
//         </Card>


//         <Card className="bg-[#181818] border-transparent p-6 w-full rounded-xl flex flex-col justify-center mt-6 lg:mt-12">
//           <CardContent className="flex flex-col items-center">
//             <h2 className="text-lg font-bold mb-4 text-center lg:text-2xl">
//               Média de Avaliação das Instituições
//             </h2>
//             {progressValue !== null ? (
//               <div className="relative w-40 h-40 lg:w-64 lg:h-64 flex items-center justify-center">
//                 <CircularProgressbar
//                   value={progressValue}
//                   styles={buildStyles({
//                     textColor: "#fff",
//                     pathColor: "#A259FF",
//                     trailColor: "#444",
//                     textSize: "18px",
//                     pathTransitionDuration: 0.8,
//                     strokeLinecap: "round",
//                   })}
//                 />
//                 <div className="absolute text-center flex flex-col items-center">
//                   <p className="text-sm lg:text-lg text-gray-300">
//                     Avaliação Média
//                   </p>
//                   <p className="text-3xl lg:text-4xl font-bold text-white">
//                     {progressValue}%
//                   </p>
//                 </div>
//               </div>
//             ) : (
//               <NoDataMessage />
//             )}
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }

// export { Chart };