import { useState, useCallback, useEffect } from "react";
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
    mode: LogModeType,
    hierarchyParams?: {
      universityId?: string,
      courseId?: string,
      classId?: string,
      disciplineId?: string
    }
  ) => void;
}

export function ChartFilter({ onChange }: ChartFilterProps) {
  const [entityType, setEntityType] = useState<LogEntityType>("student");
  const [mode, setMode] = useState<LogModeType>("individual");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hierarchyParams, setHierarchyParams] = useState<{
    universityId?: string;
    courseId?: string;
    classId?: string;
    disciplineId?: string;
  }>({});

  // Função para notificar o componente pai sobre mudanças
  const notifyParent = useCallback((
    type: LogEntityType,
    ids: string[],
    viewMode: LogModeType,
    params?: {
      universityId?: string,
      courseId?: string,
      classId?: string,
      disciplineId?: string
    }
  ) => {
    // Garantimos que os IDs são válidos antes de chamar o callback
    const validIds = ids.filter((id) => id && id.trim() !== "");
    console.log("ChartFilter - notifyParent chamado:", { type, validIds, viewMode, params });

    // Verificamos se o modo é de comparação e se temos exatamente 2 IDs válidos
    if (viewMode === "comparison" && validIds.length !== 2) {
      console.log("ChartFilter - Comparação requer exatamente 2 IDs, temos:", validIds.length);
      // Não notificamos ainda, esperamos ter 2 IDs
      if (validIds.length < 2) return;
    }

    // Adicionar um log antes de chamar onChange
    console.log("ChartFilter - Chamando função onChange");
    onChange(type, validIds, viewMode, params);
    console.log("ChartFilter - Função onChange foi chamada");
  }, [onChange]);

  const handleEntityTypeChange = useCallback((value: string) => {
    const newType = value as LogEntityType;
    console.log("ChartFilter - handleEntityTypeChange:", newType);
    setEntityType(newType);
    setSelectedIds([]);
    // Notificar o componente pai da mudança
    notifyParent(newType, [], mode, hierarchyParams);
  }, [mode, notifyParent, hierarchyParams]);

  const handleModeChange = useCallback((value: string) => {
    const newMode = value as LogModeType;
    console.log("ChartFilter - handleModeChange:", newMode);
    setMode(newMode);
    setSelectedIds([]);
    // Notificar o componente pai da mudança
    notifyParent(entityType, [], newMode, hierarchyParams);
  }, [entityType, notifyParent, hierarchyParams]);

  const handleEntitySelection = useCallback((ids: string[], hierarchyInfo?: any) => {
    // Validamos os IDs recebidos
    const validIds = ids.filter((id) => id && id.trim() !== "");
    console.log("ChartFilter - handleEntitySelection:", validIds);

    // Se recebemos informações da hierarquia, atualizamos
    if (hierarchyInfo) {
      console.log("ChartFilter - Informações de hierarquia recebidas:", hierarchyInfo);
      setHierarchyParams(hierarchyInfo);
    }

    // Verificar se a lista realmente mudou antes de atualizar e notificar
    if (JSON.stringify(selectedIds) !== JSON.stringify(validIds)) {
      setSelectedIds(validIds);

      // Se é modo de comparação, verificamos se temos exatamente 2 IDs
      if (mode === "comparison" && validIds.length === 2) {
        console.log("ChartFilter - Temos 2 IDs para comparação, notificando");
        notifyParent(entityType, validIds, mode, hierarchyInfo || hierarchyParams);
      } else if (mode === "individual") {
        // Para modo individual, notificamos com qualquer número de IDs (geralmente 1)
        notifyParent(entityType, validIds, mode, hierarchyInfo || hierarchyParams);
      }
    }
  }, [entityType, mode, notifyParent, selectedIds, hierarchyParams]);

  // Ajustar o componente quando o modo muda de individual para comparison
  useEffect(() => {
    // Se alternar de individual para comparação, limpe os IDs selecionados
    if (mode === "comparison" && selectedIds.length === 1) {
      setSelectedIds([]);
    }
  }, [mode, selectedIds]);

  // Ajustar título com base no tipo de entidade
  const getEntityTypeTitle = (type: LogEntityType) => {
    switch (type) {
      case "student": return "Aluno";
      case "class": return "Turma";
      case "course": return "Curso";
      case "university": return "Universidade";
      case "discipline": return "Disciplina";
      default: return "Entidade";
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 mb-8 p-4 bg-[#1f1f1f] rounded-xl border border-white/10"
    >
      <h3 className="text-lg font-semibold text-white">Filtros</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="entity-type" className="text-white">
            Tipo de Entidade
          </Label>
          <Select value={entityType} onValueChange={handleEntityTypeChange}>
            <SelectTrigger className="bg-[#141414] text-white border-white/10">
              <SelectValue placeholder="Selecione o tipo">
                {getEntityTypeTitle(entityType)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-[#1f1f1f] text-white border-white/10">
              <SelectItem value="student">Aluno</SelectItem>
              <SelectItem value="class">Turma</SelectItem>
              <SelectItem value="course">Curso</SelectItem>
              <SelectItem value="university">Universidade</SelectItem>
              <SelectItem value="discipline">Disciplina</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="view-mode" className="text-white">
            Modo de Visualização
          </Label>
          <Select value={mode} onValueChange={handleModeChange}>
            <SelectTrigger className="bg-[#141414] text-white border-white/10">
              <SelectValue placeholder="Selecione o modo">
                {mode === "individual" ? "Visualizar um" : "Comparar dois"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-[#1f1f1f] text-white border-white/10">
              <SelectItem value="individual">Visualizar um</SelectItem>
              <SelectItem value="comparison">Comparar dois</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <AcademicFilter
        entityType={entityType}
        multiple={mode === "comparison"}
        onSelect={handleEntitySelection}
      />

      {mode === "comparison" && (
        <div className={selectedIds.length < 2 ? "text-sm text-yellow-400 mt-1" : "text-sm text-green-400 mt-1"}>
          {selectedIds.length === 0
            ? "Selecione duas entidades para comparação"
            : selectedIds.length === 1
              ? "Selecione mais uma entidade para completar a comparação"
              : "Entidades selecionadas para comparação"}
        </div>
      )}
    </motion.div>
  );
}