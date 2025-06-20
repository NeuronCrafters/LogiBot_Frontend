import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-Auth";
import { Avatar } from "@/components/components/Avatar/Avatar";
import { Header } from "@/components/components/Header/Header";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { ChartFilter } from "@/components/components/Chart/ChartFilter";
import { UsageChart } from "@/components/components/Chart/Independent/UsageChart";
import { CorrectWrongChart } from "@/components/components/Chart/Independent/CorrectWrongChart";
import { CategoryChart } from "@/components/components/Chart/Independent/CategoryChart";
import type { ChartFilterState } from "@/@types/ChartsType";
import { LogEntityType, LogModeType } from "@/services/api/api_routes";
import { Button } from "@/components/ui/button";

export function Chart() {
  console.log("Chart componente renderizado");

  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Estado do filtro inclui hierarchyParams (disciplineId opcional)
  const [filter, setFilter] = useState<ChartFilterState & {
    hierarchyParams: { universityId?: string; courseId?: string; classId?: string; disciplineId?: string };
  }>({ type: "student", ids: [], mode: "individual", hierarchyParams: {} });

  const [key, setKey] = useState(0);

  const validIds = filter.ids.filter(id => id && id.trim() !== "");
  const hasSelection = validIds.length > 0;

  useEffect(() => {
    console.log("Chart - Estado do filtro atualizado:", { ...filter, hasSelection });
    if (hasSelection) setKey(k => k + 1);
  }, [filter, hasSelection]);

  const handleFilterChange = useCallback(
      (
          type: LogEntityType,
          ids: string[],
          mode: LogModeType,
          hierarchyParams?: { universityId?: string; courseId?: string; classId?: string; disciplineId?: string }
      ) => {
        console.log("Chart - handleFilterChange chamado:", { type, ids, mode, hierarchyParams });
        const valid = ids.filter(id => id && id.trim() !== "");
        if (
            filter.type === type &&
            JSON.stringify(filter.ids) === JSON.stringify(valid) &&
            filter.mode === mode &&
            JSON.stringify(filter.hierarchyParams) === JSON.stringify(hierarchyParams || {})
        ) {
          console.log("Chart - Filtro não mudou, ignorando");
          return;
        }
        setFilter({ type, ids: valid, mode, hierarchyParams: hierarchyParams || {} });
      },
      [filter]
  );

  const getEntityLabel = (type: LogEntityType) => {
    switch (type) {
      case "student": return "Aluno";
      case "class": return "Turma";
      case "course": return "Curso";
      case "university": return "Universidade";
      case "discipline": return "Disciplina";
      default: return "Entidade";
    }
  };

  return (
      <div className="flex min-h-screen bg-[#141414] flex-col items-center w-full">
        <div className="absolute bg-[#141414] w-full flex items-center justify-between border-b border-neutral-800 px-8 py-4 z-10">
          <Typograph text="Dashboard" variant="text2" weight="bold" colorText="text-white" fontFamily="poppins" />
          {user && (
              <Button onClick={() => setMenuOpen(true)} className="flex items-center justify-center p-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-full rainbow-avatar sm:w-12 sm:h-12 md:w-14 md:h-14">
                  <Avatar seed={user._id} backgroundColor="#141414" className="w-full h-full rounded-full" />
                </div>
              </Button>
          )}
        </div>

        <Header isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />

        <div className="flex-1 w-full max-w-6xl px-4 pt-24 pb-20 mx-auto space-y-6">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-4">
            <Typograph text="Dashboard de Atividades" variant="text3" weight="semibold" colorText="text-white" fontFamily="montserrat" />
            <Typograph
                text="Visualize métricas detalhadas por entidade"
                variant="text7"
                weight="regular"
                fontFamily="montserrat"
                colorText="text-white/60"
                className="mt-2"
            />
          </motion.div>

          <ChartFilter onChange={handleFilterChange} />

          {!hasSelection ? (
              <div className="flex items-center justify-center h-64 bg-[#1f1f1f] rounded-xl border border-white/10 mt-8">
                <Typograph
                    text="Selecione uma entidade para visualizar os dados"
                    variant="text7"
                    weight="regular"
                    fontFamily="montserrat"
                    colorText="text-white/70"
                />
              </div>
          ) : (
              <div key={key} className="transition-opacity duration-300 opacity-100">
                {filter.mode === "individual" && validIds[0] && (
                    <div className="mt-6 space-y-6">
                      <UsageChart filter={filter} />
                      <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0 md:h-[450px]">
                        <div className="flex flex-col w-full h-full md:w-1/2">
                          <div className="flex-1 min-h-0">
                            <CorrectWrongChart filter={filter} />
                          </div>
                        </div>
                        <div className="flex flex-col w-full h-full md:w-1/2">
                          <div className="flex-1 min-h-0">
                            <CategoryChart filter={filter} />
                          </div>
                        </div>
                      </div>
                    </div>
                )}

                {filter.mode === "comparison" && validIds.length === 2 && (
                    <div className="mt-6 space-y-6">
                      <div className="p-3 border rounded-lg bg-indigo-500/10 border-indigo-500/30">
                        <Typograph
                            text={
                              <>
                                <span className="font-medium">Comparando:</span> 2 {getEntityLabel(filter.type)}s
                              </>
                            }
                            variant="text9"
                            weight="regular"
                            fontFamily="montserrat"
                            colorText="text-indigo-300"
                        />
                      </div>
                      <UsageChart filter={filter} />
                      <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0 md:h-[450px]">
                        <div className="flex flex-col w-full h-full md:w-1/2">
                          <div className="flex-1 min-h-0">
                            <CorrectWrongChart filter={filter} />
                          </div>
                        </div>
                        <div className="flex flex-col w-full h-full md:w-1/2">
                          <div className="flex-1 min-h-0">
                            <CategoryChart filter={filter} />
                          </div>
                        </div>
                      </div>
                    </div>
                )}
              </div>
          )}
        </div>
      </div>
  );
}
