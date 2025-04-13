import { ChartView } from "@/components/components/Chart/ChartView";

function Chart() {
  return (
    <main className="bg-[#141414] min-h-screen text-white px-4 py-8 lg:px-12 lg:py-16">
      <header className="mb-10 text-center">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
          📊 Dashboard de Interações
        </h1>
        <p className="text-gray-400 mt-2 text-sm lg:text-base">
          Visualize e compare o desempenho por curso, turma ou disciplina
        </p>
      </header>

      <ChartView />
    </main>
  );
}

export { Chart };
