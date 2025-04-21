import { useState, useEffect } from "react";
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
  const [selectedType, setSelectedType] = useState<"university" | "course" | "discipline" | "class" | "student">("university");
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
    const fetchUniversities = async () => {
      try {
        const data = await publicApi.getInstitutions<AcademicEntity[]>();
        setUniversities(data);
      } catch (error) {
        console.error("Erro ao buscar universidades:", error);
      }
    };
    fetchUniversities();
  }, []);

  useEffect(() => {
    if (selectedUniversity) {
      const fetchCourses = async () => {
        try {
          const data = await publicApi.getCourses<AcademicEntity[]>(selectedUniversity);
          setCourses(data);
        } catch (error) {
          console.error("Erro ao buscar cursos:", error);
        }
      };
      fetchCourses();
    } else {
      setCourses([]);
      setSelectedCourse(undefined);
    }
  }, [selectedUniversity]);

  useEffect(() => {
    if (selectedUniversity && selectedCourse) {
      const fetchClasses = async () => {
        try {
          const data = await publicApi.getClasses<AcademicEntity[]>(selectedUniversity, selectedCourse);
          setClasses(data);
        } catch (error) {
          console.error("Erro ao buscar turmas:", error);
        }
      };
      fetchClasses();
    } else {
      setClasses([]);
      setSelectedClass(undefined);
    }
  }, [selectedUniversity, selectedCourse]);

  useEffect(() => {
    if (selectedUniversity && selectedCourse) {
      const fetchDisciplines = async () => {
        try {
          const data = await publicApi.getDisciplines<AcademicEntity[]>(selectedUniversity, selectedCourse);
          setDisciplines(data);
        } catch (error) {
          console.error("Erro ao buscar disciplinas:", error);
        }
      };
      fetchDisciplines();
    } else {
      setDisciplines([]);
      setSelectedDiscipline(undefined);
    }
  }, [selectedUniversity, selectedCourse]);

  useEffect(() => {
    if (selectedUniversity && selectedCourse && selectedClass) {
      const fetchStudents = async () => {
        try {
          const data = await publicApi.getStudentsByClass<AcademicEntity[]>(
            selectedUniversity,
            selectedCourse,
            selectedClass
          );
          setStudents(data);
        } catch (error) {
          console.error("Erro ao buscar alunos:", error);
        }
      };
      fetchStudents();
    } else {
      setStudents([]);
      setSelectedStudent(undefined);
    }
  }, [selectedUniversity, selectedCourse, selectedClass]);

  useEffect(() => {
    onFilterChange({
      type: selectedType,
      universityId: selectedUniversity,
      courseId: selectedCourse,
      classId: selectedClass,
      disciplineId: selectedDiscipline,
      studentId: selectedStudent,
    });
  }, [selectedType, selectedUniversity, selectedCourse, selectedClass, selectedDiscipline, selectedStudent]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-white">Tipo de Visualização</label>
        <Select
          value={selectedType}
          onValueChange={(value: "university" | "course" | "discipline" | "class" | "student") => {
            setSelectedType(value);
            setSelectedUniversity(undefined);
            setSelectedCourse(undefined);
            setSelectedClass(undefined);
            setSelectedDiscipline(undefined);
            setSelectedStudent(undefined);
          }}
        >
          <SelectTrigger className="w-full bg-[#2a2a2a] border-neutral-700 text-white">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent className="bg-[#2a2a2a] border-neutral-700">
            <SelectItem value="university" className="text-white hover:bg-[#333333]">
              Universidade
            </SelectItem>
            <SelectItem value="course" className="text-white hover:bg-[#333333]">
              Curso
            </SelectItem>
            <SelectItem value="discipline" className="text-white hover:bg-[#333333]">
              Disciplina
            </SelectItem>
            <SelectItem value="class" className="text-white hover:bg-[#333333]">
              Turma
            </SelectItem>
            <SelectItem value="student" className="text-white hover:bg-[#333333]">
              Aluno
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white">Universidade</label>
        <Select
          value={selectedUniversity}
          onValueChange={setSelectedUniversity}
        >
          <SelectTrigger className="w-full bg-[#2a2a2a] border-neutral-700 text-white">
            <SelectValue placeholder="Selecione uma universidade" />
          </SelectTrigger>
          <SelectContent className="bg-[#2a2a2a] border-neutral-700">
            {universities.map((university) => (
              <SelectItem
                key={university._id}
                value={university._id}
                className="text-white hover:bg-[#333333]"
              >
                {university.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(selectedType === "course" || selectedType === "discipline" || selectedType === "class" || selectedType === "student") && selectedUniversity && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Curso</label>
          <Select
            value={selectedCourse}
            onValueChange={setSelectedCourse}
          >
            <SelectTrigger className="w-full bg-[#2a2a2a] border-neutral-700 text-white">
              <SelectValue placeholder="Selecione um curso" />
            </SelectTrigger>
            <SelectContent className="bg-[#2a2a2a] border-neutral-700">
              {courses.map((course) => (
                <SelectItem
                  key={course._id}
                  value={course._id}
                  className="text-white hover:bg-[#333333]"
                >
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {(selectedType === "class" || selectedType === "student") && selectedUniversity && selectedCourse && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Turma</label>
          <Select
            value={selectedClass}
            onValueChange={setSelectedClass}
          >
            <SelectTrigger className="w-full bg-[#2a2a2a] border-neutral-700 text-white">
              <SelectValue placeholder="Selecione uma turma" />
            </SelectTrigger>
            <SelectContent className="bg-[#2a2a2a] border-neutral-700">
              {classes.map((class_) => (
                <SelectItem
                  key={class_._id}
                  value={class_._id}
                  className="text-white hover:bg-[#333333]"
                >
                  {class_.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedType === "student" && selectedUniversity && selectedCourse && selectedClass && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Aluno</label>
          <Select
            value={selectedStudent}
            onValueChange={setSelectedStudent}
          >
            <SelectTrigger className="w-full bg-[#2a2a2a] border-neutral-700 text-white">
              <SelectValue placeholder="Selecione um aluno" />
            </SelectTrigger>
            <SelectContent className="bg-[#2a2a2a] border-neutral-700">
              {students.map((student) => (
                <SelectItem
                  key={student._id}
                  value={student._id}
                  className="text-white hover:bg-[#333333]"
                >
                  {student.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedType === "discipline" && selectedUniversity && selectedCourse && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Disciplina</label>
          <Select
            value={selectedDiscipline}
            onValueChange={setSelectedDiscipline}
          >
            <SelectTrigger className="w-full bg-[#2a2a2a] border-neutral-700 text-white">
              <SelectValue placeholder="Selecione uma disciplina" />
            </SelectTrigger>
            <SelectContent className="bg-[#2a2a2a] border-neutral-700">
              {disciplines.map((discipline) => (
                <SelectItem
                  key={discipline._id}
                  value={discipline._id}
                  className="text-white hover:bg-[#333333]"
                >
                  {discipline.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
} 