// ChartView.tsx
import { useState, useMemo } from "react";
import { CascadingFilter } from "./CascadingFilter";
import { ChartGraphics } from "./ChartGraphic";
import { ChartComparison } from "./ChartComparison";
import { ChartComparisonLine } from "./ChartComparisonLine";
import { ChartModeSelector } from "./ChartModeSelector";
import { MetricCheckboxSelector, MetricOption } from "./MetricCheckboxSelector";
import { ChartMode } from "@/@types/ChartsType";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Filter } from "lucide-react";
import { addDays } from "date-fns";
import { DateRangeFilter } from "./DateRangeFilter";
import { DateRange } from "react-day-picker";

export function ChartView() {
  const [mode, setMode] = useState<ChartMode>("visualizar");
  const [selectedType, setSelectedType] = useState<"university" | "course" | "discipline" | "class" | "student">("university");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<MetricOption[]>([
    "correct",
    "wrong",
    "usage",
    "sessions",
  ]);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [comparisonView, setComparisonView] = useState<"bar" | "line">("line");

  const handleFilterChange = (filter: {
    type: "university" | "course" | "discipline" | "class" | "student";
    universityId?: string;
    courseId?: string;
    classId?: string;
    disciplineId?: string;
    studentId?: string;
  }) => {
    const ids: string[] = [];
    const type = filter.type;

    if (filter.studentId) ids.push(filter.studentId);
    else if (filter.disciplineId) ids.push(filter.disciplineId);
    else if (filter.classId) ids.push(filter.classId);
    else if (filter.courseId) ids.push(filter.courseId);
    else if (filter.universityId) ids.push(filter.universityId);

    setSelectedType(type);
    setSelectedIds(ids);
  };

  const shouldShowGraphics = useMemo(() => mode === "visualizar" && selectedIds.length > 0, [mode, selectedIds]);
  const shouldShowComparison = useMemo(() => mode === "comparar" && selectedIds.length > 1, [mode, selectedIds]);

  const selectedLabel = useMemo(() => {
    if (selectedIds.length === 0) return "Nenhum item selecionado";
    if (selectedIds.length === 1) return `Selecionado: ${selectedType} - ${selectedIds[0]}`;
    return `Comparando ${selectedType}s: ${selectedIds.join(" vs ")}`;
  }, [selectedIds, selectedType]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Card className="bg-[#181818] border-0">
        <CardHeader className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2">
          <CardTitle className="text-2xl font-bold text-white">Análise de Dados</CardTitle>
          <div className="flex items-center gap-3">
            <ChartModeSelector mode={mode} setMode={setMode} />
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  className="bg-[#2a2a2a] text-slate-200 hover:bg-[#333333]"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-[#181818] border-0">
                <SheetHeader>
                  <SheetTitle className="text-white">Filtros</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-6">
                  <DateRangeFilter dateRange={dateRange} setDateRange={setDateRange} />
                  <CascadingFilter onFilterChange={handleFilterChange} />
                  <div className="mt-4">
                    <MetricCheckboxSelector
                      selectedMetrics={selectedMetrics}
                      setSelectedMetrics={setSelectedMetrics}
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400">{selectedLabel}</p>
        </CardContent>
      </Card>

      {shouldShowGraphics && (
        <Card className="bg-[#181818] border-0">
          <CardContent className="pt-6">
            <ChartGraphics
              type={selectedType}
              id={selectedIds[0]}
              metrics={selectedMetrics}
              dateRange={dateRange}
            />
          </CardContent>
        </Card>
      )}

      {shouldShowComparison && (
        <Card className="bg-[#181818] border-0">
          <CardContent className="pt-6">
            <Tabs defaultValue={comparisonView} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-[#2a2a2a]">
                <TabsTrigger
                  value="line"
                  onClick={() => setComparisonView("line")}
                  className="text-white data-[state=active]:bg-[#333333]"
                >
                  Gráfico de Linha
                </TabsTrigger>
                <TabsTrigger
                  value="bar"
                  onClick={() => setComparisonView("bar")}
                  className="text-white data-[state=active]:bg-[#333333]"
                >
                  Gráfico de Barras
                </TabsTrigger>
              </TabsList>
              <TabsContent value="line">
                <ChartComparisonLine
                  type={selectedType}
                  ids={selectedIds}
                  metric={selectedMetrics[0]}
                  dateRange={dateRange}
                />
              </TabsContent>
              <TabsContent value="bar">
                <ChartComparison
                  type={selectedType}
                  ids={selectedIds}
                  metric={selectedMetrics[0]}
                  dateRange={dateRange}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
