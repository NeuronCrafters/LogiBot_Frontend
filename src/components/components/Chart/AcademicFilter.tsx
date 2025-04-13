import { useEffect, useState, useCallback } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { ChevronDown } from "lucide-react";

interface AcademicEntity {
  _id: string;
  name: string;
}

interface AcademicFilterProps {
  onChange: (filter: {
    universityId: string | null;
    courseId: string | null;
    classId: string | null;
    disciplineId: string | null;
  }) => void;
  show?: {
    course?: boolean;
    class?: boolean;
    discipline?: boolean;
  };
}

function AcademicFilter({ onChange, show }: AcademicFilterProps) {
  const [universities, setUniversities] = useState<AcademicEntity[]>([]);
  const [courses, setCourses] = useState<AcademicEntity[]>([]);
  const [classes, setClasses] = useState<AcademicEntity[]>([]);
  const [disciplines, setDisciplines] = useState<AcademicEntity[]>([]);

  const [selectedUniversity, setSelectedUniversity] = useState<AcademicEntity | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<AcademicEntity | null>(null);
  const [selectedClass, setSelectedClass] = useState<AcademicEntity | null>(null);
  const [selectedDiscipline, setSelectedDiscipline] = useState<AcademicEntity | null>(null);

  useEffect(() => {
    api.get<AcademicEntity[]>("/public/institutions").then((res) => setUniversities(res.data));
  }, []);

  useEffect(() => {
    if (selectedUniversity) {
      api
        .get<AcademicEntity[]>(`/public/courses/${selectedUniversity._id}`)
        .then((res) => setCourses(res.data));
    } else {
      if (courses.length > 0) setCourses([]);
    }
    setSelectedCourse(null);
    setSelectedClass(null);
    setSelectedDiscipline(null);
  }, [courses.length, selectedUniversity]);

  useEffect(() => {
    if (selectedUniversity && selectedCourse) {
      api
        .get<AcademicEntity[]>(`/public/classes/${selectedUniversity._id}/${selectedCourse._id}`)
        .then((res) => setClasses(res.data));
      api
        .get<AcademicEntity[]>(`/public/disciplines/${selectedUniversity._id}/${selectedCourse._id}`)
        .then((res) => setDisciplines(res.data));
    } else {
      if (classes.length > 0) setClasses([]);
      if (disciplines.length > 0) setDisciplines([]);
    }
    setSelectedClass(null);
    setSelectedDiscipline(null);
  }, [classes.length, disciplines.length, selectedCourse, selectedUniversity]);

  useEffect(() => {
    onChange({
      universityId: selectedUniversity?._id || null,
      courseId: selectedCourse?._id || null,
      classId: selectedClass?._id || null,
      disciplineId: selectedDiscipline?._id || null,
    });
  }, [selectedUniversity, selectedCourse, selectedClass, selectedDiscipline, onChange]);

  const renderCombo = useCallback(
    (
      label: string,
      items: AcademicEntity[],
      selected: AcademicEntity | null,
      onSelect: (item: AcademicEntity) => void
    ) => {
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
    }, []
  );

  return (
    <div className="flex flex-wrap gap-4 justify-center mb-6">
      {renderCombo("Universidade", universities, selectedUniversity, setSelectedUniversity)}
      {selectedUniversity && show?.course !== false &&
        renderCombo("Curso", courses, selectedCourse, setSelectedCourse)}
      {selectedCourse && show?.class !== false &&
        renderCombo("Turma", classes, selectedClass, setSelectedClass)}
      {selectedCourse && show?.discipline !== false &&
        renderCombo("Disciplina", disciplines, selectedDiscipline, setSelectedDiscipline)}
    </div>
  );
}

export { AcademicFilter };