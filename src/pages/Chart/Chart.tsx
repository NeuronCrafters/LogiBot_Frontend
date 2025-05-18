import { useState, useEffect, useCallback, useRef, Suspense, lazy } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-Auth";
import { Avatar } from "@/components/components/Avatar/Avatar";
import { Header } from "@/components/components/Header/Header";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { ChartFilter } from "@/components/components/Chart/ChartFilter";
import type { ChartFilterState } from "@/@types/ChartsType";
import { LogEntityType, LogModeType } from "@/services/api/api_routes";

const UsageChart = lazy(() =>
  import("@/components/components/Chart/Independent/UsageChart").then((mod) => ({
    default: mod.UsageChart,
  }))
);

const CorrectWrongChart = lazy(() =>
  import("@/components/components/Chart/Independent/CorrectWrongChart").then((mod) => ({
    default: mod.CorrectWrongChart,
  }))
);

const CategoryChart = lazy(() =>
  import("@/components/components/Chart/Independent/CategoryChart").then((mod) => ({
    default: mod.CategoryChart,
  }))
);

const ComparisonAccuracyChart = lazy(() =>
  import("@/components/components/Chart/Comparison/ComparisonAccuracyChart").then((mod) => ({
    default: mod.ComparisonAccuracyChart,
  }))
);

const CategoryParticipationChart = lazy(() =>
  import("@/components/components/Chart/Comparison/CategoryParticipationChart").then((mod) => ({
    default: mod.CategoryParticipationChart,
  }))
);

const UsageComparisonChart = lazy(() =>
  import("@/components/components/Chart/Comparison/UsageComparisonChart").then((mod) => ({
    default: mod.UsageComparisonChart,
  }))
);


export function Chart() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState<ChartFilterState>({
    type: "student",
    ids: [],
    mode: "individual",
  });
  const [loading, setLoading] = useState(false);
  const filterUpdateInProgressRef = useRef(false);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleFilterChange = useCallback((
    type: LogEntityType,
    ids: string[],
    mode: LogModeType
  ) => {
    if (filterUpdateInProgressRef.current || !isMounted.current) return;

    filterUpdateInProgressRef.current = true;
    setLoading(true);

    setTimeout(() => {
      if (isMounted.current) {
        setFilter({ type, ids, mode });

        setTimeout(() => {
          if (isMounted.current) {
            setLoading(false);
            filterUpdateInProgressRef.current = false;
          }
        }, 300);
      } else {
        filterUpdateInProgressRef.current = false;
      }
    }, 50);
  }, []);

  const isCompareMode = filter.mode === "compare" && filter.ids.length > 1;
  const hasSelection = filter.ids.length > 0;

  return (
    <div className="flex min-h-screen bg-[#141414] flex-col items-center w-full">
      <div className="absolute bg-[#141414] w-full flex items-center gap-4 border-b border-neutral-800 px-8 py-4 z-10">
        <Typograph
          text="Dashboard"
          colorText="text-white"
          variant="text2"
          weight="bold"
          fontFamily="poppins"
        />
        {user && (
          <div className="ml-auto">
            <button onClick={() => setMenuOpen(true)} className="p-0 flex items-center justify-center">
              <div className="rainbow-avatar w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center">
                <Avatar seed={user._id} backgroundColor="#141414" className="w-full h-full rounded-full" />
              </div>
            </button>
          </div>
        )}
      </div>

      <Header isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />

      <div className="flex-1 w-full max-w-6xl mx-auto pt-24 pb-20 px-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-4"
        >
          <Typograph
            text="Dashboard de Atividades"
            variant="text3"
            weight="semibold"
            fontFamily="montserrat"
            colorText="text-white"
          />
          <p className="text-white/60 mt-2">
            {isCompareMode
              ? "Compare métricas entre diferentes entidades"
              : "Visualize métricas detalhadas por entidade"}
          </p>
        </motion.div>

        <ChartFilter onChange={handleFilterChange} />

        {!hasSelection ? (
          <div className="flex items-center justify-center h-64 bg-[#1f1f1f] rounded-xl border border-white/10 mt-8">
            <p className="text-white/70">
              Selecione uma entidade para visualizar os dados
            </p>
          </div>
        ) : (
          <div className={`transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            <Suspense fallback={<div className="text-white/70 text-center mt-4">Carregando gráficos...</div>}>
              {filter.mode === "individual" && (
                <div className="space-y-6 mt-6">
                  <UsageChart filter={filter} />
                  <CorrectWrongChart filter={filter} />
                  <CategoryChart filter={filter} />
                </div>
              )}

              {filter.mode === "compare" && (
                <div className="space-y-6 mt-6">
                  {filter.ids.length > 1 ? (
                    <>
                      <ComparisonAccuracyChart filter={filter} />
                      <CategoryParticipationChart filter={filter} />
                      <UsageComparisonChart filter={filter} />
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-64 bg-[#1f1f1f] rounded-xl border border-white/10">
                      <p className="text-white/70">
                        Selecione pelo menos duas entidades para visualizar a comparação
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}