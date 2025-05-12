import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-Auth";
import { Avatar } from "@/components/components/Avatar/Avatar";
import { Header } from "@/components/components/Header/Header";
import { Typograph } from "@/components/components/Typograph/Typograph";

import { ChartFilter } from "@/components/components/Chart/Independent/ChartFilter";
import { UsageChart } from "@/components/components/Chart/Independent/UsageChart";
import { CorrectWrongChart } from "@/components/components/Chart/Independent/CorrectWrongChart";
import { CategoryChart } from "@/components/components/Chart/Independent/CategoryChart";
import { ComparisonAccuracyChart } from "@/components/components/Chart/Comparison/ComparisonAccuracyChart";
import { CategoryParticipationChart } from "@/components/components/Chart/Comparison/CategoryParticipationChart";
import { UsageComparisonChart } from "@/components/components/Chart/Comparison/UsageComparisonChart";
import type { ChartFilterState } from "@/@types/ChartsType";

export function Chart() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState<ChartFilterState>({
    type: "student",
    ids: [],
    mode: "single",
  });

  return (
    <div className="flex min-h-screen bg-[#141414] flex-col items-center w-full">
      {/* Header fixo com avatar */}
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

      {/* Menu lateral */}
      <Header isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />

      {/* Conteúdo principal */}
      <div className="flex-1 w-full max-w-6xl mx-auto pt-24 pb-20 px-2 space-y-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Typograph
            text="Dashboard de Atividades"
            variant="text3"
            weight="semibold"
            fontFamily="montserrat"
            colorText="text-white"
          />
        </motion.div>

        <ChartFilter onChange={(type, ids, mode) => setFilter({ type, ids, mode })} />

        <UsageChart filter={filter} />
        <CorrectWrongChart filter={filter} />
        <CategoryChart filter={filter} />
        <ComparisonAccuracyChart filter={filter} />
        <CategoryParticipationChart filter={filter} />
        <UsageComparisonChart filter={filter} />
      </div>
    </div>
  );
}
