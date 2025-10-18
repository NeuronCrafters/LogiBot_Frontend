import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-Auth";
import { AcademicFilter } from "./AcademicFilter";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Importações necessárias para o filtro de datas
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import { DateRangePicker } from "./DateRangePicker"; // Assegure-se que este caminho está correto

// Tipos
import type { LogEntityType, LogModeType } from "@/services/api/api_routes";
import { DashboardFilterParams } from "@/services/api/api_dashboard";

// A interface é atualizada para refletir que o objeto de parâmetros é o mesmo da API
interface ChartFilterProps {
  onChange: (
    type: LogEntityType,
    ids: string[],
    mode: LogModeType,
    allParams?: DashboardFilterParams
  ) => void;
}

export function ChartFilter({ onChange }: ChartFilterProps) {
  const { user } = useAuth();
  if (!user) return null;

  // --- LÓGICA DE PERMISSÕES DE USUÁRIO (inalterada) ---
  const userRoles = Array.isArray(user.role) ? user.role : [user.role];
  const isAdmin = userRoles.includes("admin");
  const isCoordinator = userRoles.includes("course-coordinator");
  const userLevel = isAdmin ? "admin" : isCoordinator ? "coordinator" : "professor";

  const getAllowedEntityTypes = (): LogEntityType[] => {
    if (userLevel === "admin") return ["student", "class", "course", "university"];
    if (userLevel === "coordinator") return ["student", "class", "course"];
    if (userLevel === "professor") return ["discipline", "class", "student"];
    return ["student"];
  };
  const allowedEntityTypes = getAllowedEntityTypes();

  const getInitialEntityType = (): LogEntityType => {
    if (userLevel === "professor") return "discipline";
    return "student";
  };

  // --- ESTADOS LOCAIS CENTRALIZADOS ---
  const [entityType, setEntityType] = useState<LogEntityType>(getInitialEntityType());
  const [mode] = useState<LogModeType>("individual");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hierarchyParams, setHierarchyParams] = useState<Omit<DashboardFilterParams, 'startDate' | 'endDate'>>({});

  // Estado para o filtro de datas, agora vivendo aqui
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  // Função centralizada que combina TODOS os filtros e notifica o componente pai
  const notifyParent = useCallback((
    currentType: LogEntityType,
    currentIds: string[],
    currentMode: LogModeType,
    currentHierarchy?: typeof hierarchyParams,
    currentDateRange?: DateRange
  ) => {
    const validIds = currentIds.filter((i) => i && i.trim() !== "");

    // Combina os filtros acadêmicos com os de data em um único objeto
    const allParams: DashboardFilterParams = {
      ...currentHierarchy,
      startDate: currentDateRange?.from ? format(currentDateRange.from, 'yyyy-MM-dd') : undefined,
      endDate: currentDateRange?.to ? format(currentDateRange.to, 'yyyy-MM-dd') : undefined,
    };

    onChange(currentType, validIds, currentMode, allParams);
  }, [onChange]);

  // Efeito para atualizar os gráficos se APENAS a data for alterada
  // Isso garante reatividade total
  useEffect(() => {
    // Só dispara a atualização se já houver uma entidade selecionada
    if (selectedIds.length > 0) {
      notifyParent(entityType, selectedIds, mode, hierarchyParams, dateRange);
    }
  }, [dateRange]); // A única dependência é o dateRange

  // Handler para quando o tipo de entidade (aluno, turma) muda
  const handleEntityTypeChange = useCallback((value: string) => {
    const newType = value as LogEntityType;
    setEntityType(newType);
    setSelectedIds([]); // Limpa a seleção anterior
    setHierarchyParams({});
    // Notifica o pai para limpar os gráficos, mas mantém o período selecionado
    notifyParent(newType, [], mode, {}, dateRange);
  }, [mode, notifyParent, dateRange]);

  // Handler para quando uma entidade é selecionada no AcademicFilter
  const handleEntitySelection = useCallback((ids: string[], params?: typeof hierarchyParams) => {
    setSelectedIds(ids);
    if (params) setHierarchyParams(params);
    // Notifica o pai com a nova seleção e o período atual
    notifyParent(entityType, ids, mode, params, dateRange);
  }, [entityType, mode, notifyParent, dateRange]);

  // --- FUNÇÕES AUXILIARES (completas) ---
  const getEntityTypeTitle = (t: LogEntityType) => {
    switch (t) {
      case "student": return "Aluno";
      case "discipline": return "Disciplina";
      case "class": return "Turma";
      case "course": return "Curso";
      case "university": return "Universidade";
      default: return "Entidade";
    }
  };

  const getSelectionStatus = () => {
    if (mode !== "comparison") return null;
    if (selectedIds.length === 0) return "Selecione duas entidades para comparação";
    if (selectedIds.length === 1) return "Selecione mais uma entidade para completar a comparação";
    return "Entidades selecionadas para comparação";
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 mb-8 p-6 bg-[#1f1f1f] rounded-xl border border-white/10"
    >
      <h3 className="text-xl font-semibold text-white">Filtros</h3>

      <div className="space-y-6">
        {/* Primeira linha: Select e DatePicker lado a lado no desktop */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="space-y-3 flex-1">
            <Label htmlFor="entity-type" className="font-medium text-white">
              Analisar por
            </Label>
            <Select value={entityType} onValueChange={handleEntityTypeChange}>
              <SelectTrigger className="bg-[#141414] text-white border-white/10 h-12">
                <SelectValue placeholder="Selecione um tipo de entidade" />
              </SelectTrigger>
              <SelectContent className="bg-[#1f1f1f] text-white border-white/10">
                {allowedEntityTypes.map(type => (
                  <SelectItem key={type} value={type}>{getEntityTypeTitle(type)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 md:min-w-fit">
            <Label className="font-medium text-white">
              Período de Análise
            </Label>
            <DateRangePicker date={dateRange} setDate={setDateRange} />
          </div>
        </div>

        {/* Segunda linha: AcademicFilter */}
        <AcademicFilter
          key={entityType}
          entityType={entityType}
          multiple={mode === "comparison"}
          onSelect={handleEntitySelection}
        />
      </div>

      {/* Status da seleção para comparação (lógica mantida) */}
      {mode === "comparison" && (
        <div className={`text-sm p-3 rounded-md border ${selectedIds.length < 2
          ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
          : "text-green-400 bg-green-400/10 border-green-400/20"
          }`}>
          {getSelectionStatus()}
        </div>
      )}
    </motion.div>
  );
}