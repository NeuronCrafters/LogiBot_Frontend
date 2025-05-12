import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { api } from "@/services/api/api";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
    let newSelection = multiple
      ? selectedIds.includes(id)
        ? selectedIds.filter((i) => i !== id)
        : [...selectedIds, id]
      : [id];

    setSelectedIds(newSelection);
    onSelect(newSelection);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {selectedIds.length > 0
            ? `${selectedIds.length} selecionado(s)`
            : `Selecione ${entityType}`}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar..." />
          <CommandEmpty>Nenhum encontrado.</CommandEmpty>
          <CommandGroup>
            {items.map((item) => (
              <CommandItem key={item.id} onSelect={() => toggleItem(item.id)}>
                <Check
                  className={cn("mr-2 h-4 w-4", selectedIds.includes(item.id) ? "opacity-100" : "opacity-0")}
                />
                {item.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
