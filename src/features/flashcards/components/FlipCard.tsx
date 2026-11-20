import { useId } from "react";
import { t, useLocale } from "@/i18n";
import { conceptLabel } from "@/features/exercises/lib/logicLabels";
import { cn } from "@/shared/lib/cn";

/**
 * Card with a question on the front and the answer on the back, turned with a 3D flip (instant when
 * the person prefers reduced motion). The hidden side is out of the accessibility tree, and the
 * side that appears is announced.
 */
export function FlipCard({ front, back, concept, flipped, onFlip, language }: {
  front: string; back: string; concept: string | null; flipped: boolean; onFlip: () => void; language?: string;
}) {
  useLocale();
  const id = useId();
  const face = "flashcard-face flex min-h-[14rem] flex-col items-center justify-center gap-3 rounded-3xl border p-6 text-center shadow-xl sm:min-h-[16rem] sm:p-8";
  return (
    <div className="flashcard-scene font-[Poppins]">
      <div className="flashcard-inner" data-flipped={flipped || undefined} onClick={onFlip}>
        <section aria-labelledby={`${id}-front`} aria-hidden={flipped || undefined} {...(flipped ? { inert: "" } : {})}
          className={cn(face, "border-white/10 bg-surface")}>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">{t("flashcards.question")}</p>
          <h2 id={`${id}-front`} lang={language} className="whitespace-pre-line break-words text-xl font-semibold leading-snug text-white sm:text-2xl">{front}</h2>
          {concept && <p className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs text-zinc-300">{conceptLabel(concept)}</p>}
        </section>
        <section aria-labelledby={`${id}-back`} aria-hidden={!flipped || undefined} {...(!flipped ? { inert: "" } : {})}
          className={cn(face, "flashcard-back border-emerald-400/30 bg-surface-raised")}>
          <p id={`${id}-back`} className="text-xs font-semibold uppercase tracking-wider text-emerald-300">{t("flashcards.answer")}</p>
          <p lang={language} className="whitespace-pre-line break-words text-lg leading-relaxed text-white sm:text-xl">{back}</p>
        </section>
      </div>
      <p aria-live="polite" className="sr-only">{flipped ? `${t("flashcards.answer")}: ${back}` : ""}</p>
    </div>
  );
}
