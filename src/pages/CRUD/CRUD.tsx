import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import UniversityForm from "@/components/components/Forms/UniversityForm";
import CourseForm from "@/components/components/Forms/CourseForm";
import ClassForm from "@/components/components/Forms/ClassForm";
import ProfessorForm from "@/components/components/Forms/ProfessorForm";
import DisciplineForm from "@/components/components/Forms/DisciplineForm";
import AssignDisciplineForm from "@/components/components/Forms/AssignDisciplineForm";
import { Header } from "@/components/components/Header/Header";
import { useAuthStore } from "@/stores/authStore";

const forms = {
  university: UniversityForm,
  course: CourseForm,
  class: ClassForm,
  professor: ProfessorForm,
  discipline: DisciplineForm,
  assignDiscipline: AssignDisciplineForm,
};

function CRUD() {
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const [selectedForm, setSelectedForm] = useState<keyof typeof forms | "">("");

  useEffect(() => {
    const type = searchParams.get("type") as keyof typeof forms | null;
    if (type && forms[type]) {
      setSelectedForm(type);
    }
  }, [searchParams]);

  const FormComponent = selectedForm ? forms[selectedForm] : null;

  return (
    <div className="w-full h-screen flex flex-col bg-[#141414]">
      {isAuthenticated && (
        <div className="fixed top-0 left-0 w-full z-50 bg-[#141414] shadow-md">
          <Header isOpen={false} closeMenu={() => { }} />
        </div>
      )}

      <main className={`flex flex-1 items-center justify-center ${isAuthenticated ? "pt-[80px]" : ""}`}>
        <div className="bg-[#2a2a2a] shadow-lg rounded-lg p-8 max-w-2xl w-full mx-4">
          <h1 className="text-2xl font-bold mb-4 text-center text-white">Gerenciamento Acadêmico</h1>

          <div className="flex justify-center">
            <select
              className="border p-2 rounded w-[560px] bg-[#3a3a3a] text-white"
              value={selectedForm}
              onChange={(e) => setSelectedForm(e.target.value as keyof typeof forms)}
            >
              <option value="">Selecione um CRUD</option>
              <option value="university">Criar Universidade</option>
              <option value="course">Criar Curso</option>
              <option value="class">Criar Turma</option>
              <option value="professor">Criar Professor</option>
              <option value="discipline">Criar Disciplina</option>
              <option value="assignDiscipline">Vincular Aluno a Uma Disciplina</option>
            </select>
          </div>

          {FormComponent && (
            <div className="mt-6">
              <FormComponent />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export { CRUD };
