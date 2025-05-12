import { useState, useEffect } from "react";
import { AcademicFilter } from "./AcademicFilter";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { ChartFilterState, ChartMode } from "@/@types/ChartsType";

interface Props {
  onChange: (type: ChartFilterState["type"], ids: string[], mode: ChartMode) => void;
}

export function ChartFilter({ onChange }: Props) {
  const [entityType, setEntityType] = useState<ChartFilterState["type"]>("student");
  const [mode, setMode] = useState<ChartMode>("single");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    onChange(entityType, selectedIds, mode);
  }, [entityType, selectedIds, mode]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Tipo de Entidade</Label>
          <Select value={entityType} onValueChange={(v) => setEntityType(v as ChartFilterState["type"])}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Aluno</SelectItem>
              <SelectItem value="class">Turma</SelectItem>
              <SelectItem value="course">Curso</SelectItem>
              <SelectItem value="university">Universidade</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Modo de Visualização</Label>
          <Select value={mode} onValueChange={(v) => setMode(v as ChartMode)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione o modo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Visualizar um</SelectItem>
              <SelectItem value="compare">Comparar vários</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <AcademicFilter
        entityType={entityType}
        multiple={mode === "compare"}
        onSelect={setSelectedIds}
      />
    </div>
  );
}
