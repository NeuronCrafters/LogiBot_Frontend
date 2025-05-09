import React from "react";
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

// Estendemos cada Data com um id opcional para evitar erro de propriedade ausente
// Agora id pode ser string ou number, alinhando com CourseData.id
type Univ = UniversityData & { id?: string | number };
type Course = CourseData & { id?: string | number };
type Prof = ProfessorData & { id?: string | number };
type Cls = ClassData & { id?: string | number };
type Disc = DisciplineData & { id?: string | number };

export type EntityType =
  | "university"
  | "course"
  | "class"
  | "professor"
  | "discipline";

interface FormsCrudProps {
  /**
   * callback que recebe a entidade e os dados do formulário
   */
  onSubmit: (
    entidade: EntityType,
    item: Univ | Course | Prof | Cls | Disc
  ) => void;

  /**
   * initialData deve vir como { type: EntityType, data: DadosCorrespondentes }
   */
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
  // seleciona a entidade a cadastrar
  const [selectedEntity, setSelectedEntity] = React.useState<
    EntityType | ""
  >(initialData?.type ?? "");

  const handleSelectChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedEntity(e.target.value as EntityType);
  };

  // extrai somente o `data` quando o tipo bater com a entidade selecionada
  const initial =
    initialData?.type === selectedEntity
      ? initialData.data
      : undefined;

  return (
    <div className="mb-4 p-4 bg-[#181818] text-white rounded-md">
      <h2 className="text-lg font-bold">Cadastro</h2>

      <label className="block mb-2">Selecione a Entidade:</label>
      <select
        value={selectedEntity}
        onChange={handleSelectChange}
        className="p-2 rounded w-full bg-[#202020] text-white"
      >
        <option value="">Selecione</option>
        <option value="university">Universidade</option>
        <option value="course">Curso</option>
        <option value="class">Turma</option>
        <option value="professor">Professor</option>
        <option value="discipline">Disciplina</option>
      </select>

      {selectedEntity === "university" && (
        <UniversityForm
          onSubmit={(dados) => onSubmit("university", dados)}
          initialData={initial as Univ | undefined}
        />
      )}

      {selectedEntity === "course" && (
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

      {selectedEntity === "professor" && (
        <ProfessorForm
          onSubmit={(dados) => onSubmit("professor", dados)}
          initialData={initial as Prof | undefined}
        />
      )}

      {selectedEntity === "discipline" && (
        <DisciplineForm
          onSubmit={(dados) => onSubmit("discipline", dados)}
          initialData={initial as Disc | undefined}
        />
      )}
    </div>
  );
};