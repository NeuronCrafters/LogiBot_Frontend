import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { publicApi } from "@/services/apiClient";

interface AcademicEntity {
  _id: string;
  name: string;
}

interface CascadingFilterProps {
  onFilterChange: (filter: {
    type: "university" | "course" | "discipline" | "class" | "student";
    universityId?: string;
    courseId?: string;
    classId?: string;
    disciplineId?: string;
    studentId?: string;
  }) => void;
}

export function CascadingFilter({ onFilterChange }: CascadingFilterProps) {
  const [type, setType] = useState<"university" | "course" | "discipline" | "class" | "student">("university");

  const [universities, setUniversities] = useState<AcademicEntity[]>([]);
  const [courses, setCourses] = useState<AcademicEntity[]>([]);
  const [classes, setClasses] = useState<AcademicEntity[]>([]);
  const [disciplines, setDisciplines] = useState<AcademicEntity[]>([]);
  const [students, setStudents] = useState<AcademicEntity[]>([]);

  const [selectedUniversity, setSelectedUniversity] = useState<string>();
  const [selectedCourse, setSelectedCourse] = useState<string>();
  const [selectedClass, setSelectedClass] = useState<string>();
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>();
  const [selectedStudent, setSelectedStudent] = useState<string>();

  useEffect(() => {
    publicApi.getInstitutions<AcademicEntity[]>()
      .then(setUniversities)
      .catch((err) => console.error("Erro ao buscar universidades:", err));
  }, []);

  useEffect(() => {
    if (selectedUniversity) {
      publicApi.getCourses<AcademicEntity[]>(selectedUniversity)
        .then(setCourses)
        .catch((err) => console.error("Erro ao buscar cursos:", err));
    } else {
      setCourses([]);
      setSelectedCourse(undefined);
    }
  }, [selectedUniversity]);

  useEffect(() => {
    if (selectedUniversity && selectedCourse) {
      publicApi.getClasses<AcademicEntity[]>(selectedUniversity, selectedCourse)
        .then(setClasses)
        .catch((err) => console.error("Erro ao buscar turmas:", err));

      publicApi.getDisciplines<AcademicEntity[]>(selectedUniversity, selectedCourse)
        .then(setDisciplines)
        .catch((err) => console.error("Erro ao buscar disciplinas:", err));
    } else {
      setClasses([]);
      setSelectedClass(undefined);
      setDisciplines([]);
      setSelectedDiscipline(undefined);
    }
  }, [selectedUniversity, selectedCourse]);

  useEffect(() => {
    if (selectedUniversity && selectedCourse && selectedClass) {
      publicApi.getStudentsByClass<AcademicEntity[]>(selectedUniversity, selectedCourse, selectedClass)
        .then(setStudents)
        .catch((err) => console.error("Erro ao buscar alunos:", err));
    } else {
      setStudents([]);
      setSelectedStudent(undefined);
    }
  }, [selectedUniversity, selectedCourse, selectedClass]);

  useEffect(() => {
    onFilterChange({
      type,
      universityId: selectedUniversity,
      courseId: selectedCourse,
      classId: selectedClass,
      disciplineId: selectedDiscipline,
      studentId: selectedStudent,
    });
  }, [
    type,
    selectedUniversity,
    selectedCourse,
    selectedClass,
    selectedDiscipline,
    selectedStudent,
    onFilterChange,
  ]);

  return (
    <div className="space-y-4">
      {/* Tipo */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-white">Tipo de Visualização</label>
        <Select
          value={type}
          onValueChange={(value) => {
            setType(value as typeof type);
            setSelectedUniversity(undefined);
            setSelectedCourse(undefined);
            setSelectedClass(undefined);
            setSelectedDiscipline(undefined);
            setSelectedStudent(undefined);
          }}
        >
          <SelectTrigger className="w-full bg-[#2a2a2a] border-neutral-700 text-white">
            <SelectValue placeholder="Escolha um tipo" />
          </SelectTrigger>
          <SelectContent className="bg-[#2a2a2a] border-neutral-700 text-white">
            <SelectItem value="university">Universidade</SelectItem>
            <SelectItem value="course">Curso</SelectItem>
            <SelectItem value="discipline">Disciplina</SelectItem>
            <SelectItem value="class">Turma</SelectItem>
            <SelectItem value="student">Aluno</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Universidade */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-white">Universidade</label>
        <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
          <SelectTrigger className="w-full bg-[#2a2a2a] border-neutral-700 text-white">
            <SelectValue placeholder="Selecione uma universidade" />
          </SelectTrigger>
          <SelectContent className="bg-[#2a2a2a] border-neutral-700 text-white">
            {universities.map((u) => (
              <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Curso */}
      {(type !== "university" && selectedUniversity) && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-white">Curso</label>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-full bg-[#2a2a2a] border-neutral-700 text-white">
              <SelectValue placeholder="Selecione um curso" />
            </SelectTrigger>
            <SelectContent className="bg-[#2a2a2a] border-neutral-700 text-white">
              {courses.map((c) => (
                <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Disciplina */}
      {type === "discipline" && selectedCourse && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-white">Disciplina</label>
          <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
            <SelectTrigger className="w-full bg-[#2a2a2a] border-neutral-700 text-white">
              <SelectValue placeholder="Selecione uma disciplina" />
            </SelectTrigger>
            <SelectContent className="bg-[#2a2a2a] border-neutral-700 text-white">
              {disciplines.map((d) => (
                <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Turma */}
      {(type === "class" || type === "student") && selectedCourse && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-white">Turma</label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-full bg-[#2a2a2a] border-neutral-700 text-white">
              <SelectValue placeholder="Selecione uma turma" />
            </SelectTrigger>
            <SelectContent className="bg-[#2a2a2a] border-neutral-700 text-white">
              {classes.map((t) => (
                <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Aluno */}
      {type === "student" && selectedClass && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-white">Aluno</label>
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="w-full bg-[#2a2a2a] border-neutral-700 text-white">
              <SelectValue placeholder="Selecione um aluno" />
            </SelectTrigger>
            <SelectContent className="bg-[#2a2a2a] border-neutral-700 text-white">
              {students.map((s) => (
                <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
