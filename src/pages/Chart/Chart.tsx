import { useState, useCallback, useRef, Suspense, lazy, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-Auth";
import { Avatar } from "@/components/components/Avatar/Avatar";
import { Header } from "@/components/components/Header/Header";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { ChartFilter } from "@/components/components/Chart/ChartFilter";
import type { ChartFilterState } from "@/@types/ChartsType";
import { LogEntityType, LogModeType } from "@/services/api/api_routes";
import { logApi_extends as logApi } from "@/services/api/logApi_extends";
import React from "react";

// Lazy-loaded chart components
const UsageChart = lazy(() =>
  import("@/components/components/Chart/Independent/UsageChart").then(mod => ({ default: mod.UsageChart }))
);
const CorrectWrongChart = lazy(() =>
  import("@/components/components/Chart/Independent/CorrectWrongChart").then(mod => ({ default: mod.CorrectWrongChart }))
);
const CategoryChart = lazy(() =>
  import("@/components/components/Chart/Independent/CategoryChart").then(mod => ({ default: mod.CategoryChart }))
);
const ComparisonAccuracyChart = lazy(() =>
  import("@/components/components/Chart/Comparison/ComparisonAccuracyChart").then(mod => ({ default: mod.ComparisonAccuracyChart }))
);
const CategoryParticipationChart = lazy(() =>
  import("@/components/components/Chart/Comparison/CategoryParticipationChart").then(mod => ({ default: mod.CategoryParticipationChart }))
);
const UsageComparisonChart = lazy(() =>
  import("@/components/components/Chart/Comparison/UsageComparisonChart").then(mod => ({ default: mod.UsageComparisonChart }))
);

// ErrorBoundary isolates chart render errors
interface ErrorBoundaryProps {
  children: React.ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Erro em componente do gráfico:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-white/80">
          <p className="font-medium">Erro ao renderizar o componente</p>
          <p className="text-sm mt-2">{this.state.error?.message || "Erro desconhecido"}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export function Chart() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState<ChartFilterState>({
    type: "student",
    ids: [],
    mode: "individual",
  });

  const isMounted = useRef(true);
  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const handleFilterChange = useCallback(
    (type: LogEntityType, ids: string[], mode: LogModeType) => {
      if (!isMounted.current) return;
      const validIds = Array.isArray(ids)
        ? ids.filter(id => id.trim() !== "")
        : [];
      setFilter({ type, ids: validIds, mode });
    },
    []
  );

  // Teste direto de API usando getCached
  useEffect(() => {
    if (filter.mode === 'individual' && filter.ids.length > 0) {
      logApi.getCached(
        filter.type,
        "usage" as any,
        filter.mode as any,
        filter.ids[0]
      )
        .then(res => console.log("[Test API] resposta bruta:", res))
        .catch(err => console.error("[Test API] erro:", err));
    }
  }, [filter]);

  const validIds = filter.ids;
  const isCompareMode = filter.mode === "compare" && validIds.length > 1;
  const hasSelection = validIds.length > 0;

  const ChartLoadingFallback = () => (
    <div className="flex flex-col items-center justify-center h-64 bg-[#1f1f1f] rounded-xl border border-white/10 p-4">
      <div className="animate-pulse w-12 h-12 rounded-full bg-indigo-600/30 mb-4"></div>
      <p className="text-white/70 text-center">Carregando gráficos...</p>
      <p className="text-white/50 text-center text-sm mt-2">Por favor, aguarde enquanto processamos os dados</p>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#141414] flex-col items-center w-full">
      <div className="absolute bg-[#141414] w-full flex items-center gap-4 border-b border-neutral-800 px-8 py-4 z-10">
        <Typograph text="Dashboard" variant="text2" weight="bold" colorText="text-white" fontFamily="poppins" />
        {user && (
          <div className="ml-auto">
            <button onClick={() => setMenuOpen(true)} className="p-0 flex items-center justify-center">
              <Avatar seed={user._id} backgroundColor="#141414" className="rainbow-avatar w-10 h-10 md:w-14 md:h-14 rounded-full" />
            </button>
          </div>
        )}
      </div>

      <Header isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />

      <div className="flex-1 w-full max-w-6xl mx-auto pt-24 pb-20 px-4 space-y-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-4">
          <Typograph text="Dashboard de Atividades" variant="text3" weight="semibold" colorText="text-white" fontFamily="montserrat" />
          <p className="text-white/60 mt-2">
            {isCompareMode ? "Compare métricas entre diferentes entidades" : "Visualize métricas detalhadas por entidade"}
          </p>
        </motion.div>

        <ChartFilter onChange={handleFilterChange} />

        {!hasSelection ? (
          <div className="flex items-center justify-center h-64 bg-[#1f1f1f] rounded-xl border border-white/10 mt-8">
            <p className="text-white/70">Selecione uma entidade para visualizar os dados</p>
          </div>
        ) : (
          <div className="transition-opacity duration-300 opacity-100">
            <Suspense fallback={<ChartLoadingFallback />}>
              {filter.mode === "individual" && validIds[0] && (
                <div key={`${filter.type}-${validIds[0]}`} className="space-y-6 mt-6">
                  <ErrorBoundary><UsageChart filter={{ ...filter, ids: validIds }} /></ErrorBoundary>
                  <ErrorBoundary><CorrectWrongChart filter={{ ...filter, ids: validIds }} /></ErrorBoundary>
                  <ErrorBoundary><CategoryChart filter={{ ...filter, ids: validIds }} /></ErrorBoundary>
                </div>
              )}

              {filter.mode === "compare" && (
                <div key={`${filter.mode}-${validIds.join(",")}`} className="space-y-6 mt-6">
                  {validIds.length > 1 ? (
                    <>
                      <ErrorBoundary><ComparisonAccuracyChart filter={{ ...filter, ids: validIds }} /></ErrorBoundary>
                      <ErrorBoundary><CategoryParticipationChart filter={{ ...filter, ids: validIds }} /></ErrorBoundary>
                      <ErrorBoundary><UsageComparisonChart filter={{ ...filter, ids: validIds }} /></ErrorBoundary>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-64 bg-[#1f1f1f] rounded-xl border border-white/10">
                      <p className="text-white/70">Selecione pelo menos duas entidades para comparação</p>
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
