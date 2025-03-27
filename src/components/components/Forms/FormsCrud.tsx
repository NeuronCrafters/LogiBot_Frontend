import React from "react";
import { UniversityForm } from "./Forms/UniversityForm";
import { CourseForm } from "./Forms/CourseForm";
import { ProfessorForm } from "./Forms/ProfessorForm";
import { ClassForm } from "./Forms/ClassForm";
import { DisciplineForm } from "./Forms/DisciplineForm";

export type EntityType = "university" | "course" | "class" | "professor" | "discipline";

interface FormsCrudProps {
  onSubmit: (item: any) => void;
  initialData?: any;
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

      {selectedEntity === "university" && <UniversityForm onSubmit={onSubmit} initialData={initialData} />}
      {selectedEntity === "course" && <CourseForm onSubmit={onSubmit} initialData={initialData} />}
      {selectedEntity === "professor" && <ProfessorForm onSubmit={onSubmit} initialData={initialData} />}
      {selectedEntity === "class" && <ClassForm onSubmit={onSubmit} initialData={initialData} />}
      {selectedEntity === "discipline" && <DisciplineForm onSubmit={onSubmit} initialData={initialData} />}
    </div>
  );
};

export { FormsCrud };
