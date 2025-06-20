import { useState, useCallback, useEffect } from "react";
import { AcademicFilter } from "./AcademicFilter.tsx";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-Auth";
import type { LogEntityType, LogModeType } from "@/services/api/api_routes";

interface ChartFilterProps {
  onChange: (
    type: LogEntityType,
    ids: string[],
    mode: LogModeType,
    hierarchyParams?: {
      universityId?: string;
      courseId?: string;
      classId?: string;
      disciplineId?: string;
    }
  ) => void;
}

export function ChartFilter({ onChange }: ChartFilterProps) {
  const { user } = useAuth();
  if (!user) return null;

  // Extrai papéis do usuário e define flags
  const userRoles = Array.isArray(user.role) ? user.role : [user.role];
  const isAdmin = userRoles.includes("admin");
  const isCoordinator = userRoles.includes("course-coordinator");

  // Hierarquia: admin > coordinator > professor
  const userLevel = isAdmin
    ? "admin"
    : isCoordinator
      ? "coordinator"
      : "professor";

  // Define tipos de entidade permitidos por papel
  const getAllowedEntityTypes = (): LogEntityType[] => {
    if (userLevel === "admin") {
      return ["student", "class", "course", "university"];
    }
    if (userLevel === "coordinator") {
      return ["student", "class", "course"];
    }
    // Agora professor também vê disciplina
    if (userLevel === "professor") {
      return ["discipline", "class", "student"];
    }
    return ["student"];
  };
  const allowedEntityTypes = getAllowedEntityTypes();

  // Tipo inicial por papel
  const getInitialEntityType = (): LogEntityType => {
    if (userLevel === "admin") return "student";
    if (userLevel === "coordinator") return "student";
    if (userLevel === "professor") return "discipline";
    return "student";
  };

  // Estados locais
  const [entityType, setEntityType] = useState<LogEntityType>(getInitialEntityType());
  const [mode] = useState<LogModeType>("individual");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hierarchyParams, setHierarchyParams] = useState<{
    universityId?: string;
    courseId?: string;
    classId?: string;
    disciplineId?: string;
  }>({});

  // Notifica o componente pai
  const notifyParent = useCallback((
    type: LogEntityType,
    ids: string[],
    viewMode: LogModeType,
    params?: typeof hierarchyParams
  ) => {
    const validIds = ids.filter((i) => i && i.trim() !== "");
    console.log("ChartFilter - notifyParent chamado:", { type, validIds, viewMode, params });
    onChange(type, validIds, viewMode, params);
  }, [onChange]);

  // Handler para mudança de tipo de entidade
  const handleEntityTypeChange = useCallback((value: string) => {
    const newType = value as LogEntityType;
    if (!allowedEntityTypes.includes(newType)) {
      console.warn(`Tipo ${newType} não permitido para ${userLevel}`);
      return;
    }
    setEntityType(newType);
    setSelectedIds([]);
    setHierarchyParams({});
    notifyParent(newType, [], mode, {});
  }, [allowedEntityTypes, mode, notifyParent, userLevel]);

  // Recebe seleção do AcademicFilter
  const handleEntitySelection = useCallback((ids: string[], params?: typeof hierarchyParams) => {
    setSelectedIds(ids);
    if (params) setHierarchyParams(params);
    notifyParent(entityType, ids, mode, params);
  }, [entityType, mode, notifyParent]);

  // Resetar seleção em comparação quando passar de 2
  useEffect(() => {
    if (mode === "comparison" && selectedIds.length > 2) {
      setSelectedIds([]);
      notifyParent(entityType, [], mode, hierarchyParams);
    }
  }, [mode, selectedIds.length, entityType, hierarchyParams, notifyParent]);

  // Rótulos para UI
  const getEntityTypeTitle = (t: LogEntityType) => {
    switch (t) {
      case "student": return "Aluno";
      case "discipline": return "Disciplina";
      case "class": return "Turma";
      case "course": return "Curso";
      case "university": return "Universidade";
      default: return "Entidade";
    }
  };

  // Mensagem de status para comparação
  const getSelectionStatus = () => {
    if (mode !== "comparison") return null;
    if (selectedIds.length === 0) return "Selecione duas entidades para comparação";
    if (selectedIds.length === 1) return "Selecione mais uma entidade para completar a comparação";
    return "Entidades selecionadas para comparação";
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 mb-8 p-6 bg-[#1f1f1f] rounded-xl border border-white/10"
    >
      <h3 className="text-xl font-semibold text-white">Filtros</h3>

      {/* Seletor de Tipo de Entidade e Modo */}
      <div className="grid grid-cols-1 gap-6">
        {/* Tipo de Entidade */}
        <div className="space-y-3">
          <Label htmlFor="entity-type" className="font-medium text-white">
            Tipo de Entidade
          </Label>
          <Select value={entityType} onValueChange={handleEntityTypeChange}>
            <SelectTrigger className="bg-[#141414] text-white border-white/10 h-12">
              <SelectValue>{getEntityTypeTitle(entityType)}</SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-[#1f1f1f] text-white border-white/10">
              {allowedEntityTypes.includes("student") && <SelectItem value="student">Aluno</SelectItem>}
              {allowedEntityTypes.includes("discipline") && <SelectItem value="discipline">Disciplina</SelectItem>}
              {allowedEntityTypes.includes("class") && <SelectItem value="class">Turma</SelectItem>}
              {allowedEntityTypes.includes("course") && <SelectItem value="course">Curso</SelectItem>}
              {allowedEntityTypes.includes("university") && <SelectItem value="university">Universidade</SelectItem>}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filtro Acadêmico (universidade, curso, disciplina, turma) */}
      <AcademicFilter
        entityType={entityType}
        multiple={mode === "comparison"}
        onSelect={handleEntitySelection}
      />

      {/* Status da seleção para comparação */}
      {mode === "comparison" && (
        <div className={`text-sm p-3 rounded-md border ${selectedIds.length < 2
          ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
          : "text-green-400 bg-green-400/10 border-green-400/20"
          }`}>
          {getSelectionStatus()}
        </div>
      )}
    </motion.div>
  );
}
