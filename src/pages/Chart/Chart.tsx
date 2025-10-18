// import { useState, useEffect, useCallback } from "react";
// import { motion } from "framer-motion";
// import { useAuth } from "@/hooks/use-Auth";
// import { Avatar } from "@/components/components/Avatar/Avatar";
// import { Header } from "@/components/components/Header/Header";
// import { Typograph } from "@/components/components/Typograph/Typograph";
// import { ChartFilter } from "@/components/components/Chart/ChartFilter";
// import { UsageChart } from "@/components/components/Chart/Independent/UsageChart";
// import { CorrectWrongChart } from "@/components/components/Chart/Independent/CorrectWrongChart";
// import { CategoryChart } from "@/components/components/Chart/Independent/CategoryChart";
// import type { ChartFilterState } from "@/@types/ChartsType";
// import { LogEntityType, LogModeType } from "@/services/api/api_routes";
// import { Button } from "@/components/ui/button";

// export function Chart() {
//   console.log("Chart componente renderizado");

//   const { user } = useAuth();
//   const [menuOpen, setMenuOpen] = useState(false);

//   // Estado do filtro inclui hierarchyParams (disciplineId opcional)
//   const [filter, setFilter] = useState<ChartFilterState & {
//     hierarchyParams: { universityId?: string; courseId?: string; classId?: string; disciplineId?: string };
//   }>({ type: "student", ids: [], mode: "individual", hierarchyParams: {} });

//   const [key, setKey] = useState(0);

//   const validIds = filter.ids.filter(id => id && id.trim() !== "");
//   const hasSelection = validIds.length > 0;

//   useEffect(() => {
//     console.log("Chart - Estado do filtro atualizado:", { ...filter, hasSelection });
//     if (hasSelection) setKey(k => k + 1);
//   }, [filter, hasSelection]);

//   const handleFilterChange = useCallback(
//     (
//       type: LogEntityType,
//       ids: string[],
//       mode: LogModeType,
//       hierarchyParams?: { universityId?: string; courseId?: string; classId?: string; disciplineId?: string }
//     ) => {
//       console.log("Chart - handleFilterChange chamado:", { type, ids, mode, hierarchyParams });
//       const valid = ids.filter(id => id && id.trim() !== "");
//       if (
//         filter.type === type &&
//         JSON.stringify(filter.ids) === JSON.stringify(valid) &&
//         filter.mode === mode &&
//         JSON.stringify(filter.hierarchyParams) === JSON.stringify(hierarchyParams || {})
//       ) {
//         console.log("Chart - Filtro não mudou, ignorando");
//         return;
//       }
//       setFilter({ type, ids: valid, mode, hierarchyParams: hierarchyParams || {} });
//     },
//     [filter]
//   );

//   const getEntityLabel = (type: LogEntityType) => {
//     switch (type) {
//       case "student": return "Aluno";
//       case "class": return "Turma";
//       case "course": return "Curso";
//       case "university": return "Universidade";
//       case "discipline": return "Disciplina";
//       default: return "Entidade";
//     }
//   };

//   return (
//     <div className="flex min-h-screen bg-[#141414] flex-col items-center w-full">
//       <div className="absolute bg-[#141414] w-full flex items-center justify-between border-b border-neutral-800 px-8 py-4 z-10">
//         <Typograph text="Dashboard" variant="text2" weight="bold" colorText="text-white" fontFamily="poppins" />
//         {user && (
//           <Button onClick={() => setMenuOpen(true)} className="flex items-center justify-center p-0">
//             <div className="flex items-center justify-center w-10 h-10 rounded-full rainbow-avatar sm:w-12 sm:h-12 md:w-14 md:h-14">
//               <Avatar seed={user._id} backgroundColor="#141414" className="w-full h-full rounded-full" />
//             </div>
//           </Button>
//         )}
//       </div>

//       <Header isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />

//       <div className="flex-1 w-full max-w-6xl px-4 pt-24 pb-20 mx-auto space-y-6">
//         <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-4">
//           <Typograph text="Dashboard de Atividades" variant="text3" weight="semibold" colorText="text-white" fontFamily="montserrat" />
//           <Typograph
//             text="Visualize métricas detalhadas por entidade"
//             variant="text7"
//             weight="regular"
//             fontFamily="montserrat"
//             colorText="text-white/60"
//             className="mt-2"
//           />
//         </motion.div>

