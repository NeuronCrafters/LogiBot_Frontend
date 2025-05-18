import { useState, useEffect, useCallback, useRef } from "react";
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
import { debounce } from "@/utils/debounce";

interface ChartFilterProps {
  onChange: (
    type: LogEntityType,
    ids: string[],
    mode: LogModeType
  ) => void;
}

export function ChartFilter({ onChange }: ChartFilterProps) {
  const [entityType, setEntityType] =
    useState<LogEntityType>("student");
  const [mode, setMode] = useState<LogModeType>("individual");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Flag para evitar chamadas durante a montagem inicial
  const initialMountRef = useRef(true);
  const isFilterChangingRef = useRef(false);

  // Versão com debounce da função de callback
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedOnChange = useCallback(
    debounce((type: LogEntityType, ids: string[], mode: LogModeType) => {
      if (isFilterChangingRef.current) return;

      onChange(type, ids, mode);
      isFilterChangingRef.current = false;
    }, 250),
    [onChange]
  );

  // Disparar alterações do filtro para o pai
  useEffect(() => {
    // Pular a execução na montagem inicial
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return;
    }

    // Verificar se temos IDs válidos antes de disparar a alteração
    const hasValidIds = selectedIds.length > 0 && selectedIds.every(id => id && id.trim() !== '');

    // Se tivermos IDs válidos, disparar a alteração com debounce
    if (hasValidIds) {
      debouncedOnChange(entityType, selectedIds, mode);
    } else {
      // Se não tivermos IDs válidos, disparar a alteração imediatamente
      // com um array vazio para limpar quaisquer gráficos existentes
      onChange(entityType, [], mode);
    }
  }, [entityType, selectedIds, mode, onChange, debouncedOnChange]);

  // Verificar se o componente está desmontado antes de atualizar estados
  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Handler para mudança de tipo de entidade
  const handleEntityTypeChange = useCallback((value: string) => {
    if (!isMounted.current) return;

    isFilterChangingRef.current = true;
    const newType = value as LogEntityType;
    setEntityType(newType);

    // Limpar a seleção quando mudamos o tipo
    setSelectedIds([]);
  }, []);

  // Handler para mudança de modo de visualização
  const handleModeChange = useCallback((value: string) => {
    if (!isMounted.current) return;

    isFilterChangingRef.current = true;
    const newMode = value as LogModeType;
    setMode(newMode);

    // Limpar a seleção quando mudamos o modo
    // para evitar problemas de compatibilidade
    setSelectedIds([]);
  }, []);

  // Handler para seleção de entidades do AcademicFilter
  const handleEntitySelection = useCallback((ids: string[]) => {
    if (!isMounted.current) return;

    // Verificar se a seleção realmente mudou
    if (JSON.stringify(ids) !== JSON.stringify(selectedIds)) {
      setSelectedIds(ids);
    }
  }, [selectedIds]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 mb-8"
    >
      {/* Seletor de tipo e modo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="entity-type" className="text-white">
            Tipo de Entidade
          </Label>
          <Select
            value={entityType}
            onValueChange={handleEntityTypeChange}
          >
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

      {/* Filtros contextuais e encadeados */}
      <AcademicFilter
        entityType={entityType}
        multiple={mode === "compare"}
        onSelect={handleEntitySelection}
      />

      {/* Indicador de modo selecionado */}
      {mode === "compare" && (
        <div className="text-sm text-yellow-400 mt-1">
          {selectedIds.length < 2 ? (
            "Selecione pelo menos duas entidades para comparação"
          ) : (
            `${selectedIds.length} entidades selecionadas para comparação`
          )}
        </div>
      )}
    </motion.div>
  );
}