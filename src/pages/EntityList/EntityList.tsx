import { useState } from "react";
import { logger } from "@/utils/logger";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, TableProperties } from "lucide-react";
import { EntityListFilter } from "@/components/Entities/List/EntityListFilter";
import { EntityTable } from "@/components/Entities/List/EntityTable";
import { useAuth } from "@/hooks/use-Auth";
import { Typograph } from "@/components/Typograph/Typograph";
import { searchEntitiesByFilter } from "@/utils/searchEntitiesByFilter";
import type { FilterData } from "@/@types/ChartsType";
import type { ListItem } from "@/components/Entities/List/EntityTable";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/utils/toast";
import { academicApi, adminApi } from "@/services/apiClient";

type EntityType = "university" | "course" | "discipline" | "class" | "professor" | "student";

export function EntityList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentFilter, setCurrentFilter] = useState<FilterData | null>(null);
  const [entity, setEntity] = useState<EntityType>("university");
  const userRoles = Array.isArray(user?.role) ? user.role : [user?.role];
  const isAdmin = userRoles.includes("admin");
  const isCoordinator = userRoles.includes("course-coordinator");
  const userRole: "admin" | "course-coordinator" | "professor" =
    isAdmin ? "admin" : isCoordinator ? "course-coordinator" : "professor";

  const {
    data: searchResults,
    isLoading: isSearching,
    error: searchError,
    refetch: refetchSearch
  } = useQuery({
    queryKey: ['searchEntities', userRole, currentFilter],
    queryFn: async () => {
      if (!currentFilter) return { items: [], entity: "university" as EntityType };

      try {
        const result = await searchEntitiesByFilter(userRole, currentFilter);
        return result;
      } catch (error) {
        logger.error("Admin", "Erro na busca.", error);
        throw new Error("Falha ao buscar entidades");
      }
    },
    enabled: !!currentFilter,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const searchMutation = useMutation({
    mutationFn: async (filterData: FilterData) => {
      return await searchEntitiesByFilter(userRole, filterData);
    },
    onSuccess: (data) => {
      setEntity(data.entity);
      setCurrentFilter(currentFilter);
      toast.success(`${data.items.length} registros encontrados`);

      queryClient.setQueryData(['searchEntities', userRole, currentFilter], data);
    },
    onError: (error) => {
      logger.error("Admin", "Erro na busca.", error);
      toast.error("Erro ao buscar registros. Tente novamente.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (displayEntity === "professor") {
        await adminApi.deleteProfessor(id);
      } else if (displayEntity === "student") {
        await adminApi.deleteStudent(id);
      } else if (["university", "course", "class", "discipline"].includes(displayEntity)) {
        await academicApi.delete(displayEntity as any, id);
      } else {
        throw new Error(`Não é possível deletar entidade do tipo: ${displayEntity}`);
      }
      return id;
    },
    onSuccess: () => {
      toast.success("Registro deletado com sucesso!");

      queryClient.invalidateQueries({
        queryKey: ['searchEntities', userRole, currentFilter]
      });

      queryClient.invalidateQueries({ queryKey: ['academicData'] });
      queryClient.invalidateQueries({ queryKey: ['recentItems'] });

      if (currentFilter) {
        refetchSearch();
      }
    },
    onError: (error) => {
      logger.error("Admin", "Erro ao deletar.", error);
      toast.error("Erro ao deletar registro.");
    }
  });

  const handleSearch = async (filterData: FilterData) => {
    setCurrentFilter(filterData);
    searchMutation.mutate(filterData);
  };

  const handleResetList = () => {
    setCurrentFilter(null);
    setEntity("university");

    queryClient.removeQueries({
      queryKey: ['searchEntities', userRole]
    });

    toast("Lista resetada");
  };

  const handleEdit = (item: ListItem) => {
    toast(`Editando: ${item.name}`);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleRetrySearch = () => {
    if (currentFilter) {
      refetchSearch();
    }
  };

  const items = searchResults?.items || [];
  const displayEntity = searchResults?.entity || entity;

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6 text-white md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-6xl space-y-5">
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <TableProperties className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-[Poppins] text-2xl font-semibold text-white">
                  Listar entidades
                </h1>
                <p className="mt-2 font-[Poppins] text-sm leading-relaxed text-zinc-400">
                  Pesquise, visualize e gerencie registros acadêmicos do sistema.
                </p>
              </div>
            </div>
          </motion.section>

          <EntityListFilter
            onSearch={handleSearch}
            onReset={handleResetList}
          />

          {searchMutation.isPending && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4"
            >
              <p className="font-[Poppins] text-sm text-blue-300">Buscando registros...</p>
            </motion.div>
          )}

          {searchError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4"
            >
              <p className="mb-2 text-red-300">Erro ao buscar registros.</p>
              <button
                onClick={handleRetrySearch}
                className="text-sm text-red-200 underline transition-colors hover:text-red-100"
                disabled={isSearching}
              >
                {isSearching ? "Tentando novamente..." : "Tentar novamente"}
              </button>
            </motion.div>
          )}

          <AnimatePresence>
            {items.length > 0 && (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <Typograph
                    text={`${items.length} ${displayEntity}(s) encontrado(s)`}
                    colorText="text-gray-300"
                    variant="text6"
                    weight="regular"
                    fontFamily="poppins"
                  />
                </div>

                <EntityTable
                  items={items}
                  entity={displayEntity}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {currentFilter && !searchMutation.isPending && !searchError && items.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-dashed border-white/10 bg-[#1f1f1f] p-8 text-center"
            >
              <p className="mb-2 text-gray-400">Nenhum registro encontrado</p>
              <p className="text-sm text-gray-500">
                Tente ajustar os filtros de busca
              </p>
            </motion.div>
          )}

          {!currentFilter && !searchMutation.isPending && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-dashed border-white/10 bg-[#1f1f1f] p-8 text-center"
            >
              <Search className="mx-auto mb-4 h-10 w-10 text-zinc-500" />
              <p className="mb-2 text-gray-400">Use os filtros acima para buscar registros</p>
              <p className="text-sm text-gray-500">
                Selecione os critérios de busca e clique em "Buscar"
              </p>
            </motion.div>
          )}
      </div>
    </main>
  );
}
