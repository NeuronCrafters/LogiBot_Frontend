import { Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layers, PlayCircle } from "lucide-react";
import { t, useLocale } from "@/i18n";
import { EmptyState, PageHeader } from "@/components/AppUI";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { apiError } from "@/shared/lib/apiError";
import { flashcardsApi } from "@/features/flashcards/api/flashcardsApi";
import { isStudentOnly } from "@/features/flashcards/lib/roles";

/** Student: published decks of the class's subjects, with what is due today and what is already known. */
export function FlashcardsPage() {
  useLocale();
  const { user } = useAuth() ?? {};
  const student = isStudentOnly(user?.role);
  const decks = useQuery({ queryKey: ["flashcardStudy"], queryFn: flashcardsApi.study, enabled: student });
  if (user && !student) return <Navigate to="/flashcards/manage" replace />;

  return (
    <main className="relative flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-5xl space-y-5 font-[Poppins]">
        <PageHeader icon={<Layers aria-hidden="true" className="h-5 w-5" />} title={t("flashcards.pageTitle")} description={t("flashcards.pageDescription")} />
        {decks.isError ? (
          <p role="alert" className="text-sm text-red-300">{apiError(decks.error)}</p>
        ) : decks.isLoading ? (
          <div role="status" className="grid gap-3 sm:grid-cols-2">
            <span className="sr-only">{t("common.carregandoDados")}</span>
            {[0, 1].map((item) => <div key={item} aria-hidden="true" className="h-40 animate-pulse rounded-2xl border border-white/10 bg-surface motion-reduce:animate-none" />)}
          </div>
        ) : !decks.data?.length ? (
          <EmptyState icon={<Layers aria-hidden="true" className="h-6 w-6" />} title={t("flashcards.emptyTitle")} description={t("flashcards.emptyDescription")} />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {decks.data.map((deck) => {
              const known = deck.cards ? deck.known / deck.cards : 0;
              return (
                <li key={deck.id}>
                  <article aria-labelledby={`deck-${deck.id}`} className="flex h-full flex-col gap-3 rounded-2xl border border-white/10 bg-surface p-4 shadow-md shadow-black/10">
                    <div>
                      <p className="text-xs text-zinc-400">{deck.disciplineName}</p>
                      <h2 id={`deck-${deck.id}`} lang={deck.language} className="text-base font-semibold text-white">{deck.title}</h2>
                      {deck.description && <p lang={deck.language} className="mt-1 line-clamp-2 text-sm text-zinc-400">{deck.description}</p>}
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-zinc-300">
                        <span>{t("flashcards.known", { known: deck.known, total: deck.cards })}</span>
                        <span className={deck.due ? "font-semibold text-amber-200" : "text-zinc-400"}>{deck.due ? t("flashcards.due", { count: deck.due }) : t("flashcards.upToDate")}</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10" role="img" aria-label={t("flashcards.known", { known: deck.known, total: deck.cards })}>
                        <div className="h-full rounded-full bg-chart-positive" style={{ width: `${Math.round(known * 100)}%` }} />
                      </div>
                    </div>
                    <Link to={`/flashcards/${deck.id}`} className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-on-accent hover:bg-blue-700">
                      <PlayCircle aria-hidden="true" className="h-4 w-4" />
                      {deck.due ? t("flashcards.study") : t("flashcards.practice")}
                      <span className="sr-only">: {deck.title}</span>
                    </Link>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
