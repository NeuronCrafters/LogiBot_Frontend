import { useState } from "react";
import { ChartFilter } from "@/components/components/Chart/ChartFilter";
import { ChartGraphics } from "@/components/components/Chart/ChatGraphic";
import { Card, CardContent } from "@/components/ui/card";

function Chart() {
  const [selectedType, setSelectedType] = useState<"course" | "class" | "discipline" | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (type: "course" | "class" | "discipline", id: string) => {
    setSelectedType(type);
    setSelectedId(id);
  };

  return (
    <div className="bg-[#141414] text-white min-h-screen p-6 flex flex-col items-center lg:p-12">
      <h1 className="text-center pb-4 text-xl font-bold tracking-wide lg:text-4xl">
        Dashboard de Interações
      </h1>

      <ChartFilter onSelect={handleSelect} />

      {selectedType && selectedId && (
        <Card className="w-full max-w-5xl bg-[#1F1F1F] rounded-xl p-6 shadow-lg mt-6">
          <CardContent>
            <ChartGraphics type={selectedType} id={selectedId} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export { Chart };