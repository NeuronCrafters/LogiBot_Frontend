import { ChartView } from "@/components/components/Chart/ChartView";

function Chart() {
  return (
    <div className="bg-[#141414] min-h-screen p-6 lg:p-12 text-white">
      <h1 className="text-center text-3xl lg:text-4xl font-bold mb-8">
        📊 Dashboard de Interações
      </h1>

      <ChartView />
    </div>
  );
}

export default Chart;
