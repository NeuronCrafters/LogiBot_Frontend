import { useState } from "react";
import { logger } from "@/shared/lib/logger";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, FolderSearch, RefreshCw, SearchX, SlidersHorizontal, TableProperties } from "lucide-react";
import { EntityListFilter } from "@/features/admin/components/list/EntityListFilter";
import { EntityTable } from "@/features/admin/components/list/EntityTable";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { searchEntitiesByFilter } from "@/features/admin/lib/searchEntitiesByFilter";
import type { FilterData } from "@/features/dashboard/filterTypes";
import type { ListItem } from "@/features/admin/components/list/EntityTable";
import { toast } from "@/shared/lib/toast";
import { academicApi, adminApi } from "@/services/apiClient";

type EntityType = "university" | "course" | "discipline" | "class" | "professor" | "student";

const ENTITY_LABEL: Record<string, string> = { university: "universidade", course: "curso", discipline: "disciplina", class: "turma", professor: "professor", student: "aluno" };

export function EntityList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentFilter, setCurrentFilter] = useState<FilterData | null>(null);
  const [entity, setEntity] = useState<EntityType>("university");

  const userRoles = Array.isArray(user?.role) ? user.role : [user?.role];
  const isAdmin = userRoles.includes("admin");
  const isCoordinator = userRoles.includes("course-coordinator");
  const userRole: "admin" | "course-coordinator" | "professor" = isAdmin ? "admin" : isCoordinator ? "course-coordinator" : "professor";

  const { data: searchResults, isLoading: isSearching, error: searchError, refetch: refetchSearch } = useQuery({
    queryKey: ["searchEntities", userRole, currentFilter],
    queryFn: async () => {
      if (!currentFilter) return { items: [], entity: "university" as EntityType };
      try { return await searchEntitiesByFilter(userRole, currentFilter); }
      catch (error) { logger.error("Admin", "Erro na busca.", error); throw new Error("Falha ao buscar entidades"); }
    },
    enabled: !!currentFilter,
    staleTime: 3 * 60 * 1000, gcTime: 10 * 60 * 1000, retry: 2, retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
  });

  const searchMutation = useMutation({
    mutationFn: (filterData: FilterData) => searchEntitiesByFilter(userRole, filterData),
    onSuccess: (data) => {
      setEntity(data.entity);
      queryClient.setQueryData(["searchEntities", userRole, currentFilter], data);
      if (data.items.length === 0) toast("Nenhum resultado encontrado para os filtros selecionados.");
      else toast.success(`${data.items.length} ${ENTITY_LABEL[data.entity] ?? "registro"}(s) encontrado(s).`);
    },
    onError: (error) => { logger.error("Admin", "Erro na busca.", error); toast.error("Erro ao buscar registros. Tente novamente."); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (displayEntity === "professor") await adminApi.deleteProfessor(id);
      else if (displayEntity === "student") await adminApi.deleteStudent(id);
      else if (["university", "course", "class", "discipline"].includes(displayEntity)) await academicApi.delete(displayEntity as any, id);
      else throw new Error(`Não é possível deletar: ${displayEntity}`);
      return id;
    },
    onSuccess: () => { toast.success("Registro excluído com sucesso."); queryClient.invalidateQueries({ queryKey: ["searchEntities", userRole, currentFilter] }); queryClient.invalidateQueries({ queryKey: ["academicData"] }); queryClient.invalidateQueries({ queryKey: ["recentItems"] }); if (currentFilter) refetchSearch(); },
    onError: (error) => { logger.error("Admin", "Erro ao deletar.", error); toast.error("Erro ao excluir registro."); },
  });

  const handleSearch = (filterData: FilterData) => { setCurrentFilter(filterData); searchMutation.mutate(filterData); };
  const handleResetList = () => { setCurrentFilter(null); setEntity("university"); queryClient.removeQueries({ queryKey: ["searchEntities", userRole] }); };
  const handleEdit = (item: ListItem) => toast(`Editando: ${item.name}`);
  const handleDelete = (id: string) => deleteMutation.mutate(id);

  const items = searchResults?.items ?? [];
  const displayEntity = searchResults?.entity ?? entity;
  const isLoading = searchMutation.isPending || isSearching;

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6 text-white md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <section className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400"><TableProperties className="h-5 w-5" /></div>
              <div>
                <h1 className="font-[Poppins] text-2xl font-semibold text-white">Listar entidades</h1>
                <p className="mt-1 font-[Poppins] text-sm text-zinc-400">Pesquise, visualize e gerencie registros acadêmicos do sistema.</p>
              </div>
            </div>
            {items.length > 0 && !isLoading && (
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-neutral-950/60 px-4 py-2 font-[Poppins] text-sm text-zinc-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {items.length} {ENTITY_LABEL[displayEntity] ?? "registro"}{items.length !== 1 ? "s" : ""} encontrado{items.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </section>

        <EntityListFilter onSearch={handleSearch} onReset={handleResetList} />

        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-[#1f1f1f] py-16">
            <div className="relative"><div className="h-12 w-12 animate-spin rounded-full border-4 border-white/5 border-t-blue-500" /></div>
            <div className="text-center"><p className="font-[Poppins] text-sm font-medium text-white">Buscando registros...</p><p className="mt-1 font-[Poppins] text-xs text-zinc-600">Isso pode levar alguns segundos</p></div>
          </div>
        )}

        {searchError && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 py-14">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400"><AlertCircle className="h-6 w-6" /></div>
            <div className="text-center"><p className="font-[Poppins] text-sm font-semibold text-white">Erro ao buscar registros</p><p className="mt-1 font-[Poppins] text-xs text-zinc-500">Verifique sua conexão e tente novamente.</p></div>
            <button onClick={() => refetchSearch()} disabled={isSearching} className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 font-[Poppins] text-sm text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 ${isSearching ? "animate-spin" : ""}`} />Tentar novamente
            </button>
          </div>
        )}

        {!isLoading && !searchError && items.length > 0 && <EntityTable items={items} entity={displayEntity} onEdit={handleEdit} onDelete={handleDelete} />}

        {!isLoading && !searchError && currentFilter && items.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/10 bg-[#1f1f1f] py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-neutral-950/60 text-zinc-600"><SearchX className="h-6 w-6" /></div>
            <div className="text-center"><p className="font-[Poppins] text-sm font-semibold text-white">Nenhum resultado encontrado</p><p className="mt-1 font-[Poppins] text-xs text-zinc-500">Tente ajustar os filtros de busca.</p></div>
            <button onClick={handleResetList} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-[Poppins] text-sm text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"><RefreshCw className="h-3.5 w-3.5" />Limpar filtros</button>
          </div>
        )}

        {!isLoading && !currentFilter && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/10 bg-[#1f1f1f] py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-neutral-950/60 text-zinc-700"><FolderSearch className="h-7 w-7" /></div>
            <div className="text-center"><p className="font-[Poppins] text-sm font-semibold text-white">Pronto para buscar</p><p className="mt-1 max-w-xs font-[Poppins] text-xs leading-relaxed text-zinc-500">Configure os filtros acima e clique em <span className="text-zinc-400">Buscar</span> para listar os registros do sistema.</p></div>
            <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-neutral-950/40 px-4 py-2.5"><SlidersHorizontal className="h-3.5 w-3.5 text-zinc-600" /><span className="font-[Poppins] text-xs text-zinc-600">Tipo de filtro → Selecionar → Buscar</span></div>
          </div>
        )}
      </div>
    </main>
  );
}
