import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { api } from "@/services/api/api";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AcademicFilterProps {
  entityType: "student" | "class" | "course" | "university";
  multiple?: boolean;
  onSelect: (ids: string[]) => void;
}

export function AcademicFilter({ entityType, multiple = false, onSelect }: AcademicFilterProps) {
  const [items, setItems] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    api.get(`/public/${entityType}s`).then((res) => {
      setItems(res.data);
    });
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
            className="w-full justify-between bg-[#141414] text-white border border-white/10"
          >
            {selectedIds.length > 0
              ? `${selectedIds.length} selecionado(s)`
              : `Selecione ${entityType}`}
            <ChevronDown className="ml-2 h-4 w-4 text-white" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0 bg-[#1f1f1f] border border-white/10">
          <Command>
            <CommandInput placeholder="Buscar..." className="text-white" />
            <CommandEmpty className="text-sm text-white/60 px-2 py-4">Nenhum encontrado.</CommandEmpty>
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
