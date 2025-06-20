import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TableProperties } from "lucide-react";
import { FormsFilter } from "@/components/components/Forms/Lists/FormsFilter";
import { FormsList } from "@/components/components/Forms/Lists/FormsList";
import { useAuth } from "@/hooks/use-Auth";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { Header } from "@/components/components/Header/Header";
import { Avatar } from "@/components/components/Avatar/Avatar";
import { Button } from "@/components/ui/button";
import { searchEntitiesByFilter } from "@/utils/searchEntitiesByFilter";
import type { FilterData } from "@/@types/ChartsType";
import type { ListItem } from "@/components/components/Forms/Lists/FormsList";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { academicApi, adminApi } from "@/services/apiClient";

type EntityType = "university" | "course" | "discipline" | "class" | "professor" | "student";

export function List() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Estados locais
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<FilterData | null>(null);
  const [entity, setEntity] = useState<EntityType>("university");

  // Determinar role do usuário
  const userRoles = Array.isArray(user?.role) ? user.role : [user?.role];
  const isAdmin = userRoles.includes("admin");
  const isCoordinator = userRoles.includes("course-coordinator");
  //   const isProfessor = userRoles.includes("professor");

  const userRole: "admin" | "course-coordinator" | "professor" =
    isAdmin ? "admin" : isCoordinator ? "course-coordinator" : "professor";

  // Query para buscar entidades com cache
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
        console.error("Erro na busca:", error);
        throw new Error("Falha ao buscar entidades");
      }
    },
    enabled: !!currentFilter, // Só executa quando há filtro
    staleTime: 3 * 60 * 1000,  // 3 minutos
    gcTime: 10 * 60 * 1000,    // 10 minutos
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Mutation para busca (para ter controle sobre loading)
  const searchMutation = useMutation({
    mutationFn: async (filterData: FilterData) => {
      return await searchEntitiesByFilter(userRole, filterData);
    },
    onSuccess: (data) => {
      setEntity(data.entity);
      setCurrentFilter(currentFilter); // Atualizar filtro atual para trigger da query
      toast.success(`${data.items.length} registros encontrados`);

      // Atualizar cache da query
      queryClient.setQueryData(['searchEntities', userRole, currentFilter], data);
    },
    onError: (error) => {
      console.error("Erro na busca:", error);
      toast.error("Erro ao buscar registros. Tente novamente.");
    }
  });

  // Mutation para deletar itens
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

      // Invalidar cache de busca para atualizar a lista
      queryClient.invalidateQueries({
        queryKey: ['searchEntities', userRole, currentFilter]
      });

      // Invalidar outros caches relacionados
      queryClient.invalidateQueries({ queryKey: ['academicData'] });
      queryClient.invalidateQueries({ queryKey: ['recentItems'] });

      // Refetch da busca atual para atualizar a lista
      if (currentFilter) {
        refetchSearch();
      }
    },
    onError: (error) => {
      console.error("Erro ao deletar:", error);
      toast.error("Erro ao deletar registro.");
    }
  });

  // Handlers
  const handleSearch = async (filterData: FilterData) => {
    setCurrentFilter(filterData);
    searchMutation.mutate(filterData);
  };

  const handleResetList = () => {
    setCurrentFilter(null);
    setEntity("university");

    // Limpar cache de busca
    queryClient.removeQueries({
      queryKey: ['searchEntities', userRole]
    });

    toast("Lista resetada");
  };

  const handleEdit = (item: ListItem) => {
    toast(`Editando: ${item.name}`);
    // Implementar lógica de edição
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  // Retry manual da busca
  const handleRetrySearch = () => {
    if (currentFilter) {
      refetchSearch();
    }
  };

  // Dados para exibir
  const items = searchResults?.items || [];
  const displayEntity = searchResults?.entity || entity;

  return (
    <main className="min-h-screen bg-[#141414] text-white">
      {/* Topbar */}
      <div className="absolute bg-[#141414] w-full flex items-center gap-4 border-b border-neutral-800 px-8 py-4 z-10">
        <Typograph
          text="Listagem"
          colorText="text-white"
          variant="text2"
          weight="bold"
          fontFamily="poppins"
        />

        {user && (
          <div className="ml-auto">
            <Button
              onClick={() => setMenuOpen(true)}
              className="flex items-center justify-center p-0"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full rainbow-avatar sm:w-12 sm:h-12 md:w-14 md:h-14">
                <Avatar
                  seed={user._id}
                  backgroundColor="#141414"
                  className="w-full h-full rounded-full"
                />
              </div>
            </Button>
          </div>
        )}
      </div>

      {/* Menu Lateral */}
      <Header isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />

      {/* Conteúdo Central */}
      <div className="flex justify-center w-full px-4 pt-24 sm:px-6 lg:px-8">
        <div className="w-full max-w-screen-md">
          <div className="flex items-center gap-3 mb-6">
            <TableProperties className="text-3xl text-white" />
            <Typograph
              text="Listagem de Entidades do Sistema"
              colorText="text-white"
              variant="text1"
              weight="bold"
              fontFamily="poppins"
            />
          </div>

          {/* Filtros de Busca */}
          <FormsFilter
            onSearch={handleSearch}
            onReset={handleResetList}
          />

          {/* Estados de Loading e Error */}
          {searchMutation.isPending && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 mt-6 border rounded-lg bg-blue-600/20 border-blue-600/50"
            >
              <p className="text-blue-300">Buscando registros...</p>
            </motion.div>
          )}

          {searchError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 mt-6 border rounded-lg bg-red-600/20 border-red-600/50"
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

          {/* Lista de Resultados */}
          <AnimatePresence>
            {items.length > 0 && (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="mt-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <Typograph
                    text={`${items.length} ${displayEntity}(s) encontrado(s)`}
                    colorText="text-gray-300"
                    variant="text6"
                    weight="regular"
                    fontFamily="poppins"
                  />
                </div>

                <FormsList
                  items={items}
                  entity={displayEntity}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Estado vazio após busca */}
          {currentFilter && !searchMutation.isPending && !searchError && items.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-6 bg-[#1f1f1f] border border-white/10 rounded-lg text-center"
            >
              <p className="mb-2 text-gray-400">Nenhum registro encontrado</p>
              <p className="text-sm text-gray-500">
                Tente ajustar os filtros de busca
              </p>
            </motion.div>
          )}

          {/* Estado inicial - sem busca */}
          {!currentFilter && !searchMutation.isPending && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-8 bg-[#1f1f1f] border border-white/10 rounded-lg text-center"
            >
              <TableProperties className="mx-auto mb-4 text-4xl text-gray-500" />
              <p className="mb-2 text-gray-400">Use os filtros acima para buscar registros</p>
              <p className="text-sm text-gray-500">
                Selecione os critérios de busca e clique em "Buscar"
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}