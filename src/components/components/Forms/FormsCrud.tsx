import React, { useState } from "react";
import { useAuth } from "@/hooks/use-Auth";
import { UniversityForm } from "./Forms/UniversityForm";
import { CourseForm } from "./Forms/CourseForm";
import { ProfessorForm } from "./Forms/ProfessorForm";
import { ClassForm } from "./Forms/ClassForm";
import { DisciplineForm } from "./Forms/DisciplineForm";
import type {
  UniversityData,
  CourseData,
  ProfessorData,
  ClassData,
  DisciplineData,
} from "@/@types/FormsDataTypes";

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

interface FormsCrudProps {
  onSubmit: (
    entidade: EntityType,
    item: Univ | Course | Prof | Cls | Disc
  ) => void;
  initialData?:
  | { type: "university"; data: Univ }
  | { type: "course"; data: Course }
  | { type: "class"; data: Cls }
  | { type: "professor"; data: Prof }
  | { type: "discipline"; data: Disc };
}

export const FormsCrud: React.FC<FormsCrudProps> = ({
  onSubmit,
  initialData,
}) => {
  const { user } = useAuth();
  if (!user) return null;

  const roles = Array.isArray(user.role) ? user.role : [user.role];
  const isAdmin = roles.includes("admin");
  const isCoordinator = roles.includes("course-coordinator");

  // se não for admin nem coordenador, nem renderiza
  if (!isAdmin && !isCoordinator) {
    return null;
  }

  // define quais entidades aparecem
  const allowedEntities: EntityType[] = isAdmin
    ? ["university", "course", "class", "professor", "discipline"]
    : ["class"]; // coordenador só cria turma

  const [selectedEntity, setSelectedEntity] = useState<EntityType | "">(
    initialData?.type && allowedEntities.includes(initialData.type)
      ? initialData.type
      : ""
  );

  const handleSelectChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedEntity(e.target.value as EntityType);
  };

  const initial =
    initialData?.type === selectedEntity
      ? initialData.data
      : undefined;

  return (
    <div className="mb-4 p-4 bg-[#181818] text-white rounded-md">
      <h2 className="text-lg font-bold mb-2">Cadastro</h2>

      <label className="block mb-2">Selecione a Entidade:</label>
      <select
        value={selectedEntity}
        onChange={handleSelectChange}
        className="p-2 rounded w-full bg-[#202020] text-white mb-4"
      >
        <option value="">-- Escolha --</option>
        {allowedEntities.map((ent) => (
          <option key={ent} value={ent}>
            {{
              university: "Universidade",
              course: "Curso",
              class: "Turma",
              professor: "Professor",
              discipline: "Disciplina",
            }[ent]}
          </option>
        ))}
      </select>

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
      {selectedEntity === "professor" && isAdmin && (
        <ProfessorForm
          onSubmit={(dados) => onSubmit("professor", dados)}
          initialData={initial as Prof | undefined}
        />
      )}
      {selectedEntity === "discipline" && isAdmin && (
        <DisciplineForm
          onSubmit={(dados) => onSubmit("discipline", dados)}
          initialData={initial as Disc | undefined}
        />
      )}
    </div>
  );
};
