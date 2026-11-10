import { t, useLocale } from "@/i18n";
﻿import { useState, useCallback } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { LogEntityType, LogModeType } from "@/services/api/api_routes";
import { DashboardFilterParams } from "@/features/dashboard/api/dashboardApi";
import { AcademicFilter } from "@/features/academic/components/AcademicFilter";


interface DashboardFilterProps {
  onChange: (
    type: LogEntityType | "",
    ids: string[],
    mode: LogModeType,
    allParams?: DashboardFilterParams,
  ) => void;
}

function DashboardFilterContent({ onChange }: DashboardFilterProps) {
  const locale = useLocale();

  const { user } = useAuth();

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
  const notifyParent = useCallback(
    (currentType: LogEntityType | "", currentIds: string[], currentMode: LogModeType,
      currentHierarchy?: DashboardFilterParams) => {
      onChange(currentType, currentIds.filter((id) => id && id.trim() !== ""), currentMode, currentHierarchy || {});
    },
    [onChange],
  );

  const handleEntityTypeChange = useCallback(
    (value: string) => {
      if (value === "") {
        setEntityType("");
        notifyParent("", [], mode, {});
        return;
      }
      const newType = value as LogEntityType;
      setEntityType(newType);
      notifyParent(newType, [], mode, {});
    },
    [mode, notifyParent],
  );

  const handleEntitySelection = useCallback(
    (ids: string[], params?: DashboardFilterParams) => {
      notifyParent(entityType, ids, mode, params);
    },
    [entityType, mode, notifyParent],
  );

  const getEntityTypeTitle = (type: LogEntityType) => {
    switch (type) {
      case "student":
        return t("common.aluno", {}, locale);
      case "discipline":
        return t("common.disciplina", {}, locale);
      case "class":
        return t("common.turma", {}, locale);
      case "course":
        return t("common.curso", {}, locale);
      case "university":
        return t("common.universidade", {}, locale);
      default:
        return t("dashboard.entidade", {}, locale);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6">
      <h3 className="font-[Poppins] text-base font-semibold text-white">
        {t("dashboard.filtros", {}, locale)}</h3>

      <div className="mt-5 w-full space-y-5">
        <div className="flex flex-col md:flex-row gap-6 w-full">
          <div className="space-y-3 flex-1 w-full">
            <Label
              htmlFor="entity-type"
              className="font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500"
            >
              {t("dashboard.analisarPor", {}, locale)}</Label>
            <Select
              value={entityType}
              onChange={handleEntityTypeChange}
              placeholder={t("dashboard.selecioneUmaEntidade", {}, locale)}
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

export function DashboardFilter(props: DashboardFilterProps) {
  const { user } = useAuth();
  return user ? <DashboardFilterContent {...props} /> : null;
}
