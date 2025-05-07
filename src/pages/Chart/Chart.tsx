import { ChartView } from "@/components/components/Chart/ChartView";
import { FormsHeader } from "@/components/components/Forms/FormsHeader";

function Chart() {
  return (
    <div className="min-h-screen bg-[#141414] overflow-x-hidden">
      <FormsHeader />
      <div className="bg-[#141414] py-10">
        <div className="px-4 max-w-6xl mx-auto">
          <header className="mb-10 text-center">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">
              📊 Dashboard de Interações
            </h1>
            <p className="text-gray-400 mt-2 text-sm lg:text-base">
              Visualize o desempenho de universidades, cursos, turmas, disciplinas e alunos. Compare métricas como tempo de uso, acertos e sessões.
            </p>
          </header>
          <ChartView />
        </div>
      </div>
    </div>
  );
}

export { Chart };
