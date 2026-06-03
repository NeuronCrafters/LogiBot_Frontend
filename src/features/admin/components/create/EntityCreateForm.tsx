import React, { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { UniversityForm } from "./UniversityForm";
import { CourseForm } from "./CourseForm";
import { ProfessorForm } from "./ProfessorForm";
import { ClassForm } from "./ClassForm";
import { DisciplineForm } from "./DisciplineForm";
import type { UniversityData, CourseData, ProfessorData, ClassData, DisciplineData } from "@/features/admin/types";

type EntityType = "university" | "course" | "class" | "professor" | "discipline";

type Univ = UniversityData & { id?: string | number };
type Course = CourseData & { id?: string | number };
type Prof = ProfessorData & { id?: string | number };
type Cls = ClassData & { id?: string | number };
type Disc = DisciplineData & { id?: string | number };

interface EntityCreateFormProps {
  onSubmit: (entidade: EntityType, item: Univ | Course | Prof | Cls | Disc) => void;
  initialData?: { type: "university"; data: Univ } | { type: "course"; data: Course } | { type: "class"; data: Cls } | { type: "professor"; data: Prof } | { type: "discipline"; data: Disc };
  onEntityChange?: () => void;
  animateForm?: boolean;
  defaultEntity?: EntityType;
  lockEntity?: boolean;
}

const ENTITY_LABELS: Record<EntityType, string> = {
  university: "Universidade", course: "Curso", class: "Turma", professor: "Professor", discipline: "Disciplina",
};

export const EntityCreateForm: React.FC<EntityCreateFormProps> = ({ onSubmit, initialData, onEntityChange, animateForm = false, defaultEntity, lockEntity = false }) => {
  const { user } = useAuth();
  if (!user) return null;

  const roles = Array.isArray(user.role) ? user.role : [user.role];
  const isAdmin = roles.includes("admin");
  const isCoordinator = roles.includes("course-coordinator");

  if (!isAdmin && !isCoordinator) return null;

  const allowedEntities: EntityType[] = isAdmin ? ["university", "course", "class", "professor", "discipline"] : ["class", "discipline", "professor"];

  const [selectedEntity, setSelectedEntity] = useState<EntityType | "">(
    defaultEntity && allowedEntities.includes(defaultEntity)
      ? defaultEntity
      : initialData?.type && allowedEntities.includes(initialData.type)
        ? initialData.type
        : ""
  );

  useEffect(() => {
    if (defaultEntity && allowedEntities.includes(defaultEntity)) setSelectedEntity(defaultEntity);
  }, [defaultEntity, allowedEntities]);

  useEffect(() => {
    if (selectedEntity && onEntityChange) onEntityChange();
  }, [selectedEntity, onEntityChange]);

  const initial = initialData?.type === selectedEntity ? initialData.data : undefined;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6">
      <div className="mb-5">
        <h2 className="font-[Poppins] text-base font-semibold text-white">Nova entidade</h2>
        <p className="mt-1 font-[Poppins] text-xs text-zinc-500">Selecione o tipo de registro e preencha as informações abaixo.</p>
      </div>

      {!lockEntity && (
        <div>
          <label className="block mb-1.5 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">Tipo de entidade</label>
          <select value={selectedEntity} onChange={(e) => setSelectedEntity(e.target.value as EntityType)} className="h-11 w-full rounded-xl border border-white/10 bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-blue-500/60">
            <option value="">Selecione o tipo</option>
            {allowedEntities.map((ent) => <option key={ent} value={ent}>{ENTITY_LABELS[ent]}</option>)}
          </select>
        </div>
      )}

      {selectedEntity && animateForm && (
        <>
          <div className="my-5 border-t border-white/5" />
          {selectedEntity === "university" && isAdmin && <UniversityForm onSubmit={(dados) => onSubmit("university", dados)} initialData={initial as Univ | undefined} />}
          {selectedEntity === "course" && isAdmin && <CourseForm onSubmit={(dados) => onSubmit("course", dados)} initialData={initial as Course | undefined} />}
          {selectedEntity === "class" && <ClassForm onSubmit={(dados) => onSubmit("class", dados)} initialData={initial as Cls | undefined} />}
          {selectedEntity === "professor" && (isAdmin || isCoordinator) && <ProfessorForm onSubmit={(dados) => onSubmit("professor", dados)} initialData={initial as Prof | undefined} />}
          {selectedEntity === "discipline" && (isAdmin || isCoordinator) && <DisciplineForm onSubmit={(dados) => onSubmit("discipline", dados)} initialData={initial as Disc | undefined} />}
        </>
      )}
    </div>
  );
};
