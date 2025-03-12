import React, { useState, useEffect } from "react";
import axios from "axios";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";

interface ProfessorFormProps {
  onSubmit: (item: any) => void;
  initialData?: any;
}

const ProfessorForm: React.FC<ProfessorFormProps> = ({ onSubmit, initialData }) => {
  const [name, setName] = useState(initialData?.name || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [password, setPassword] = useState("");
  const [universities, setUniversities] = useState<{ _id: string; name: string }[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState(initialData?.school || "");
  const [courses, setCourses] = useState<{ _id: string; name: string }[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>(initialData?.courses || []);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    axios.get("http://localhost:3000/academic-institution/university")
      .then(response => setUniversities(response.data))
      .catch(error => console.error("Erro ao carregar universidades", error));
  }, []);

  useEffect(() => {
    if (selectedUniversity) {
      axios.get(`http://localhost:3000/academic-institution/course/${selectedUniversity}`)
        .then(response => setCourses(response.data))
        .catch(error => console.error("Erro ao carregar cursos", error));
    } else {
      setCourses([]);
      setSelectedCourses([]);
    }
  }, [selectedUniversity]);

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourses((prevSelected) =>
      prevSelected.includes(courseId)
        ? prevSelected.filter((id) => id !== courseId)
        : [...prevSelected, courseId]
    );
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:3000/users", {
        name,
        email,
        password,
        role: "professor",
        school: selectedUniversity,
        courses: selectedCourses,
      });

      setName("");
      setEmail("");
      setPassword("");
      setSelectedUniversity("");
      setSelectedCourses([]);
      setIsDropdownOpen(false);

      onSubmit(response.data);
    } catch (error) {
      console.error("Erro ao cadastrar professor:", error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <input
        type="text"
        placeholder="Nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border border-gray-300 p-2 rounded w-full bg-gray-900 text-white"
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border border-gray-300 p-2 rounded w-full bg-gray-900 text-white"
      />

      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border border-gray-300 p-2 rounded w-full bg-gray-900 text-white"
      />

      <label className="block text-white">Universidade:</label>
      <select
        value={selectedUniversity}
        onChange={(e) => setSelectedUniversity(e.target.value)}
        className="border border-gray-300 p-2 rounded w-full bg-gray-900 text-white"
      >
        <option value="">Selecione a universidade</option>
        {universities.map((uni) => (
          <option key={uni._id} value={uni._id}>{uni.name}</option>
        ))}
      </select>

      <label className="block text-white">Cursos:</label>
      <div className="relative">
        <button
          type="button"
          className="border border-gray-300 p-2 rounded w-full bg-gray-900 text-white text-left flex justify-between items-center"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          {selectedCourses.length > 0
            ? courses
              .filter((course) => selectedCourses.includes(course._id))
              .map((course) => course.name)
              .join(", ")
            : "Selecione um ou mais cursos"}
          <span className="ml-2">{isDropdownOpen ? "▲" : "▼"}</span>
        </button>

        {isDropdownOpen && (
          <div className="absolute w-full bg-gray-900 border border-gray-300 mt-1 max-h-40 overflow-auto rounded shadow-lg z-10">
            {courses.length > 0 ? (
              courses.map((course) => (
                <div
                  key={course._id}
                  className={`p-2 cursor-pointer flex items-center ${selectedCourses.includes(course._id) ? "bg-gray-700 text-white" : "hover:bg-gray-800"
                    }`}
                  onClick={() => toggleCourseSelection(course._id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedCourses.includes(course._id)}
                    className="mr-2"
                    readOnly
                  />
                  {course.name}
                </div>
              ))
            ) : (
              <p className="p-2 text-gray-400">Nenhum curso disponível</p>
            )}
          </div>
        )}
      </div>

      <ButtonCRUD action="create" onClick={handleSubmit} />
    </form>
  );
};

export { ProfessorForm };
