import { useEffect, useState } from "react";
import axios from "axios";

interface Filters {
  university?: string;
  course?: string;
  discipline?: string;
  class?: string;
  professor?: string;
  student?: string;
}

interface FilterFormsProps {
  fetchData: (filters: Filters) => void;
}

export function FilterForms({ fetchData }: FilterFormsProps) {
  const [universities, setUniversities] = useState<{ _id: string; name: string }[]>([]);
  const [courses, setCourses] = useState<{ _id: string; name: string }[]>([]);
  const [disciplines, setDisciplines] = useState<{ _id: string; name: string }[]>([]);
  const [classes, setClasses] = useState<{ _id: string; name: string }[]>([]);
  const [professors, setProfessors] = useState<{ _id: string; name: string }[]>([]);
  const [students, setStudents] = useState<{ _id: string; name: string }[]>([]);

  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedProfessor, setSelectedProfessor] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  useEffect(() => {
    fetchUniversities();
  }, []);

  useEffect(() => {
    if (selectedUniversity) {
      fetchCourses();
      fetchProfessors();
    }
  }, [selectedUniversity]);

  useEffect(() => {
    if (selectedCourse) {
      fetchDisciplines();
      fetchClasses();
      fetchStudents();
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedDiscipline) fetchStudents();
  }, [selectedDiscipline]);

  const fetchUniversities = async () => {
    try {
      const { data } = await axios.get("/institutions");
      setUniversities(data);
    } catch (error) {
      console.error("Erro ao buscar universidades:", error);
    }
  };

  const fetchCourses = async () => {
    if (!selectedUniversity) return;
    try {
      const { data } = await axios.get(`/courses/${selectedUniversity}`);
      setCourses(data);
    } catch (error) {
      console.error("Erro ao buscar cursos:", error);
    }
  };

  const fetchDisciplines = async () => {
    if (!selectedCourse) return;
    try {
      const { data } = await axios.get(`/disciplines/${selectedUniversity}/${selectedCourse}`);
      setDisciplines(data);
    } catch (error) {
      console.error("Erro ao buscar disciplinas:", error);
    }
  };

  const fetchClasses = async () => {
    if (!selectedCourse) return;
    try {
      const { data } = await axios.get(`/classes/${selectedUniversity}/${selectedCourse}`);
      setClasses(data);
    } catch (error) {
      console.error("Erro ao buscar turmas:", error);
    }
  };

  const fetchProfessors = async () => {
    if (!selectedUniversity) return;
    try {
      const { data } = await axios.get(`/professors/${selectedUniversity}`);
      setProfessors(data);
    } catch (error) {
      console.error("Erro ao buscar professores:", error);
    }
  };

  const fetchStudents = async () => {
    if (selectedDiscipline) {
      try {
        const { data } = await axios.get(
          `/students/${selectedUniversity}/${selectedCourse}/${selectedDiscipline}`
        );
        setStudents(data);
      } catch (error) {
        console.error("Erro ao buscar alunos da disciplina:", error);
      }
    } else if (selectedCourse) {
      try {
        const { data } = await axios.get(`/students/${selectedUniversity}/${selectedCourse}`);
        setStudents(data);
      } catch (error) {
        console.error("Erro ao buscar alunos do curso:", error);
      }
    } else if (selectedClass) {
      try {
        const { data } = await axios.get(`/students/${selectedUniversity}/${selectedCourse}/${selectedClass}`);
        setStudents(data);
      } catch (error) {
        console.error("Erro ao buscar alunos da turma:", error);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filters: Filters = {
      university: selectedUniversity || undefined,
      course: selectedCourse || undefined,
      discipline: selectedDiscipline || undefined,
      class: selectedClass || undefined,
      professor: selectedProfessor || undefined,
      student: selectedStudent || undefined,
    };
    fetchData(filters);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Universidade */}
      <label>Universidade:</label>
      <select
        value={selectedUniversity || ""}
        onChange={(e) => {
          setSelectedUniversity(e.target.value);
          setSelectedCourse(null);
          setSelectedDiscipline(null);
          setSelectedClass(null);
          setSelectedProfessor(null);
          setSelectedStudent(null);
        }}
      >
        <option value="">Selecione...</option>
        {universities.map((uni) => (
          <option key={uni._id} value={uni._id}>
            {uni.name}
          </option>
        ))}
      </select>

      {/* Curso */}
      {selectedUniversity && (
        <>
          <label>Curso:</label>
          <select
            value={selectedCourse || ""}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setSelectedDiscipline(null);
              setSelectedClass(null);
              setSelectedStudent(null);
            }}
          >
            <option value="">Selecione...</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.name}
              </option>
            ))}
          </select>
        </>
      )}

      {/* Disciplina */}
      {selectedCourse && (
        <>
          <label>Disciplina:</label>
          <select
            value={selectedDiscipline || ""}
            onChange={(e) => {
              setSelectedDiscipline(e.target.value);
              setSelectedStudent(null);
            }}
          >
            <option value="">Selecione...</option>
            {disciplines.map((discipline) => (
              <option key={discipline._id} value={discipline._id}>
                {discipline.name}
              </option>
            ))}
          </select>
        </>
      )}

      {/* Turma */}
      {selectedCourse && (
        <>
          <label>Turma:</label>
          <select
            value={selectedClass || ""}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">Selecione...</option>
            {classes.map((classData) => (
              <option key={classData._id} value={classData._id}>
                {classData.name}
              </option>
            ))}
          </select>
        </>
      )}

      {/* Professor */}
      {selectedUniversity && (
        <>
          <label>Professor:</label>
          <select value={selectedProfessor || ""} onChange={(e) => setSelectedProfessor(e.target.value)}>
            <option value="">Selecione...</option>
            {professors.map((prof) => (
              <option key={prof._id} value={prof._id}>
                {prof.name}
              </option>
            ))}
          </select>
        </>
      )}

      {/* Aluno */}
      {selectedCourse && (
        <>
          <label>Aluno:</label>
          <select value={selectedStudent || ""} onChange={(e) => setSelectedStudent(e.target.value)}>
            <option value="">Selecione...</option>
            {students.map((student) => (
              <option key={student._id} value={student._id}>
                {student.name}
              </option>
            ))}
          </select>
        </>
      )}

      {/* Botão de Busca */}
      <button type="submit">Buscar</button>
    </form>
  );
}