import { useEffect, useState } from "react";
import { api } from "@/services/api";

interface ChartFilterProps {
  onSelect: (type: "course" | "class" | "discipline", id: string) => void;
}

interface NamedItem {
  _id: string;
  name: string;
}

function ChartFilter({ onSelect }: ChartFilterProps) {
  const [courses, setCourses] = useState<NamedItem[]>([]);
  const [classes, setClasses] = useState<NamedItem[]>([]);
  const [disciplines, setDisciplines] = useState<NamedItem[]>([]);

  const [selectedType, setSelectedType] = useState<"course" | "class" | "discipline">("course");
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    async function fetchAll() {
      try {
        const [coursesRes, classesRes, disciplinesRes] = await Promise.all([
          api.get("/public/courses"),
          api.get("/public/classes"),
          api.get("/public/disciplines"),
        ]);

        setCourses(coursesRes.data);
        setClasses(classesRes.data);
        setDisciplines(disciplinesRes.data);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      }
    }

    fetchAll();
  }, []);

  useEffect(() => {
    if (selectedId) {
      onSelect(selectedType, selectedId);
    }
  }, [selectedType, selectedId, onSelect]);

  const getOptions = (): NamedItem[] => {
    if (selectedType === "course") return courses;
    if (selectedType === "class") return classes;
    return disciplines;
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-center mb-8">
      <select
        className="bg-[#1F1F1F] text-white border border-neutral-700 rounded px-4 py-2"
        value={selectedType}
        onChange={(e) => {
          setSelectedType(e.target.value as "course" | "class" | "discipline");
          setSelectedId("");
        }}
      >
        <option value="course">Curso</option>
        <option value="class">Turma</option>
        <option value="discipline">Disciplina</option>
      </select>

      <select
        className="bg-[#1F1F1F] text-white border border-neutral-700 rounded px-4 py-2"
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
      >
        <option value="">Selecione uma opção</option>
        {getOptions().map((item) => (
          <option key={item._id} value={item._id}>
            {item.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export { ChartFilter };
