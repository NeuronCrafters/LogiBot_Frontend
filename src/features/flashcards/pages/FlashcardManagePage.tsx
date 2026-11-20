import { useId, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { t, useLocale } from "@/i18n";
import { EmptyState, PageHeader, Panel } from "@/components/AppUI";
import { AppModal } from "@/shared/components/feedback/AppModal";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { apiError } from "@/shared/lib/apiError";
import { toast } from "@/shared/lib/toast";
import { useManagedDisciplines } from "@/features/questions/hooks/useManagedDisciplines";
import { flashcardsApi, type DeckSummary } from "@/features/flashcards/api/flashcardsApi";
import { isStudentOnly } from "@/features/flashcards/lib/roles";

const selectClass = "h-12 w-full rounded-xl border border-control bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white";
const button = "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border px-3 font-[Poppins] text-sm font-semibold transition-colors md:min-h-9";

/** Staff: decks of their subjects, with how many cards and whether students already see them. */
export function FlashcardManagePage() {
  useLocale();
  const id = useId();
  const { user } = useAuth() ?? {};
  const queryClient = useQueryClient();
  const { disciplines } = useManagedDisciplines();
  const [disciplineId, setDisciplineId] = useState("");
  const [removing, setRemoving] = useState<DeckSummary | null>(null);
  const staff = !!user && !isStudentOnly(user.role);
  const decks = useQuery({ queryKey: ["flashcardDecks", disciplineId], queryFn: () => flashcardsApi.decks(disciplineId), enabled: staff });
  const remove = useMutation({
    mutationFn: (deckId: string) => flashcardsApi.remove(deckId),
    onSuccess: () => { toast.success(t("flashcards.manage.removed")); setRemoving(null); void queryClient.invalidateQueries({ queryKey: ["flashcardDecks"] }); },
    onError: (error) => toast.error(apiError(error)),
  });
  if (user && !staff) return <Navigate to="/flashcards" replace />;

  return (
    <main className="relative flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-5xl space-y-5 font-[Poppins]">
        <PageHeader icon={<Layers aria-hidden="true" className="h-5 w-5" />} title={t("flashcards.manage.title")} description={t("flashcards.manage.description")}
          action={(
            <Link to="/flashcards/manage/new" className={`${button} border-blue-400/40 bg-blue-600 px-4 text-on-accent hover:bg-blue-700`}>
              <Plus aria-hidden="true" className="h-4 w-4" />{t("flashcards.manage.new")}
            </Link>
          )} />
        <Panel>
          <label htmlFor={`${id}-discipline`} className="mb-1.5 block text-sm font-medium text-zinc-300">{t("questions.filterDiscipline")}</label>
          <select id={`${id}-discipline`} value={disciplineId} onChange={(event) => setDisciplineId(event.target.value)} className={selectClass}>
            <option value="">{t("questions.allDisciplines")}</option>
            {disciplines.map((discipline) => <option key={discipline.id} value={discipline.id}>{discipline.name}</option>)}
          </select>
        </Panel>
        {decks.isError ? (
          <p role="alert" className="text-sm text-red-300">{apiError(decks.error)}</p>
        ) : !decks.isLoading && !decks.data?.length ? (
          <EmptyState icon={<Layers aria-hidden="true" className="h-6 w-6" />} title={t("flashcards.manage.emptyTitle")} description={t("flashcards.manage.emptyDescription")} />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2" aria-busy={decks.isLoading || undefined}>
            {(decks.data ?? []).map((deck) => (
              <li key={deck.id}>
                <article aria-labelledby={`${id}-${deck.id}`} className="flex h-full flex-col gap-2 rounded-2xl border border-white/10 bg-surface p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={deck.published ? "rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-0.5 font-semibold text-emerald-200" : "rounded-full border border-white/15 px-2.5 py-0.5 text-zinc-300"}>
                      {deck.published ? t("flashcards.manage.published") : t("flashcards.manage.draft")}
                    </span>
                    <span className="text-zinc-400">{deck.disciplineName}</span>
                  </div>
                  <h2 id={`${id}-${deck.id}`} lang={deck.language} className="text-base font-semibold text-white">{deck.title}</h2>
                  <p className="text-sm text-zinc-400">{t("flashcards.manage.cards", { count: deck.cards })}</p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-1">
                    <Link to={`/flashcards/manage/${deck.id}/edit`} className={`${button} border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10`}>
                      <Pencil aria-hidden="true" className="h-4 w-4" />{t("questions.edit")}<span className="sr-only">: {deck.title}</span>
                    </Link>
                    <button type="button" onClick={() => setRemoving(deck)} className={`${button} border-white/10 bg-white/5 text-red-300 hover:bg-white/10`}>
                      <Trash2 aria-hidden="true" className="h-4 w-4" />{t("questions.remove")}<span className="sr-only">: {deck.title}</span>
                    </button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
      <AppModal isOpen={!!removing} type="delete" title={t("flashcards.manage.removeTitle")} description={t("flashcards.manage.removeDescription", { title: removing?.title ?? "" })}
        acceptLabel={t("questions.remove")} disabled={remove.isPending} onConfirm={() => removing && remove.mutate(removing.id)}
        onCancel={() => setRemoving(null)} onClose={() => setRemoving(null)} />
    </main>
  );
}
