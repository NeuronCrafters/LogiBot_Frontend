import { useEffect, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { ChevronDown } from "lucide-react";

interface NamedItem {
  _id: string;
  name: string;
}

interface AcademicFilterComboboxProps {
  onFilterChange: (filter: {
    universityId: string | null;
    courseId: string | null;
    classId: string | null;
    disciplineId: string | null;
  }) => void;
}

function AcademicFilter({ onFilterChange }: AcademicFilterComboboxProps) {
  const [universities, setUniversities] = useState<NamedItem[]>([]);
  const [courses, setCourses] = useState<NamedItem[]>([]);
  const [classes, setClasses] = useState<NamedItem[]>([]);
  const [disciplines, setDisciplines] = useState<NamedItem[]>([]);

  const [selectedUniversity, setSelectedUniversity] = useState<NamedItem | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<NamedItem | null>(null);
  const [selectedClass, setSelectedClass] = useState<NamedItem | null>(null);
  const [selectedDiscipline, setSelectedDiscipline] = useState<NamedItem | null>(null);

  useEffect(() => {
    api.get("/public/institutions").then((res) => setUniversities(res.data));
  }, []);

  useEffect(() => {
    if (selectedUniversity) {
      api.get(`/public/courses/${selectedUniversity._id}`).then((res) => setCourses(res.data));
    } else {
      setCourses([]);
    }
    setSelectedCourse(null);
    setSelectedClass(null);
    setSelectedDiscipline(null);
  }, [selectedUniversity]);

  useEffect(() => {
    if (selectedUniversity && selectedCourse) {
      api.get(`/public/classes/${selectedUniversity._id}/${selectedCourse._id}`).then((res) => setClasses(res.data));
      api.get(`/public/disciplines/${selectedUniversity._id}/${selectedCourse._id}`).then((res) =>
        setDisciplines(res.data)
      );
    } else {
      setClasses([]);
      setDisciplines([]);
    }
    setSelectedClass(null);
    setSelectedDiscipline(null);
  }, [selectedCourse, selectedUniversity]);

  useEffect(() => {
    onFilterChange({
      universityId: selectedUniversity?._id || null,
      courseId: selectedCourse?._id || null,
      classId: selectedClass?._id || null,
      disciplineId: selectedDiscipline?._id || null,
    });
  }, [selectedUniversity, selectedCourse, selectedClass, selectedDiscipline, onFilterChange]);

  function renderCombo(
    label: string,
    items: NamedItem[],
    selected: NamedItem | null,
    onSelect: (item: NamedItem) => void
  ) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-[250px] justify-between bg-[#1f1f1f] border-white text-white hover:bg-[#2a2a2a]"
          >
            {selected ? selected.name : `Selecionar ${label}`}
            <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] bg-[#1f1f1f] border border-neutral-700 p-0 text-white">
          <Command className="text-white">
            <CommandInput
              placeholder={`Buscar ${label.toLowerCase()}`}
              className="placeholder:text-gray-400 text-white"
            />
            <CommandEmpty>Nenhum {label} encontrado</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item._id}
                  onSelect={() => onSelect(item)}
                  className="hover:bg-[#2a2a2a] text-white cursor-pointer"
                >
                  {item.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="flex flex-wrap gap-4 justify-center mb-6">
      {renderCombo("Universidade", universities, selectedUniversity, setSelectedUniversity)}
      {selectedUniversity && renderCombo("Curso", courses, selectedCourse, setSelectedCourse)}
      {selectedCourse && renderCombo("Turma", classes, selectedClass, setSelectedClass)}
      {selectedCourse && renderCombo("Disciplina", disciplines, selectedDiscipline, setSelectedDiscipline)}
    </div>
  );
}

export { AcademicFilter };
