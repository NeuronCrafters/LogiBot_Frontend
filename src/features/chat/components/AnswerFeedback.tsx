import { useId, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Meh, ThumbsDown, ThumbsUp } from "lucide-react";
import { t, useLocale, type MessageKey } from "@/i18n";
import { cn } from "@/shared/lib/cn";
import { toast } from "@/shared/lib/toast";
import { apiError } from "@/shared/lib/apiError";
import { OptionalMark } from "@/shared/components/forms/OptionalMark";
import { CHAT_FEEDBACK_REASONS, chatFeedbackApi, type ChatFeedback, type ChatFeedbackReason, type ChatRating } from "@/features/chat/api/chatFeedbackApi";

const MAX_COMMENT = 500;
const OPTIONS: Array<{ rating: ChatRating; icon: typeof ThumbsUp; tone: string }> = [
  { rating: "up", icon: ThumbsUp, tone: "aria-pressed:border-emerald-400/60 aria-pressed:bg-emerald-500/15 aria-pressed:text-emerald-200" },
  { rating: "partial", icon: Meh, tone: "aria-pressed:border-amber-400/60 aria-pressed:bg-amber-500/15 aria-pressed:text-amber-200" },
  { rating: "down", icon: ThumbsDown, tone: "aria-pressed:border-red-400/60 aria-pressed:bg-red-500/15 aria-pressed:text-red-200" },
];

/** "Did this answer help?" — yes / more or less / no, with an optional reason and comment. */
export function AnswerFeedback({ sessionId, messageId }: { sessionId: string; messageId: string }) {
  useLocale();
  const baseId = useId();
  const queryClient = useQueryClient();
  const queryKey = ["chatFeedback", sessionId];
  const { data } = useQuery({ queryKey, queryFn: () => chatFeedbackApi.listSession(sessionId), staleTime: 5 * 60 * 1000 });
  const current = (Array.isArray(data) ? data : []).find((item) => item.messageId === messageId) ?? null;

  const [pending, setPending] = useState(false);
  // "More or less" and "No" are chosen first and only stored when sent; a stored rating is final.
  const [draft, setDraft] = useState<ChatRating | null>(null);
  const [reason, setReason] = useState<ChatFeedbackReason | null>(null);
  const [comment, setComment] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const locked = !!current || pending;
  const selected = current?.rating ?? draft;

  function store(next: ChatFeedback) {
    queryClient.setQueryData<ChatFeedback[]>(queryKey, (list) => [...(Array.isArray(list) ? list : []).filter((item) => item.messageId !== messageId), next]);
  }

  async function submit(body: { rating: ChatRating; reason?: ChatFeedbackReason | null; comment?: string | null }) {
    setPending(true);
    // A late initial load must not overwrite the rating just sent.
    await queryClient.cancelQueries({ queryKey });
    try {
      store(await chatFeedbackApi.save(messageId, body));
      setDraft(null);
      setAnnouncement(t("chatFeedback.thanks"));
    } catch (error) {
      toast.error(apiError(error));
      // Already rated elsewhere (another tab): show what was stored.
      void queryClient.invalidateQueries({ queryKey });
    } finally {
      setPending(false);
    }
  }

  function choose(rating: ChatRating) {
    if (locked) return;
    if (rating === "up") {
      void submit({ rating });
      return;
    }
    setDraft(rating);
  }

  function sendDetails(event: FormEvent) {
    event.preventDefault();
    if (!draft || locked) return;
    void submit({ rating: draft, reason, comment: comment.trim() || null });
  }

  function cancel() {
    setDraft(null);
    setReason(null);
    setComment("");
  }

  return (
    <div className="-mt-4 mb-6 pl-12 pr-2 font-[Poppins]">
      <div role="group" aria-labelledby={`${baseId}-question`} className="flex flex-wrap items-center gap-2">
        <span id={`${baseId}-question`} className="text-xs text-zinc-400">{t("chatFeedback.question")}</span>
        {OPTIONS.map(({ rating, icon: Icon, tone }) => (
          <button
            key={rating}
            type="button"
            aria-pressed={selected === rating}
            disabled={locked}
            onClick={() => choose(rating)}
            className={cn(
              "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-medium text-zinc-300 transition-[color,background-color,border-color,transform] duration-200 enabled:hover:bg-white/10 enabled:hover:text-white enabled:active:scale-95 disabled:cursor-default motion-reduce:transition-none motion-reduce:active:scale-100 sm:min-h-8",
              current && current.rating !== rating && "opacity-40",
              tone,
            )}
          >
            <Icon aria-hidden="true" className="h-3.5 w-3.5" />
            {t(`chatFeedback.rating.${rating}` as MessageKey)}
          </button>
        ))}
        {current && <span className="text-xs text-zinc-400">{t("chatFeedback.recorded")}</span>}
      </div>

      {draft && !current && (
        <form onSubmit={sendDetails} className="reveal-down mt-3 max-w-xl space-y-3 rounded-xl border border-white/10 bg-surface-sunken p-3">
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-zinc-200">{t("chatFeedback.reasonQuestion")}<OptionalMark /></legend>
            <div className="flex flex-wrap gap-2">
              {CHAT_FEEDBACK_REASONS.map((item) => (
                <label key={item} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-white/10 px-3 text-xs text-zinc-300 has-[:checked]:border-blue-400/60 has-[:checked]:bg-blue-500/15 has-[:checked]:text-white sm:min-h-8">
                  <input type="radio" name={`${baseId}-reason`} value={item} checked={reason === item} onChange={() => setReason(item)} className="h-4 w-4 accent-blue-500" />
                  {t(`chatFeedback.reason.${item}` as MessageKey)}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor={`${baseId}-comment`} className="mb-1.5 block text-sm font-medium text-zinc-200">{t("chatFeedback.comment")}<OptionalMark /></label>
            <textarea id={`${baseId}-comment`} value={comment} maxLength={MAX_COMMENT} rows={2} onChange={(event) => setComment(event.target.value)}
              aria-describedby={`${baseId}-privacy`}
              className="w-full rounded-xl border border-control bg-neutral-950/60 px-3 py-2 text-sm text-white placeholder:text-zinc-600" placeholder={t("chatFeedback.commentPlaceholder")} />
            <p id={`${baseId}-privacy`} className="mt-1 text-xs text-zinc-400">{t("chatFeedback.privacy")}</p>
          </div>
          <p id={`${baseId}-final`} className="text-xs text-zinc-400">{t("chatFeedback.finalNote")}</p>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={pending} aria-describedby={`${baseId}-final`} className="inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-on-accent hover:bg-blue-700 disabled:opacity-60 sm:min-h-9">
              {t("chatFeedback.send")}
            </button>
            <button type="button" onClick={cancel} disabled={pending} className="inline-flex min-h-11 items-center rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-semibold text-zinc-200 hover:bg-white/10 sm:min-h-9">
              {t("common.cancelar")}
            </button>
          </div>
        </form>
      )}
      <p role="status" aria-live="polite" className="sr-only">{announcement}</p>
    </div>
  );
}
