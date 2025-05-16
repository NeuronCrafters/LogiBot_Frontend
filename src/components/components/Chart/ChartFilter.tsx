import { useState, useEffect } from "react";
import { AcademicFilter } from "./AcademicFilter";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
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
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="p-4 rounded-xl bg-[#1f1f1f] border border-white/10 shadow-lg space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-white text-sm">Tipo de Entidade</Label>
          <Select value={entityType} onValueChange={(v) => setEntityType(v as ChartFilterState["type"])}>
            <SelectTrigger className="w-full bg-[#141414] text-white border border-white/10 rounded-md h-11">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent className="bg-[#1f1f1f] text-white border border-white/10 rounded-md">
              <SelectItem value="student">Aluno</SelectItem>
              <SelectItem value="class">Turma</SelectItem>
              <SelectItem value="course">Curso</SelectItem>
              <SelectItem value="university">Universidade</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-white text-sm">Modo de Visualização</Label>
          <Select value={mode} onValueChange={(v) => setMode(v as ChartMode)}>
            <SelectTrigger className="w-full bg-[#141414] text-white border border-white/10 rounded-md h-11">
              <SelectValue placeholder="Selecione o modo" />
            </SelectTrigger>
            <SelectContent className="bg-[#1f1f1f] text-white border border-white/10 rounded-md">
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
    </motion.div>
  );
}
