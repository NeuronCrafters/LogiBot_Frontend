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
import { useAuth } from "@/hooks/use-Auth";
import type { ChartFilterState } from "@/@types/ChartsType";
import { LogEntityType, LogModeType } from "@/services/api/api_routes";

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

  // Determinar o papel do usuário (coordenador tem prioridade sobre professor)
  const userRoles = Array.isArray(user?.role) ? user.role : [user?.role].filter(Boolean);
  const isAdmin = userRoles.includes("admin");
  const isCoordinator = userRoles.includes("course-coordinator");
  const isProfessor = userRoles.includes("professor");

  // Hierarquia: admin > coordinator > professor
  const userLevel = isAdmin ? "admin" : isCoordinator ? "coordinator" : "professor";

  // Obter tipos de entidade permitidos baseado no papel do usuário
  const getAllowedEntityTypes = (): LogEntityType[] => {
    if (userLevel === "admin") {
      return ["student", "class", "course", "university"];
    }
    if (userLevel === "coordinator") {
      return ["student", "class", "course"];
    }
    if (userLevel === "professor") {
      return ["student"];
    }
    return ["student"];
  };

  const allowedEntityTypes = getAllowedEntityTypes();

  // Definir entityType inicial baseado no papel do usuário
  const getInitialEntityType = (): LogEntityType => {
    if (userLevel === "admin") return "student";
    if (userLevel === "coordinator") return "student";
    if (userLevel === "professor") return "student";
    return "student";
  };

  const [entityType, setEntityType] = useState<LogEntityType>(getInitialEntityType());
  const [mode, setMode] = useState<LogModeType>("individual");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hierarchyParams, setHierarchyParams] = useState<{
    universityId?: string;
    courseId?: string;
    classId?: string;
    disciplineId?: string;
  }>({});

  const notifyParent = useCallback((
    type: LogEntityType,
    ids: string[],
    viewMode: LogModeType,
    params?: {
      universityId?: string;
      courseId?: string;
      classId?: string;
      disciplineId?: string;
    }
  ) => {
    const validIds = ids.filter((id) => id && id.trim() !== "");
    console.log("ChartFilter - notifyParent chamado:", { type, validIds, viewMode, params });

    // Para modo de comparação, deve ter exatamente 2 IDs
    if (viewMode === "comparison" && validIds.length !== 2) {
      console.log("ChartFilter - Comparação requer exatamente 2 IDs, temos:", validIds.length);
      // Não retorna early aqui, permite notificar com IDs vazios para reset
    }

    onChange(type, validIds, viewMode, params);
  }, [onChange]);

  const handleEntityTypeChange = useCallback((value: string) => {
    const newType = value as LogEntityType;

    // Verificar se o tipo é permitido para o usuário
    if (!allowedEntityTypes.includes(newType)) {
      console.warn(`Tipo ${newType} não permitido para o nível ${userLevel}`);
      return;
    }

    console.log("ChartFilter - handleEntityTypeChange:", newType);
    setEntityType(newType);
    setSelectedIds([]);
    setHierarchyParams({});
    // Notificar com arrays vazios para reset
    notifyParent(newType, [], mode, {});
  }, [mode, notifyParent, allowedEntityTypes, userLevel]);

  const handleModeChange = useCallback((value: string) => {
    const newMode = value as LogModeType;
    console.log("ChartFilter - handleModeChange:", newMode);
    setMode(newMode);
    setSelectedIds([]);
    // Notificar com arrays vazios para reset
    notifyParent(entityType, [], newMode, hierarchyParams);
  }, [entityType, notifyParent, hierarchyParams]);

  const handleEntitySelection = useCallback((ids: string[], hierarchyInfo?: any) => {
    const validIds = ids.filter((id) => id && id.trim() !== "");
    console.log("ChartFilter - handleEntitySelection:", validIds, hierarchyInfo);

    // Atualizar estado local
    setSelectedIds(validIds);

    if (hierarchyInfo) {
      setHierarchyParams(hierarchyInfo);
    }

    // Sempre notificar o pai, independente do número de IDs
    // O componente pai decidirá se deve processar ou não
    notifyParent(entityType, validIds, mode, hierarchyInfo || hierarchyParams);
  }, [entityType, mode, notifyParent, hierarchyParams]);

  // Resetar seleções quando o modo muda
  useEffect(() => {
    if (mode === "comparison" && selectedIds.length > 2) {
      setSelectedIds([]);
      notifyParent(entityType, [], mode, hierarchyParams);
    }
  }, [mode, selectedIds.length, entityType, hierarchyParams, notifyParent]);

  const getEntityTypeTitle = (type: LogEntityType) => {
    switch (type) {
      case "student": return "Aluno";
      case "class": return "Turma";
      case "course": return "Curso";
      case "university": return "Universidade";
      default: return "Entidade";
    }
  };

  const getModeTitle = (currentMode: LogModeType) => {
    return currentMode === "individual" ? "Visualizar um" : "Comparar dois";
  };

  const getSelectionStatus = () => {
    if (mode === "comparison") {
      if (selectedIds.length === 0) {
        return "Selecione duas entidades para comparação";
      } else if (selectedIds.length === 1) {
        return "Selecione mais uma entidade para completar a comparação";
      } else if (selectedIds.length === 2) {
        return "Entidades selecionadas para comparação";
      }
    }
    return null;
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

      {/* Indicador do nível de acesso */}
      <div className="text-xs text-white/60 bg-white/5 px-3 py-2 rounded-md border border-white/10">
        <span className="font-medium">Nível de acesso:</span> {
          userLevel === "admin" ? "Administrador (todos os tipos)" :
            userLevel === "coordinator" ? "Coordenador (aluno, turma, curso)" :
              "Professor (apenas aluno)"
        }
      </div>

      {/* Seletores de Tipo e Modo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="entity-type" className="text-white font-medium">
            Tipo de Entidade
          </Label>
          <Select value={entityType} onValueChange={handleEntityTypeChange}>
            <SelectTrigger className="bg-[#141414] text-white border-white/10 h-12 focus:border-indigo-500">
              <SelectValue placeholder="Selecione o tipo">
                {getEntityTypeTitle(entityType)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-[#1f1f1f] text-white border-white/10">
              {allowedEntityTypes.includes("student") && <SelectItem value="student">Aluno</SelectItem>}
              {allowedEntityTypes.includes("class") && <SelectItem value="class">Turma</SelectItem>}
              {allowedEntityTypes.includes("course") && <SelectItem value="course">Curso</SelectItem>}
              {allowedEntityTypes.includes("university") && <SelectItem value="university">Universidade</SelectItem>}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label htmlFor="view-mode" className="text-white font-medium">
            Modo de Visualização
          </Label>
          <Select value={mode} onValueChange={handleModeChange}>
            <SelectTrigger className="bg-[#141414] text-white border-white/10 h-12 focus:border-indigo-500">
              <SelectValue placeholder="Selecione o modo">
                {getModeTitle(mode)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-[#1f1f1f] text-white border-white/10">
              <SelectItem value="individual">Visualizar um</SelectItem>
              <SelectItem value="comparison">Comparar dois</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Componente de Filtro Acadêmico */}
      <div className="space-y-4">
        <AcademicFilter
          entityType={entityType}
          multiple={mode === "comparison"}
          onSelect={handleEntitySelection}
        />
      </div>

      {/* Status da Seleção */}
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