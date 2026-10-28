import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { addDays, formatISODate } from "@/shared/lib/formatDate";
import type { LogEntityType, LogModeType } from "@/services/api/api_routes";
import { DashboardFilterParams } from "@/features/dashboard/api/dashboardApi";
import { AcademicFilter } from "@/features/academic/components/AcademicFilter";

type DateRange = { from?: Date; to?: Date };

interface DashboardFilterProps {
  onChange: (
    type: LogEntityType | "",
    ids: string[],
    mode: LogModeType,
    allParams?: DashboardFilterParams,
  ) => void;
}

export function DashboardFilter({ onChange }: DashboardFilterProps) {
  const { user } = useAuth();
  if (!user) return null;

  const userRoles = Array.isArray(user.role) ? user.role : [user.role];
  const isAdmin = userRoles.includes("admin");
  const isCoordinator = userRoles.includes("course-coordinator");
  const userLevel = isAdmin
    ? "admin"
    : isCoordinator
      ? "coordinator"
      : "professor";

  const getAllowedEntityTypes = (): LogEntityType[] => {
    if (userLevel === "admin")
      return ["student", "class", "course", "university"];
    if (userLevel === "coordinator") return ["student", "class", "course"];
    if (userLevel === "professor") return ["discipline", "class", "student"];
    return ["student"];
  };

  const allowedEntityTypes = getAllowedEntityTypes();
  const [entityType, setEntityType] = useState<LogEntityType | "">("");
  const [mode] = useState<LogModeType>("individual");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hierarchyParams, setHierarchyParams] = useState<
    Omit<DashboardFilterParams, "startDate" | "endDate">
  >({});
  const [dateRange, _setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const notifyParent = useCallback(
    (
      currentType: LogEntityType | "",
      currentIds: string[],
      currentMode: LogModeType,
      currentHierarchy?: typeof hierarchyParams,
      currentDateRange?: DateRange,
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
    },
    [onChange],
  );

  useEffect(() => {
    notifyParent(entityType, selectedIds, mode, hierarchyParams, dateRange);
  }, [dateRange]);

  const handleEntityTypeChange = useCallback(
    (value: string) => {
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
    },
    [mode, notifyParent, dateRange],
  );

  const handleEntitySelection = useCallback(
    (ids: string[], params?: typeof hierarchyParams) => {
      setSelectedIds(ids);
      if (params) setHierarchyParams(params);
      notifyParent(entityType, ids, mode, params, dateRange);
    },
    [entityType, mode, notifyParent, dateRange],
  );

  const getEntityTypeTitle = (t: LogEntityType) => {
    switch (t) {
      case "student":
        return "Student";
      case "discipline":
        return "Subject";
      case "class":
        return "Class";
      case "course":
        return "Program";
      case "university":
        return "University";
      default:
        return "Entity";
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6">
      <h3 className="font-[Poppins] text-base font-semibold text-white">
        Filters
      </h3>

      <div className="mt-5 w-full space-y-5">
        <div className="flex flex-col md:flex-row gap-6 w-full">
          <div className="space-y-3 flex-1 w-full">
            <Label
              htmlFor="entity-type"
              className="font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500"
            >
              Analyze by
            </Label>
            <Select
              value={entityType}
              onChange={handleEntityTypeChange}
              placeholder="Select an Entity"
              options={allowedEntityTypes.map((type) => ({
                value: type,
                label: getEntityTypeTitle(type),
              }))}
            />
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
