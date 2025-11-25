import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-Auth";
import { AcademicFilter } from "./AcademicFilter";
import { Label } from "@/components/ui/label";

// Importações necessárias para o filtro de datas
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
// import { DateRangePicker } from "./DateRangePicker"; // Assegure-se que este caminho está correto

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
  const [dateRange, _setDateRange] = useState<DateRange | undefined>({
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

    const allParams: DashboardFilterParams = {
      ...currentHierarchy,
      startDate: currentDateRange?.from ? format(currentDateRange.from, 'yyyy-MM-dd') : undefined,
      endDate: currentDateRange?.to ? format(currentDateRange.to, 'yyyy-MM-dd') : undefined,
    };

    onChange(currentType, validIds, currentMode, allParams);
  }, [onChange]);

  useEffect(() => {
    if (selectedIds.length > 0) {
      notifyParent(entityType, selectedIds, mode, hierarchyParams, dateRange);
    }
  }, [dateRange]);

  const handleEntityTypeChange = useCallback((value: string) => {
    const newType = value as LogEntityType;
    setEntityType(newType);
    setSelectedIds([]);
    setHierarchyParams({});
    notifyParent(newType, [], mode, {}, dateRange);
  }, [mode, notifyParent, dateRange]);

  const handleEntitySelection = useCallback((ids: string[], params?: typeof hierarchyParams) => {
    setSelectedIds(ids);
    if (params) setHierarchyParams(params);
    notifyParent(entityType, ids, mode, params, dateRange);
  }, [entityType, mode, notifyParent, dateRange]);

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

      <div className="space-y-6 w-full">
        <div className="flex flex-col md:flex-row gap-6 w-full">
          <div className="space-y-3 flex-1 w-full">
            <Label htmlFor="entity-type" className="font-medium text-white">
              Analisar por
            </Label>

            <select
              id="entity-type"
              value={entityType}
              onChange={(e) => handleEntityTypeChange(e.target.value)}
              className="w-full h-12 px-3 rounded-md bg-[#141414] text-white border border-white/10 focus:ring-2 focus:ring-white outline-none"
            >
              {allowedEntityTypes.map(type => (
                <option key={type} value={type} className="bg-[#1f1f1f] py-2">
                  {getEntityTypeTitle(type)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <AcademicFilter
          key={entityType}
          entityType={entityType}
          multiple={mode === "comparison"}
          onSelect={handleEntitySelection}
        />
      </div>
    </motion.div>
  );
}