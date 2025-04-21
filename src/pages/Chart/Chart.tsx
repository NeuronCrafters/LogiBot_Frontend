import { ChartView } from "@/components/components/Chart/ChartView";
import { FormsHeader } from "@/components/components/Forms/FormsHeader";

function Chart() {
  return (
    <div className="min-h-screen bg-[#141414] overflow-x-hidden">
      <FormsHeader />
      <div className="bg-[#141414]">
        <div className="px-4 py-8 max-w-screen-xl mx-auto">
          <header className="mb-10 text-center">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">
              📊 Dashboard de Interações
            </h1>
            <p className="text-gray-400 mt-2 text-sm lg:text-base">
              Visualize e compare o desempenho por curso, turma ou disciplina
            </p>
          </header>

          <ChartView />
        </div>
      </div>
    </div>
  );
}

export { Chart };
