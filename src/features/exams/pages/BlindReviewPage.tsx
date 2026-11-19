import { useEffect, useId, useRef, useState } from "react";
import { OptionalMark } from "@/shared/components/forms/OptionalMark";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, EyeOff } from "lucide-react";
import { t, useLocale } from "@/i18n";
import { AppButton, PageHeader, Panel } from "@/components/AppUI";
import { cn } from "@/shared/lib/cn";
import { apiError } from "@/shared/lib/apiError";
import { examsApi } from "@/features/exams/api/examsApi";
import type { BlindReview, BlindReviewItem } from "@/features/exams/types";

const RUBRIC: Array<{ value: number; label: "exams.review.score0" | "exams.review.score05" | "exams.review.score1" }> = [
  { value: 0, label: "exams.review.score0" },
  { value: 0.5, label: "exams.review.score05" },
  { value: 1, label: "exams.review.score1" },
];

function ReviewCard({ item, language, locked, onSaved }: { item: BlindReviewItem; language: string; locked: boolean; onSaved: (item: BlindReviewItem) => void }) {
  useLocale();
  const id = useId();
  const [score, setScore] = useState<number | null>(item.score);
  const [comment, setComment] = useState(item.comment);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const save = useMutation({
    mutationFn: () => examsApi.saveReview(item.id, score as number, comment),
    onSuccess: (saved) => { onSaved({ ...item, score: saved.score, comment: saved.comment }); setMessage({ kind: "ok", text: t("exams.review.saved") }); },
    onError: (error) => setMessage({ kind: "error", text: apiError(error) }),
  });
  const changed = score !== item.score || comment.trim() !== item.comment;
  const headingId = `${id}-heading`;

  return (
    <article id={`review-${item.id}`} tabIndex={-1} aria-labelledby={headingId} className="space-y-3 rounded-2xl border border-white/10 bg-surface p-4 shadow-md shadow-black/10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={headingId} className="font-mono text-sm font-semibold text-white">{t("exams.review.answer", { code: `#${item.code}` })}</h3>
        {item.score === null && <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 font-[Poppins] text-xs text-amber-300">{t("exams.review.pendingBadge")}</span>}
      </div>
      <p lang={language} className={cn("whitespace-pre-wrap break-words rounded-xl bg-neutral-950/40 p-3 font-[Poppins] text-sm leading-relaxed", item.text.trim() ? "text-zinc-100" : "italic text-zinc-400")}>
        {item.text.trim() ? item.text : t("exams.review.blank")}
      </p>
      <fieldset disabled={locked}>
        <legend className="mb-2 font-[Poppins] text-sm font-medium text-zinc-300">{t("exams.review.score", { code: `#${item.code}` })}</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {RUBRIC.map((option) => (
            <label key={option.value} className="flex min-h-[2.75rem] cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 font-[Poppins] text-sm text-zinc-100 hover:bg-white/5 has-[:checked]:border-blue-400/60 has-[:checked]:bg-blue-500/10">
              <input type="radio" name={`${id}-score`} checked={score === option.value} onChange={() => { setScore(option.value); setMessage(null); }} className="h-5 w-5 accent-blue-500" />
              {t(option.label)}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor={`${id}-comment`} className="mb-1.5 block font-[Poppins] text-sm font-medium text-zinc-300">{t("exams.review.comment")}<OptionalMark /></label>
        <textarea id={`${id}-comment`} value={comment} disabled={locked} maxLength={2000} rows={2} onChange={(event) => { setComment(event.target.value); setMessage(null); }}
          className="w-full rounded-xl border border-control bg-neutral-950/60 px-3 py-2.5 font-[Poppins] text-sm text-white disabled:opacity-70" />
      </div>
      {!locked && (
        <div className="flex flex-wrap items-center gap-3">
          <AppButton type="button" size="sm" className="h-11 md:h-9" disabled={score === null || !changed || save.isPending} aria-busy={save.isPending || undefined} onClick={() => save.mutate()}>
            {save.isPending ? t("exams.review.saving") : t("exams.review.save")}
          </AppButton>
          <p role="status" aria-live="polite" className={cn("font-[Poppins] text-xs", message?.kind === "error" ? "text-red-300" : "text-emerald-300")}>{message?.text ?? ""}</p>
        </div>
      )}
    </article>
  );
}

export function BlindReviewPage() {
  useLocale();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const review = useQuery({ queryKey: ["blindReview", id], queryFn: () => examsApi.getBlindReview(id!) });
  const [current, setCurrent] = useState(0);
  const pendingFocus = useRef<string | null>(null);
  const data = review.data;

  useEffect(() => {
    if (!pendingFocus.current) return;
    document.getElementById(`review-${pendingFocus.current}`)?.focus();
    pendingFocus.current = null;
  });

  const onSaved = (item: BlindReviewItem) => {
    queryClient.setQueryData<BlindReview>(["blindReview", id], (old) => {
      if (!old) return old;
      const questions = old.questions.map((question) => ({ ...question, items: question.items.map((entry) => (entry.id === item.id ? item : entry)) }));
      const reviewed = questions.reduce((sum, question) => sum + question.items.filter((entry) => entry.score !== null).length, 0);
      return { ...old, questions, reviewed };
    });
    queryClient.invalidateQueries({ queryKey: ["managedExam", id] });
  };
  const goToNextPending = () => {
    if (!data) return;
    for (let index = 0; index < data.questions.length; index++) {
      const pending = data.questions[index].items.find((item) => item.score === null);
      if (!pending) continue;
      // Same question: the card is already on screen (no re-render would move focus).
      const card = document.getElementById(`review-${pending.id}`);
      if (index === current && card) { card.scrollIntoView?.({ block: "start" }); card.focus({ preventScroll: true }); return; }
      setCurrent(index);
      pendingFocus.current = pending.id;
      return;
    }
  };

  const question = data?.questions[current];
  const percent = data && data.total ? Math.round((100 * data.reviewed) / data.total) : 0;

  return (
    <main className="relative flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <Link to={`/exams/manage/${id}`} className="inline-flex min-h-[2.75rem] items-center gap-2 font-[Poppins] text-sm text-zinc-300 hover:text-white">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          {data?.title ?? t("exams.editor.back")}
        </Link>
        <PageHeader icon={<EyeOff aria-hidden="true" className="h-5 w-5" />} title={t("exams.review.title")} description={t("exams.review.description")} />
        {review.isError ? (
          <p role="alert" className="font-[Poppins] text-sm text-red-300">{apiError(review.error, "exams.review.loadError")}</p>
        ) : !data ? (
          <p role="status" className="font-[Poppins] text-sm text-zinc-400">{t("common.carregando")}</p>
        ) : data.questions.length === 0 ? (
          <Panel><p className="font-[Poppins] text-sm text-zinc-300">{t("exams.review.noEssays")}</p></Panel>
        ) : (
          <>
            <Panel className="space-y-3">
              <div>
                <p id="review-progress-label" className="font-[Poppins] text-sm font-semibold text-white">{t("exams.review.progress", { reviewed: data.reviewed, total: data.total })}</p>
                <div role="progressbar" aria-labelledby="review-progress-label" aria-valuemin={0} aria-valuemax={data.total} aria-valuenow={data.reviewed}
                  className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-950/60">
                  <div className="h-full rounded-full bg-blue-500 transition-[width]" style={{ width: `${percent}%` }} />
                </div>
              </div>
              {data.released ? (
                <p role="status" className="font-[Poppins] text-sm text-amber-300">{t("exams.review.locked")}</p>
              ) : data.reviewed === data.total ? (
                <p role="status" className="font-[Poppins] text-sm text-emerald-300">{t("exams.review.allDone")}</p>
              ) : (
                <AppButton type="button" variant="secondary" size="sm" className="h-11 md:h-9" onClick={goToNextPending}>{t("exams.review.nextPending")}</AppButton>
              )}
              <nav aria-label={t("exams.review.questionNav")}>
                <ul className="flex flex-wrap gap-2">
                  {data.questions.map((item, index) => (
                    <li key={item.examQuestionId}>
                      <button type="button" aria-current={index === current ? "true" : undefined} onClick={() => setCurrent(index)}
                        className={cn("inline-flex min-h-[2.75rem] items-center rounded-lg border px-3 font-[Poppins] text-xs font-semibold md:min-h-[2.25rem]",
                          index === current ? "border-blue-400/40 bg-blue-600 text-on-accent" : "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10")}>
                        {t("exams.review.questionTab", { position: item.position, reviewed: item.items.filter((entry) => entry.score !== null).length, total: item.items.length })}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </Panel>
            {question && (
              <section aria-labelledby="review-question-title" className="space-y-3">
                <Panel className="space-y-3">
                  <h2 id="review-question-title" className="font-[Poppins] text-sm font-semibold text-blue-300">{t("exams.result.question", { position: question.position })}</h2>
                  <p lang={question.language} className="whitespace-pre-wrap break-words font-[Poppins] text-base text-white">{question.statement}</p>
                  <div className="rounded-r-xl border-l-4 border-emerald-400/60 bg-neutral-950/40 p-3">
                    <h3 className="font-[Poppins] text-xs font-semibold uppercase tracking-wide text-zinc-400">{t("exams.review.criteria")}</h3>
                    <p lang={question.language} className="mt-1 whitespace-pre-wrap break-words font-[Poppins] text-sm text-zinc-200">{question.criteria || t("exams.review.noCriteria")}</p>
                  </div>
                </Panel>
                {question.items.map((item) => (
                  <ReviewCard key={item.id} item={item} language={question.language} locked={data.released} onSaved={onSaved} />
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