//         <ChartFilter onChange={handleFilterChange} />

//         {!hasSelection ? (
//           <div className="flex items-center justify-center h-64 bg-[#1f1f1f] rounded-xl border border-white/10 mt-8">
//             <Typograph
//               text="Selecione uma entidade para visualizar os dados"
//               variant="text7"
//               weight="regular"
//               fontFamily="montserrat"
//               colorText="text-white/70"
//             />
//           </div>
//         ) : (
//           <div key={key} className="transition-opacity duration-300 opacity-100">
//             {filter.mode === "individual" && validIds[0] && (
//               <div className="mt-6 space-y-6">
//                 <UsageChart filter={filter} />
//                 <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0 md:h-[450px]">
//                   <div className="flex flex-col w-full h-full md:w-1/2">
//                     <div className="flex-1 min-h-0">
//                       <CorrectWrongChart filter={filter} />
//                     </div>
//                   </div>
//                   <div className="flex flex-col w-full h-full md:w-1/2">
//                     <div className="flex-1 min-h-0">
//                       <CategoryChart filter={filter} />
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {filter.mode === "comparison" && validIds.length === 2 && (
//               <div className="mt-6 space-y-6">
//                 <div className="p-3 border rounded-lg bg-indigo-500/10 border-indigo-500/30">
//                   <Typograph
//                     text={
//                       <>
//                         <span className="font-medium">Comparando:</span> 2 {getEntityLabel(filter.type)}s
//                       </>
//                     }
//                     variant="text9"
//                     weight="regular"
//                     fontFamily="montserrat"
//                     colorText="text-indigo-300"
//                   />
//                 </div>
//                 <UsageChart filter={filter} />
//                 <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0 md:h-[450px]">
//                   <div className="flex flex-col w-full h-full md:w-1/2">
//                     <div className="flex-1 min-h-0">
//                       <CorrectWrongChart filter={filter} />
//                     </div>
//                   </div>
//                   <div className="flex flex-col w-full h-full md:w-1/2">
//                     <div className="flex-1 min-h-0">
//                       <CategoryChart filter={filter} />
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-Auth";
import { Avatar } from "@/components/components/Avatar/Avatar";
import { Header } from "@/components/components/Header/Header";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { ChartFilter } from "@/components/components/Chart/ChartFilter";
import { Button } from "@/components/ui/button";

// Importações para o filtro de datas
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
// import { DateRangePicker } from "@/components/components/Chart/DateRangePicker"; // Certifique-se que o caminho está correto

// Tipos
import type { ChartFilterState } from "@/@types/ChartsType";
import { LogEntityType, LogModeType } from "@/services/api/api_routes";
import { DashboardFilterParams } from "@/services/api/api_dashboard";

// Gráficos Legados
import { UsageChart } from "@/components/components/Chart/Independent/UsageChart";
import { CorrectWrongChart } from "@/components/components/Chart/Independent/CorrectWrongChart";
import { CategoryChart } from "@/components/components/Chart/Independent/CategoryChart";

// Novos Gráficos do Dashboard
import { TopicPerformanceChart } from "@/components/components/Chart/Dashboard/TopicPerformanceChart";
import { EffortMatrixChart } from "@/components/components/Chart/Dashboard/EffortMatrixChart";
import { ProficiencyRadarChart } from "@/components/components/Chart/Dashboard/ProficiencyRadarChart";
import { LearningJourneyChart } from "@/components/components/Chart/Dashboard/LearningJourneyChart";
import { AccessPatternChart } from "@/components/components/Chart/Dashboard/AccessPatternChart";

export function Chart() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // --- ESTADO CENTRALIZADO ---
  const [dashboardFilters, setDashboardFilters] = useState<DashboardFilterParams>({});
  const [legacyFilter, setLegacyFilter] = useState<ChartFilterState & {
    hierarchyParams: Omit<DashboardFilterParams, 'startDate' | 'endDate'>;
  }>({ type: "student", ids: [], mode: "individual", hierarchyParams: {} });

  const [dateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30), // Padrão: últimos 30 dias
    to: new Date(),
  });

  const [hasSelection, setHasSelection] = useState(false);
  const [key, setKey] = useState(0);

  // Função central que atualiza todos os filtros quando algo muda
  const updateAllFilters = useCallback((
    currentLegacyFilter: typeof legacyFilter,
    currentDateRange: typeof dateRange
  ) => {
    const validIds = currentLegacyFilter.ids.filter(id => id && id.trim() !== "");
    const mainId = validIds[0] || "";

    const newDashboardFilters: DashboardFilterParams = {
      ...currentLegacyFilter.hierarchyParams,
      startDate: currentDateRange?.from ? format(currentDateRange.from, 'yyyy-MM-dd') : undefined,
      endDate: currentDateRange?.to ? format(currentDateRange.to, 'yyyy-MM-dd') : undefined,
    };

    if (currentLegacyFilter.type === 'student') {
      newDashboardFilters.studentId = mainId;
    } else if (mainId) {
      newDashboardFilters[`${currentLegacyFilter.type}Id` as keyof DashboardFilterParams] = mainId;
    }

    setDashboardFilters(newDashboardFilters);
    setHasSelection(!!mainId);
    setKey(k => k + 1);
  }, []);

  // Handler para quando o filtro de entidade (aluno, turma, etc.) muda
  const handleEntityFilterChange = useCallback((
    type: LogEntityType,
    ids: string[],
    mode: LogModeType,
    hierarchyParams?: Omit<DashboardFilterParams, 'startDate' | 'endDate'>
  ) => {
    const newLegacyFilter = {
      type,
      ids: ids.filter(id => id && id.trim() !== ""),
      mode,
      hierarchyParams: hierarchyParams || {},
    };
    setLegacyFilter(newLegacyFilter);
    updateAllFilters(newLegacyFilter, dateRange);
  }, [dateRange, updateAllFilters]);

  // Efeito para atualizar os filtros quando APENAS a data muda
  useEffect(() => {
    if (hasSelection) {
      updateAllFilters(legacyFilter, dateRange);
    }
  }, [dateRange, hasSelection, legacyFilter, updateAllFilters]);

  return (
    <div className="flex min-h-screen bg-[#141414] flex-col items-center w-full">
      <div className="absolute bg-[#141414] w-full flex items-center justify-between border-b border-neutral-800 px-8 py-4 z-10">
        <Typograph text="Dashboard" variant="text2" weight="bold" colorText="text-white" fontFamily="poppins" />
        {user && (
          <Button onClick={() => setMenuOpen(true)} className="flex items-center justify-center p-0 bg-transparent hover:bg-transparent">
            <div className="flex items-center justify-center w-10 h-10 rounded-full rainbow-avatar sm:w-12 sm:h-12 md:w-14 md:h-14">
              <Avatar seed={user._id} backgroundColor="#141414" className="w-full h-full rounded-full" />
            </div>
          </Button>
        )}
      </div>

      <Header isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />

      <div className="flex-1 w-full max-w-7xl px-4 pt-24 pb-20 mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-4">
          <Typograph text="Dashboard de Atividades" variant="text3" weight="semibold" colorText="text-white" fontFamily="montserrat" />
          <Typograph text="Visualize métricas detalhadas por entidade e período" variant="text7" colorText="text-white/60" className="mt-2" weight={"bold"} fontFamily={"montserrat"} />
        </motion.div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <ChartFilter onChange={handleEntityFilterChange} />
          </div>
        </div>

        {!hasSelection ? (
          <div className="flex items-center justify-center h-64 bg-[#1f1f1f] rounded-xl border border-dashed border-white/10 mt-8">
            <Typograph text="Selecione uma entidade nos filtros acima para visualizar os dados" variant="text7" colorText="text-white/70" weight={"bold"} fontFamily={"montserrat"} />
          </div>
        ) : (
          <motion.div key={key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="mt-8 space-y-12">

            <div>
              <div className="space-y-6">
                <UsageChart filter={legacyFilter} />
                <AccessPatternChart filters={dashboardFilters} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <CorrectWrongChart filter={legacyFilter} />
                  <TopicPerformanceChart filters={dashboardFilters} />
                  <CategoryChart filter={legacyFilter} />
                  <ProficiencyRadarChart filters={dashboardFilters} />
                  <EffortMatrixChart filters={dashboardFilters} />
                  <LearningJourneyChart filters={dashboardFilters} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}