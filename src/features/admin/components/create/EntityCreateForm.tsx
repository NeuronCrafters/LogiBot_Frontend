import { t, useLocale } from "@/i18n";
﻿import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Select } from "@/components/ui/select";
import { UniversityForm } from "./UniversityForm";
import { CourseForm } from "./CourseForm";
import { ProfessorForm } from "./ProfessorForm";
import { ClassForm } from "./ClassForm";
import { DisciplineForm } from "./DisciplineForm";
import type {
  UniversityData,
  CourseData,
  ProfessorData,
  ClassData,
  DisciplineData,
} from "@/features/admin/types";

type EntityType =
  | "university"
  | "course"
  | "class"
  | "professor"
  | "discipline";

type Univ = UniversityData & { id?: string | number };
type Course = CourseData & { id?: string | number };
type Prof = ProfessorData & { id?: string | number };
type Cls = ClassData & { id?: string | number };
type Disc = DisciplineData & { id?: string | number };

interface EntityCreateFormProps {
  onSubmit: (
    entidade: EntityType,
    item: Univ | Course | Prof | Cls | Disc,
  ) => void;
  initialData?:
    | { type: "university"; data: Univ }
    | { type: "course"; data: Course }
    | { type: "class"; data: Cls }
    | { type: "professor"; data: Prof }
    | { type: "discipline"; data: Disc };
  onEntityChange?: () => void;
  animateForm?: boolean;
  defaultEntity?: EntityType;
  lockEntity?: boolean;
}

const ENTITY_LABELS: Record<EntityType, string> = {
  get university() { return t("common.universidade"); },
  get course() { return t("common.curso"); },
  get class() { return t("common.turma"); },
  get professor() { return t("common.professor"); },
  get discipline() { return t("common.disciplina"); },
};

const EntityCreateFormContent: React.FC<EntityCreateFormProps> = ({
  onSubmit,
  initialData,
  onEntityChange,
  animateForm = false,
  defaultEntity,
  lockEntity = false,
}) => {
  useLocale();

  const { user } = useAuth();

  const roles = Array.isArray(user.role) ? user.role : [user.role];
  const isAdmin = roles.includes("admin");
  const isCoordinator = roles.includes("course-coordinator");


  const allowedEntities = useMemo<EntityType[]>(() => isAdmin
    ? ["university", "course", "class", "professor", "discipline"]
    : ["class", "discipline", "professor"], [isAdmin]);

  const [selectedEntity, setSelectedEntity] = useState<EntityType | "">(
    defaultEntity && allowedEntities.includes(defaultEntity)
      ? defaultEntity
      : initialData?.type && allowedEntities.includes(initialData.type)
        ? initialData.type
        : "",
  );

  useEffect(() => {
    if (defaultEntity && allowedEntities.includes(defaultEntity))
      setSelectedEntity(defaultEntity);
  }, [defaultEntity, allowedEntities]);

  useEffect(() => {
    if (selectedEntity && onEntityChange) onEntityChange();
  }, [selectedEntity, onEntityChange]);

  const initial =
    initialData?.type === selectedEntity ? initialData.data : undefined;

  return (
    <div className="rounded-2xl border border-white/10 bg-surface p-5 shadow-lg shadow-black/10 sm:p-6">
      <div className="mb-5">
        <h2 className="font-[Poppins] text-base font-semibold text-white">
          {t("admin.novaEntidade")}</h2>
        <p className="mt-1 font-[Poppins] text-xs text-zinc-500">
          {t("admin.selecioneOTipoDeRegistroEPreencha")}</p>
      </div>

      {!lockEntity && (
        <div>
          <label className="block mb-1.5 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {t("admin.tipoDeEntidade")}</label>
          <Select
            value={selectedEntity}
            onChange={(v) => setSelectedEntity(v as EntityType)}
            options={allowedEntities.map((ent) => ({ value: ent, label: ENTITY_LABELS[ent] }))}
            placeholder={t("admin.selecioneOTipo")}
          />
        </div>
      )}

      {selectedEntity && animateForm && (
        <>
          <div className="my-5 border-t border-white/5" />
          {selectedEntity === "university" && isAdmin && (
            <UniversityForm
              onSubmit={(dados) => onSubmit("university", dados)}
              initialData={initial as Univ | undefined}
            />
          )}
          {selectedEntity === "course" && isAdmin && (
            <CourseForm
              onSubmit={(dados) => onSubmit("course", dados)}
              initialData={initial as Course | undefined}
            />
          )}
          {selectedEntity === "class" && (
            <ClassForm
              onSubmit={(dados) => onSubmit("class", dados)}
              initialData={initial as Cls | undefined}
            />
          )}
          {selectedEntity === "professor" && (isAdmin || isCoordinator) && (
            <ProfessorForm
              onSubmit={(dados) => onSubmit("professor", dados)}
              initialData={initial as Prof | undefined}
            />
          )}
          {selectedEntity === "discipline" && (isAdmin || isCoordinator) && (
            <DisciplineForm
              onSubmit={(dados) => onSubmit("discipline", dados)}
              initialData={initial as Disc | undefined}
            />
          )}
        </>
      )}
    </div>
  );
};

export function EntityCreateForm(props: EntityCreateFormProps) {
  const { user } = useAuth();
  const roles = user ? (Array.isArray(user.role) ? user.role : [user.role]) : [];
  return roles.some(role => role === "admin" || role === "course-coordinator") ? <EntityCreateFormContent {...props} /> : null;
}
