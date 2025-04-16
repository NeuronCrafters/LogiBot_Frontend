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

export type EntityType = "university" | "course" | "class" | "professor" | "discipline";

interface FormsCrudProps {
  onSubmit: (
    item:
      | UniversityData
      | CourseData
      | ProfessorData
      | ClassData
      | DisciplineData
  ) => void;
  initialData?:
  | UniversityData
  | CourseData
  | ProfessorData
  | ClassData
  | DisciplineData;
}

const FormsCrud: React.FC<FormsCrudProps> = ({ onSubmit, initialData }) => {
  const [selectedEntity, setSelectedEntity] = React.useState<EntityType | "">("");

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as EntityType;
    console.log("Entidade selecionada:", value);
    setSelectedEntity(value);
  };

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
          onSubmit={(data) => {
            console.log("UniversityForm onSubmit:", data);
            onSubmit(data);
          }}
          initialData={initialData as UniversityData | undefined}
        />
      )}
      {selectedEntity === "course" && (
        <CourseForm
          onSubmit={(data) => {
            console.log("CourseForm onSubmit:", data);
            onSubmit(data);
          }}
          initialData={initialData as CourseData | undefined}
        />
      )}
      {selectedEntity === "class" && (
        <ClassForm
          onSubmit={(data) => {
            console.log("ClassForm onSubmit:", data);
            onSubmit(data);
          }}
          initialData={initialData as ClassData | undefined}
        />
      )}
      {selectedEntity === "professor" && (
        <ProfessorForm
          onSubmit={(data) => {
            console.log("ProfessorForm onSubmit:", data);
            onSubmit(data);
          }}
          initialData={initialData as ProfessorData | undefined}
        />
      )}
      {selectedEntity === "discipline" && (
        <DisciplineForm
          onSubmit={(data) => {
            console.log("DisciplineForm onSubmit:", data);
            onSubmit(data);
          }}
          initialData={initialData as DisciplineData | undefined}
        />
      )}
    </div>
  );
};

export { FormsCrud };
