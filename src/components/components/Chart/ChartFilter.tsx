import { useState, useCallback } from "react";
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
import type { ChartFilterState } from "@/@types/ChartsType";
import { LogEntityType, LogModeType } from "@/services/api/api_routes";

interface ChartFilterProps {
  onChange: (
    type: LogEntityType,
    ids: string[],
    mode: LogModeType
  ) => void;
}

export function ChartFilter({ onChange }: ChartFilterProps) {
  const [entityType, setEntityType] = useState<LogEntityType>("student");
  const [mode, setMode] = useState<LogModeType>("individual");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Movemos a função notifyParent para um useCallback
  // para garantir que ela usa os valores mais recentes
  // de entityType e mode a cada chamada
  const notifyParent = useCallback((
    type: LogEntityType,
    ids: string[],
    viewMode: LogModeType
  ) => {
    // Garantimos que os IDs são válidos antes de chamar o callback
    const validIds = ids.filter((id) => id && id.trim() !== "");
    console.log("ChartFilter - notifyParent chamado:", { type, validIds, viewMode });
    onChange(type, validIds, viewMode);
  }, [onChange]); // Dependência apenas do onChange, que não deve mudar

  const handleEntityTypeChange = useCallback((value: string) => {
    const newType = value as LogEntityType;
    setEntityType(newType);
    setSelectedIds([]);
    // Usamos os valores atuais dos estados diretamente aqui
    notifyParent(newType, [], mode);
  }, [mode, notifyParent]);

  const handleModeChange = useCallback((value: string) => {
    const newMode = value as LogModeType;
    setMode(newMode);
    setSelectedIds([]);
    // Usamos os valores atuais dos estados diretamente aqui
    notifyParent(entityType, [], newMode);
  }, [entityType, notifyParent]);

  const handleEntitySelection = useCallback((ids: string[]) => {
    // Validamos os IDs recebidos
    const validIds = ids.filter((id) => id && id.trim() !== "");
    console.log("ChartFilter - handleEntitySelection:", validIds);

    setSelectedIds(validIds);
    // Chamamos notifyParent com os valores atuais
    notifyParent(entityType, validIds, mode);
  }, [entityType, mode, notifyParent]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 mb-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="entity-type" className="text-white">
            Tipo de Entidade
          </Label>
          <Select value={entityType} onValueChange={handleEntityTypeChange}>
            <SelectTrigger className="bg-[#141414] text-white border-white/10">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent className="bg-[#1f1f1f] text-white border-white/10">
              <SelectItem value="student">Aluno</SelectItem>
              <SelectItem value="class">Turma</SelectItem>
              <SelectItem value="course">Curso</SelectItem>
              <SelectItem value="university">Universidade</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="view-mode" className="text-white">
            Modo de Visualização
          </Label>
          <Select value={mode} onValueChange={handleModeChange}>
            <SelectTrigger className="bg-[#141414] text-white border-white/10">
              <SelectValue placeholder="Selecione o modo" />
            </SelectTrigger>
            <SelectContent className="bg-[#1f1f1f] text-white border-white/10">
              <SelectItem value="individual">Visualizar um</SelectItem>
              <SelectItem value="compare">Comparar vários</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <AcademicFilter
        entityType={entityType}
        multiple={mode === "compare"}
        onSelect={handleEntitySelection}
      />

      {mode === "compare" && (
        <div className="text-sm text-yellow-400 mt-1">
          {selectedIds.length < 2
            ? "Selecione pelo menos duas entidades para comparação"
            : `${selectedIds.length} entidades selecionadas para comparação`}
        </div>
      )}
    </motion.div>
  );
}