import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { t, useLocale } from "@/i18n";
import { chatApi } from "../api/chatApi";
import { getImmediateFollowUps } from "../lib/learningSuggestions";

export function ChatFollowUpSuggestions({ sessionId, messageId, questions, onSelect, onReady }: {
  sessionId: string; messageId: string; questions: readonly string[]; onSelect: (question: string) => void; onReady?: () => void;
}) {
  const locale = useLocale();
  const [pinned, setPinned] = useState<string[] | null>(null);
  const { data } = useQuery<string[]>({
    queryKey: ["chatFollowUps", sessionId, messageId, locale],
    queryFn: ({ signal }) => chatApi.getFollowUps(sessionId, messageId, signal),
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const suggestions = pinned || (data?.length ? data : getImmediateFollowUps(questions, locale));
  useEffect(() => { setPinned(null); }, [locale]);
  useEffect(() => { if (suggestions.length) onReady?.(); }, [suggestions.length, onReady]);
  if (!suggestions.length) return null;
  return <div role="group" aria-label={t("chat.followUpsTitle")} className="mb-6 ml-12 mr-2 font-[Poppins]"
    onPointerEnter={() => setPinned(value => value || suggestions)} onFocusCapture={() => setPinned(value => value || suggestions)}>
    <p className="mb-2 text-xs font-medium text-zinc-400">{t("chat.followUpsTitle")}</p>
    <div className="flex flex-wrap gap-2">
      {suggestions.map(question => <button key={question} type="button" onClick={() => onSelect(question)}
        className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-xl border border-control bg-neutral-800/50 px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-neutral-700/60 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400">
        <span className="min-w-0 [overflow-wrap:anywhere]">{question}</span><ArrowUpRight aria-hidden="true" size={15} className="shrink-0" />
      </button>)}
    </div>
  </div>;
}
