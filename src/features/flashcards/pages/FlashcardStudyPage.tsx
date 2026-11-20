import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, RotateCcw, RotateCw, X } from "lucide-react";
import { t, useLocale } from "@/i18n";
import { apiError } from "@/shared/lib/apiError";
import { cn } from "@/shared/lib/cn";
import { toast } from "@/shared/lib/toast";
import { flashcardsApi, type Rating } from "@/features/flashcards/api/flashcardsApi";
import { FlipCard } from "@/features/flashcards/components/FlipCard";

const RATINGS: Array<{ rating: Rating; key: string; icon: typeof Check; tone: string }> = [
  { rating: "again", key: "1", icon: X, tone: "border-red-400/50 bg-red-500/10 text-red-200 hover:bg-red-500/20" },
  { rating: "hard", key: "2", icon: RotateCw, tone: "border-amber-400/50 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20" },
  { rating: "good", key: "3", icon: Check, tone: "border-emerald-400/50 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20" },
];

/**
 * One study round: flip each card (click, Space or Enter), then say how it went (buttons or 1, 2, 3).
 * Cards missed come back in a few minutes, the others in days, following the student's boxes.
 */
export function FlashcardStudyPage() {
  useLocale();
  const { deckId = "" } = useParams();
  const queryClient = useQueryClient();
  const session = useQuery({ queryKey: ["flashcardSession", deckId], queryFn: () => flashcardsApi.session(deckId), staleTime: Infinity, refetchOnWindowFocus: false });
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tally, setTally] = useState<Record<Rating, number>>({ again: 0, hard: 0, good: 0 });
  const heading = useRef<HTMLHeadingElement>(null);
  const showButton = useRef<HTMLButtonElement>(null);
  const firstRating = useRef<HTMLButtonElement>(null);
  const cards = session.data?.cards ?? [];
  const card = cards[index];
  const finished = !!session.data && index >= cards.length;

  async function rate(rating: Rating) {
    if (!card || !flipped || saving) return;
    setSaving(true);
    try {
      await flashcardsApi.review(card.id, rating);
      setTally((current) => ({ ...current, [rating]: current[rating] + 1 }));
      setFlipped(false);
      setIndex((current) => current + 1);
    } catch (caught) {
      toast.error(apiError(caught));
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (event.ctrlKey || event.metaKey || event.altKey || (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      // Space and Enter keep their own action on buttons and links.
      if ((event.key === " " || event.key === "Enter") && !(target && /^(BUTTON|A)$/.test(target.tagName))) { event.preventDefault(); if (card) setFlipped((value) => !value); }
      const choice = RATINGS.find((item) => item.key === event.key);
      if (choice) void rate(choice.rating);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => { if (finished) heading.current?.focus(); }, [finished]);
  // Keyboard users keep their place: the answer buttons after flipping, "show answer" on the next card.
  const started = useRef(false);
  useEffect(() => {
    if (!started.current) { started.current = true; return; }
    if (flipped) firstRating.current?.focus(); else showButton.current?.focus();
  }, [flipped, index]);

  function again() {
    setIndex(0); setFlipped(false); setTally({ again: 0, hard: 0, good: 0 });
    void queryClient.invalidateQueries({ queryKey: ["flashcardStudy"] });
    void session.refetch();
  }

  return (
    <main className="relative flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-2xl space-y-5 font-[Poppins]">
        <Link to="/flashcards" onClick={() => void queryClient.invalidateQueries({ queryKey: ["flashcardStudy"] })}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-blue-300 hover:bg-white/5 md:min-h-9">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />{t("flashcards.backToDecks")}
        </Link>

        {session.isError && <p role="alert" className="rounded-2xl border border-white/10 bg-surface p-6 text-sm text-red-300">{apiError(session.error)}</p>}
        {session.isLoading && <div role="status" className="h-64 animate-pulse rounded-3xl border border-white/10 bg-surface motion-reduce:animate-none"><span className="sr-only">{t("common.carregandoDados")}</span></div>}

        {session.data && (
          <>
            <header>
              <h1 ref={heading} tabIndex={-1} lang={session.data.deck.language} className="text-2xl font-semibold text-white outline-none">{session.data.deck.title}</h1>
              {session.data.ahead && <p className="mt-1 text-sm text-amber-200">{t("flashcards.ahead")}</p>}
            </header>

            {card && !finished ? (
              <>
                <div className="flex items-center justify-between text-sm text-zinc-300">
                  <p aria-live="polite">{t("flashcards.progress", { current: index + 1, total: cards.length })}</p>
                  <div aria-hidden="true" className="h-2 w-40 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-blue-500 transition-[width] motion-reduce:transition-none" style={{ width: `${(index / cards.length) * 100}%` }} />
                  </div>
                </div>
                <div key={card.id} className="flashcard-enter">
                  <FlipCard front={card.front} back={card.back} concept={card.concept} flipped={flipped} onFlip={() => setFlipped((value) => !value)} language={session.data.deck.language} />
                </div>
                {!flipped ? (
                  <button ref={showButton} type="button" onClick={() => setFlipped(true)} aria-keyshortcuts="Space Enter"
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-base font-semibold text-on-accent hover:bg-blue-700">
                    <RotateCcw aria-hidden="true" className="h-5 w-5" />{t("flashcards.showAnswer")}
                  </button>
                ) : (
                  <div role="group" aria-label={t("flashcards.howWasIt")} className="grid gap-2 sm:grid-cols-3">
                    {RATINGS.map(({ rating, key, icon: Icon, tone }, position) => (
                      <button key={rating} ref={position === 0 ? firstRating : undefined} type="button" disabled={saving} onClick={() => void rate(rating)} aria-keyshortcuts={key}
                        className={cn("inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold disabled:opacity-60", tone)}>
                        <Icon aria-hidden="true" className="h-4 w-4" />{t(`flashcards.rating.${rating}`)}
                        <kbd aria-hidden="true" className="rounded border border-current/30 px-1.5 text-[0.7rem] opacity-70">{key}</kbd>
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-center text-xs text-zinc-400">{t("flashcards.keyboardHint")}</p>
              </>
            ) : (
              <section aria-labelledby="flashcards-summary" className="rounded-3xl border border-white/10 bg-surface p-6 text-center">
                <h2 id="flashcards-summary" className="text-lg font-semibold text-white">{cards.length ? t("flashcards.doneTitle") : t("flashcards.noCards")}</h2>
                {cards.length > 0 && (
                  <ul className="mt-3 flex flex-wrap justify-center gap-2 text-sm">
                    {RATINGS.map(({ rating, tone }) => <li key={rating} className={cn("rounded-full border px-3 py-1", tone)}>{t(`flashcards.rating.${rating}`)}: {tally[rating]}</li>)}
                  </ul>
                )}
                <p className="mt-3 text-sm text-zinc-400">{t("flashcards.doneHint")}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button type="button" onClick={again} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-on-accent hover:bg-blue-700">
                    <RotateCcw aria-hidden="true" className="h-4 w-4" />{t("flashcards.studyAgain")}
                  </button>
                  <Link to="/flashcards" className="inline-flex min-h-11 items-center rounded-xl border border-white/15 px-4 text-sm font-semibold text-white hover:bg-white/10">{t("flashcards.backToDecks")}</Link>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
