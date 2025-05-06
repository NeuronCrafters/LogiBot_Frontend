import { ChartView } from "@/components/components/Chart/ChartView";
import { FormsHeader } from "@/components/components/Forms/FormsHeader";

function Chart() {
  return (
    <div className="min-h-screen bg-[#141414] overflow-x-hidden">
      <FormsHeader />
      <div className="bg-[#141414] flex justify-center">
        <div className="w-full max-w-screen-xl px-4 py-10">
          <header className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-white font-Montserrat">
              📊 Análise de Desempenho Acadêmico
            </h1>
            <p className="text-gray-400 mt-3 text-base max-w-2xl mx-auto">
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
