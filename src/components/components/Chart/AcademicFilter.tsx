import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { publicApi } from "@/services/apiClient";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AcademicFilterProps {
  entityType: "student" | "class" | "course" | "university";
  multiple?: boolean;
  onSelect: (ids: string[]) => void;
}

export function AcademicFilter({
  entityType,
  multiple = false,
  onSelect,
}: AcademicFilterProps) {
  const [items, setItems] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    let fetchData = async () => {
      try {
        let response: { id: string; name: string }[] = [];

        if (entityType === "student") {
          const students = await publicApi.getStudentsByCourse("1", "1") as { id: string; name: string }[];
          response = students;
        } else if (entityType === "class") {
          const classes = await publicApi.getClasses("1", "1") as { id: string; name: string }[];
          response = classes;
        } else if (entityType === "course") {
          const courses = await publicApi.getCourses("1") as { id: string; name: string }[];
          response = courses;
        } else if (entityType === "university") {
          const universities = await publicApi.getInstitutions() as { id: string; name: string }[];
          response = universities;
        }

        setItems(response);
      } catch (err) {
        console.error("Erro ao buscar entidades públicas:", err);
      }
    };

    fetchData();
  }, [entityType]);

  const toggleItem = (id: string) => {
    const newSelection = multiple
      ? selectedIds.includes(id)
        ? selectedIds.filter((i) => i !== id)
        : [...selectedIds, id]
      : [id];

    setSelectedIds(newSelection);
    onSelect(newSelection);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-11 justify-between bg-[#141414] text-white border border-white/10 rounded-md"
          >
            {selectedIds.length > 0
              ? `${selectedIds.length} selecionado(s)`
              : `Selecione ${entityType}`}
            <ChevronDown className="ml-2 h-4 w-4 text-white" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0 bg-[#1f1f1f] border border-white/10 rounded-md">
          <Command>
            <CommandInput
              placeholder="Buscar..."
              className="text-white placeholder:text-white/40"
            />
            <CommandEmpty className="text-sm text-white/60 px-2 py-4">
              Nenhum encontrado.
            </CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => toggleItem(item.id)}
                  className={cn(
                    "text-white hover:bg-white/5 cursor-pointer transition-colors rounded-md",
                    selectedIds.includes(item.id) && "bg-white/10"
                  )}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedIds.includes(item.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </motion.div>
  );
}
