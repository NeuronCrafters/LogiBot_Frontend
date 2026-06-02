import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/use-Auth";
import { Label } from "@/components/ui/label";
import { addDays, formatISODate } from "@/utils/formatDate";
import type { LogEntityType, LogModeType } from "@/services/api/api_routes";
import { DashboardFilterParams } from "@/services/api/api_dashboard";
import { AcademicFilter } from "./AcademicFilter";

type DateRange = {
  from?: Date;
  to?: Date;
};

interface DashboardFilterProps {
  onChange: (
    type: LogEntityType | "",
    ids: string[],
    mode: LogModeType,
    allParams?: DashboardFilterParams
  ) => void;
}

export function DashboardFilter({ onChange }: DashboardFilterProps) {
  const { user } = useAuth();
  if (!user) return null;

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

  const [entityType, setEntityType] = useState<LogEntityType | "">("");

  const [mode] = useState<LogModeType>("individual");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hierarchyParams, setHierarchyParams] = useState<Omit<DashboardFilterParams, 'startDate' | 'endDate'>>({});

  const [dateRange, _setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const notifyParent = useCallback((
    currentType: LogEntityType | "",
    currentIds: string[],
    currentMode: LogModeType,
    currentHierarchy?: typeof hierarchyParams,
    currentDateRange?: DateRange
  ) => {

    const validIds = currentIds.filter((i) => i && i.trim() !== "");

    const allParams: DashboardFilterParams = {
      ...currentHierarchy,
      startDate: currentDateRange?.from
        ? formatISODate(currentDateRange.from)
        : undefined,
      endDate: currentDateRange?.to
        ? formatISODate(currentDateRange.to)
        : undefined,
    };

    onChange(currentType, validIds, currentMode, allParams);

  }, [onChange]);

  useEffect(() => {
    notifyParent(entityType, selectedIds, mode, hierarchyParams, dateRange);
  }, [dateRange]);

  const handleEntityTypeChange = useCallback((value: string) => {
    if (value === "") {
      setEntityType("");
      setSelectedIds([]);
      setHierarchyParams({});
      notifyParent("", [], mode, {}, dateRange);
      return;
    }

    const newType = value as LogEntityType;

    setEntityType(newType);
    setSelectedIds([]);
    setHierarchyParams({});

    notifyParent(newType, [], mode, {}, dateRange);

  }, [mode, notifyParent, dateRange]);

  const handleEntitySelection = useCallback(
    (ids: string[], params?: typeof hierarchyParams) => {
      setSelectedIds(ids);
      if (params) setHierarchyParams(params);

      notifyParent(entityType, ids, mode, params, dateRange);
    },
    [entityType, mode, notifyParent, dateRange]
  );

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
    <div className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6">
      <h3 className="font-[Poppins] text-base font-semibold text-white">
        Filtros
      </h3>

      <div className="mt-5 w-full space-y-5">

        <div className="flex flex-col md:flex-row gap-6 w-full">
          <div className="space-y-3 flex-1 w-full">
            <Label htmlFor="entity-type" className="font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Analisar por
            </Label>

            <select
              id="entity-type"
              value={entityType}
              onChange={(e) => handleEntityTypeChange(e.target.value)}
              className="h-11 w-full rounded-xl border border-white/10 bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-blue-500/60"
            >
              <option value="">Selecione uma Entidade</option>

              {allowedEntityTypes.map(type => (
                <option key={type} value={type} className="bg-[#1f1f1f] py-2">
                  {getEntityTypeTitle(type)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {entityType !== "" && (
          <AcademicFilter
            key={entityType}
            entityType={entityType as LogEntityType}
            multiple={mode === "comparison"}
            onSelect={handleEntitySelection}
          />
        )}

      </div>
    </div>
  );
}
