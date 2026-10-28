import { t, useLocale, getLanguage } from "@/i18n";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  feedbackApi,
  type FeedbackItem,
} from "@/features/feedback/api/feedbackApi";
import {
  AlertCircle,
  Bug,
  Heart,
  Lightbulb,
  Loader2,
  MessageCircle,
  Search,
  MessageSquare,
  User,
  Calendar,
} from "lucide-react";

const TYPE_META: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; bg: string }
> = {
  GERAL: {
    get label() { return t("common.geral"); },
    icon: <MessageCircle className="h-3.5 w-3.5" />,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  SUGESTAO: {
    get label() { return t("common.sugestao"); },
    icon: <Lightbulb className="h-3.5 w-3.5" />,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
  },
  BUG: {
    get label() { return t("feedback.bug"); },
    icon: <Bug className="h-3.5 w-3.5" />,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
  ELOGIO: {
    get label() { return t("common.elogio"); },
    icon: <Heart className="h-3.5 w-3.5" />,
    color: "text-pink-400",
    bg: "bg-pink-500/10 border-pink-500/20",
  },
  general: {
    get label() { return t("common.geral"); },
    icon: <MessageCircle className="h-3.5 w-3.5" />,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
};

const FILTER_OPTIONS = () => ([t("common.todos"), "GERAL", "SUGESTAO", "BUG", "ELOGIO"]);

function TypeBadge({ type }: { type: string }) {
  useLocale();

  const meta = TYPE_META[type] ?? {
    label: type,
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    color: "text-zinc-400",
    bg: "bg-zinc-500/10 border-zinc-500/20",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium font-[Poppins] ${meta.color} ${meta.bg}`}
    >
      {meta.icon}
      {meta.label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(getLanguage(), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function FeedbackCard({ item }: { item: FeedbackItem }) {
  useLocale();

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900 p-5 flex flex-col gap-3 hover:border-white/15 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <TypeBadge type={item.type} />
        <span className="flex items-center gap-1.5 text-xs text-zinc-500 font-[Poppins] shrink-0">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(item.createdAt)}
        </span>
      </div>

      <p className="text-sm text-zinc-200 font-[Poppins] leading-relaxed whitespace-pre-wrap">
        {item.message}
      </p>

      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <User className="h-3.5 w-3.5 text-zinc-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-300 font-[Poppins] truncate">
            {item.authorName ?? t("feedback.usuarioRemovido")}
          </p>
          <p className="text-xs text-zinc-500 font-[Poppins] truncate">
            {item.authorEmail ?? "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FeedbackManagementPage() {
  const locale = useLocale();

  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(t("common.todos", {}, locale));

  const isAdmin = Array.isArray(user?.role)
    ? user.role.includes("admin")
    : user?.role === "admin";

  const {
    data: feedbacks = [],
    isLoading,
    isError,
  } = useQuery<FeedbackItem[]>({
    queryKey: ["admin-feedbacks"],
    queryFn: feedbackApi.listAll,
    enabled: !!user && isAdmin,
    staleTime: 60 * 1000,
  });

  const filtered = useMemo(() => {
    return feedbacks.filter((f) => {
      const matchType = typeFilter === "Todos" || f.type === typeFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        f.message.toLowerCase().includes(q) ||
        (f.authorName ?? "").toLowerCase().includes(q) ||
        (f.authorEmail ?? "").toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [feedbacks, typeFilter, search]);

  const counts = useMemo(() => {
    const acc: Record<string, number> = { Todos: feedbacks.length };
    for (const f of feedbacks) {
      acc[f.type] = (acc[f.type] ?? 0) + 1;
    }
    return acc;
  }, [feedbacks]);

  if (!isAdmin) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-500 font-[Poppins] text-sm">{t("feedback.acessoRestrito", {}, locale)}</p>
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
    <div className="mx-auto w-full max-w-5xl font-[Poppins]">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">
          {t("feedback.feedbacksDosAlunos", {}, locale)}</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {t("feedback.vejaOQueOsAlunosEstaoReportando", {}, locale)}</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS().map((opt) => (
            <button
              key={opt}
              onClick={() => setTypeFilter(opt)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                typeFilter === opt
                  ? "border-blue-500/50 bg-blue-500/15 text-blue-300"
                  : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-white"
              }`}
            >
              {opt === "Todos" ? (
                <MessageSquare className="h-3.5 w-3.5" />
              ) : (
                TYPE_META[opt]?.icon
              )}
              {opt === "Todos" ? t("common.todos", {}, locale) : (TYPE_META[opt]?.label ?? opt)}
              {counts[opt] !== undefined && (
                <span className="ml-0.5 tabular-nums opacity-70">
                  {counts[opt]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder={t("feedback.buscarPorMensagemOuAluno", {}, locale)}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-xl border border-white/10 bg-neutral-950/60 pl-9 pr-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-blue-500/50 sm:w-72"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      )}

      {isError && (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-red-400">
          <AlertCircle className="h-5 w-5" />
          {t("feedback.erroAoCarregarFeedbacks", {}, locale)}</div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-zinc-500">
          <MessageSquare className="h-10 w-10 opacity-40" />
          <p className="text-sm">
            {feedbacks.length === 0
              ? t("feedback.nenhumFeedbackRecebidoAinda", {}, locale)
              : t("feedback.nenhumResultadoParaOsFiltrosAplicados", {}, locale)}
          </p>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((item) => (
            <FeedbackCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
    </main>
  );
}
