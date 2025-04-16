import React from "react";
import { UniversityForm, UniversityData } from "./Forms/UniversityForm";
import { CourseForm, CourseData } from "./Forms/CourseForm";
import { ProfessorForm, ProfessorData } from "./Forms/ProfessorForm";
import { ClassForm, ClassData } from "./Forms/ClassForm";
import { DisciplineForm, DisciplineData } from "./Forms/DisciplineForm";

export type EntityType = "university" | "course" | "class" | "professor" | "discipline";

interface FormsCrudProps {
  onSubmit: (item: UniversityData | CourseData | ProfessorData | ClassData | DisciplineData) => void;
  initialData?: UniversityData | CourseData | ProfessorData | ClassData | DisciplineData;
}

const FormsCrud: React.FC<FormsCrudProps> = ({ onSubmit, initialData }) => {
  const [selectedEntity, setSelectedEntity] = React.useState<EntityType | "">("");

  return (
    <div className="mb-4 p-4 bg-[#181818] text-white rounded-md">
      <h2 className="text-lg font-bold">Cadastro</h2>
      <label className="block mb-2">Selecione a Entidade:</label>
      <select
        value={selectedEntity}
        onChange={(e) => setSelectedEntity(e.target.value as EntityType)}
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
          onSubmit={onSubmit}
          initialData={initialData as UniversityData | undefined}
        />
      )}
      {selectedEntity === "course" && (
        <CourseForm
          onSubmit={onSubmit}
          initialData={initialData as CourseData | undefined}
        />
      )}
      {selectedEntity === "class" && (
        <ClassForm
          onSubmit={onSubmit}
          initialData={initialData as ClassData | undefined}
        />
      )}
      {selectedEntity === "professor" && (
        <ProfessorForm
          onSubmit={onSubmit}
          initialData={initialData as ProfessorData | undefined}
        />
      )}
      {selectedEntity === "discipline" && (
        <DisciplineForm
          onSubmit={onSubmit}
          initialData={initialData as DisciplineData | undefined}
        />
      )}
    </div>
  );
};

export { FormsCrud };
