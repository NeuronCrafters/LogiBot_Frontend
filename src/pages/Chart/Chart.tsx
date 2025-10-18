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
              <div className="grid grid-cols-1 gap-6">
                <UsageChart filter={legacyFilter} />
                <AccessPatternChart filters={dashboardFilters} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* A div externa é o item do grid. Ela se esticará para a altura da linha. */}
                  <div><CorrectWrongChart filter={legacyFilter} /></div>
                  <div><TopicPerformanceChart filters={dashboardFilters} /></div>
                  <div><CategoryChart filter={legacyFilter} /></div>
                  <div><ProficiencyRadarChart filters={dashboardFilters} /></div>
                </div>
                <div><EffortMatrixChart filters={dashboardFilters} /></div>
                <div><LearningJourneyChart filters={dashboardFilters} /></div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}