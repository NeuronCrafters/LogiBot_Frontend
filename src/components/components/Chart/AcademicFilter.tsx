import { useEffect, useState } from "react";
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
import { ChevronDown } from "lucide-react";
import { publicApi } from "@/services/apiClient";
import { ChartType } from "@/@types/ChartsType";

interface AcademicEntity {
  _id: string;
  name: string;
}

interface AcademicFilterProps {
  chartType: ChartType;
  setChartType: (type: ChartType) => void;
  onFilterChange: (filter: {
    universityId: string | null;
    courseId: string | null;
    classId: string | null;
    disciplineId: string | null;
    studentId: string | null;
  }) => void;
}

const entityOptions: { label: string; value: ChartType }[] = [
  { label: "Universidade", value: "university" },
  { label: "Curso", value: "course" },
  { label: "Turma", value: "class" },
  { label: "Disciplina", value: "discipline" },
  { label: "Aluno", value: "student" },
];

export function AcademicFilter({ chartType, setChartType, onFilterChange }: AcademicFilterProps) {
  const [universities, setUniversities] = useState<AcademicEntity[]>([]);
  const [courses, setCourses] = useState<AcademicEntity[]>([]);
  const [classes, setClasses] = useState<AcademicEntity[]>([]);
  const [students, setStudents] = useState<AcademicEntity[]>([]);

  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  const [openSelect, setOpenSelect] = useState({
    entity: false,
    university: false,
    course: false,
    class: false,
    student: false,
  });

  const fetchUniversities = async () => {
    try {
      const data = await publicApi.getInstitutions<AcademicEntity[]>();
      setUniversities(data);
    } catch (error) {
      console.error("Erro ao buscar universidades:", error);
    }
  };

  useEffect(() => {
    fetchUniversities();
  }, []);

  useEffect(() => {
    if (selectedUniversity) {
      publicApi.getCourses<AcademicEntity[]>(selectedUniversity).then(setCourses).catch(console.error);
    } else {
      setCourses([]);
    }
  }, [selectedUniversity]);

  useEffect(() => {
    if (selectedUniversity && selectedCourse) {
      publicApi.getClasses<AcademicEntity[]>(selectedUniversity, selectedCourse).then(setClasses).catch(console.error);
    } else {
      setClasses([]);
    }
  }, [selectedUniversity, selectedCourse]);

  useEffect(() => {
    if (selectedUniversity && selectedCourse && selectedClass) {
      publicApi.getStudentsByClass<AcademicEntity[]>(selectedUniversity, selectedCourse, selectedClass).then(setStudents).catch(console.error);
    } else {
      setStudents([]);
    }
  }, [selectedUniversity, selectedCourse, selectedClass]);

  useEffect(() => {
    onFilterChange({
      universityId: selectedUniversity,
      courseId: selectedCourse,
      classId: selectedClass,
      disciplineId: null,
      studentId: selectedStudent,
    });
  }, [selectedUniversity, selectedCourse, selectedClass, selectedStudent]);

  const renderSelect = (
    label: string,
    openKey: keyof typeof openSelect,
    items: AcademicEntity[] | { _id: ChartType; name: string }[],
    selectedId: string | ChartType | null,
    setSelectedId: (id: string) => void
  ) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-white">{label}</label>
      <Popover open={openSelect[openKey]} onOpenChange={(open) => setOpenSelect({ ...openSelect, [openKey]: open })}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between bg-[#2a2a2a] border-neutral-700 text-white hover:bg-[#333333]"
          >
            {selectedId
              ? items.find((item) => item._id === selectedId)?.name || "Selecionado"
              : `Selecione ${label.toLowerCase()}`}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-[#2a2a2a] border-neutral-700">
          <Command>
            <CommandInput placeholder={`Buscar ${label.toLowerCase()}...`} className="text-white" />
            <CommandEmpty className="text-white">Nenhum encontrado.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item._id}
                  value={item._id}
                  onSelect={() => {
                    setSelectedId(item._id);
                    setOpenSelect({ ...openSelect, [openKey]: false });
                  }}
                  className="text-white hover:bg-[#333333]"
                >
                  {item.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <div className="space-y-4">
      {renderSelect(
        "Tipo de Visualização",
        "entity",
        entityOptions.map((e) => ({ _id: e.value, name: e.label })),
        chartType,
        (id) => {
          setChartType(id as ChartType);
          setSelectedUniversity(null);
          setSelectedCourse(null);
          setSelectedClass(null);
          setSelectedStudent(null);
        }
      )}

      {chartType && renderSelect("Universidade", "university", universities, selectedUniversity, setSelectedUniversity)}

      {(chartType === "course" || chartType === "class" || chartType === "student") && selectedUniversity &&
        renderSelect("Curso", "course", courses, selectedCourse, setSelectedCourse)}

      {(chartType === "class" || chartType === "student") && selectedCourse &&
        renderSelect("Turma", "class", classes, selectedClass, setSelectedClass)}

      {chartType === "student" && selectedClass &&
        renderSelect("Aluno", "student", students, selectedStudent, setSelectedStudent)}
    </div>
  );
}
