import { t, useLocale, getLanguage } from "@/i18n";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  feedbackApi,
  type FeedbackItem,
} from "@/features/feedback/api/feedbackApi";
import { academicFiltersApi } from "@/features/academic/api/academicFiltersApi";
import { AppModal } from "@/shared/components/feedback/AppModal";
import { Pagination } from "@/shared/components/navigation/Pagination";
import {
  AlertCircle,
  Bug,
  Building2,
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

/** "ALL" is a sentinel, never a label: the label changes with the language. */
const ALL = "ALL";
const FILTER_OPTIONS = [ALL, "GERAL", "SUGESTAO", "BUG", "ELOGIO"];
const selectClass = "h-11 w-full rounded-xl border border-control bg-neutral-950/60 px-3 text-sm text-white disabled:opacity-60";

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

/** "Institution · Course · Class", skipping what the author does not have. */
function originOf(item: FeedbackItem) {
  return [item.schoolName, item.courseName, item.className].filter(Boolean).join(" · ");
}

function FeedbackCard({ item, onOpen }: { item: FeedbackItem; onOpen: () => void }) {
  useLocale();
  const origin = originOf(item);
  const author = item.authorName ?? t("feedback.usuarioRemovido");

  // The "details" button stretches over the whole card, so clicking anywhere opens it.
  return (
    <article className="relative flex h-full flex-col gap-3 rounded-2xl border border-white/10 bg-neutral-900 p-5 transition-colors focus-within:ring-2 focus-within:ring-blue-400 hover:border-blue-400/40">
      <div className="flex items-start justify-between gap-3">
        <TypeBadge type={item.type} />
        <span className="flex items-center gap-1.5 text-xs text-zinc-400 font-[Poppins] shrink-0">
          <Calendar aria-hidden="true" className="h-3.5 w-3.5" />
          {formatDate(item.createdAt)}
        </span>
      </div>

      <p className="line-clamp-4 text-sm text-zinc-200 font-[Poppins] leading-relaxed whitespace-pre-wrap">
        {item.message}
      </p>

      <div className="mt-auto flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <User aria-hidden="true" className="h-3.5 w-3.5 text-zinc-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-zinc-300 font-[Poppins] truncate">{author}</p>
            <p className="text-xs text-zinc-400 font-[Poppins] truncate">{origin || item.authorEmail || "—"}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-blue-300 after:absolute after:inset-0 after:rounded-2xl after:content-[''] hover:text-blue-200 focus-visible:outline-none"
        >
          {t("feedback.details")}
          <span className="sr-only"> {t("feedback.ofAuthor", { name: author })}</span>
        </button>
      </div>
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-surface-sunken px-3 py-2">
      <dt className="text-xs text-zinc-400">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-medium text-white">{value}</dd>
    </div>
  );
}

export function FeedbackManagementPage() {
  const locale = useLocale();

  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(ALL);
  const [institutionId, setInstitutionId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [classId, setClassId] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [open, setOpen] = useState<FeedbackItem | null>(null);
  const filterId = useId();
  const listRef = useRef<HTMLDivElement>(null);

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
  const academic = useQuery({ queryKey: ["academicFilters"], queryFn: academicFiltersApi.getAcademicData, enabled: isAdmin, staleTime: 5 * 60 * 1000 });
  const institutions = useMemo(() => academic.data?.data?.universities ?? [], [academic.data]);
  const courses = useMemo(() => institutions.find((item) => item._id === institutionId)?.courses ?? [], [institutions, institutionId]);
  const classes = useMemo(() => courses.find((item) => item._id === courseId)?.classes ?? [], [courses, courseId]);

  // Entities first, so the type counters reflect the chosen institution, course and class.
  const inEntities = useMemo(() => feedbacks.filter((f) =>
    (!institutionId || f.schoolId === institutionId) &&
    (!courseId || f.courseId === courseId) &&
    (!classId || f.classId === classId)), [feedbacks, institutionId, courseId, classId]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return inEntities.filter((f) => {
      const matchType = typeFilter === ALL || f.type === typeFilter;
      const matchSearch =
        !q ||
        f.message.toLowerCase().includes(q) ||
        (f.authorName ?? "").toLowerCase().includes(q) ||
        (f.authorEmail ?? "").toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [inEntities, typeFilter, search]);

  const counts = useMemo(() => {
    const acc: Record<string, number> = { [ALL]: inEntities.length };
    for (const f of inEntities) {
      acc[f.type] = (acc[f.type] ?? 0) + 1;
    }
    return acc;
  }, [inEntities]);

  // Any filter change goes back to the first page.
  useEffect(() => { setPage(1); }, [search, typeFilter, institutionId, courseId, classId, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hasFilters = !!(search || typeFilter !== ALL || institutionId);

  const goTo = (next: number) => {
    setPage(next);
    listRef.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  const clearFilters = () => { setSearch(""); setTypeFilter(ALL); setInstitutionId(""); setCourseId(""); setClassId(""); };

  if (!isAdmin) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-500 font-[Poppins] text-sm">{t("feedback.acessoRestrito", {}, locale)}</p>
      </div>
    );
  }

  const notInformed = t("feedback.notInformed", {}, locale);
  return (
    <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
    <div className="mx-auto w-full max-w-5xl font-[Poppins]">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">
          {t("feedback.feedbacksDosAlunos", {}, locale)}</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {t("feedback.vejaOQueOsAlunosEstaoReportando", {}, locale)}</p>
      </div>

      {/* Entities: institution, then course, then class */}
      <section aria-labelledby={`${filterId}-title`} className="mb-4 rounded-2xl border border-white/10 bg-surface p-4 shadow-lg shadow-black/10">
        <h2 id={`${filterId}-title`} className="mb-3 text-sm font-semibold text-white">{t("feedback.entityFilters", {}, locale)}</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label htmlFor={`${filterId}-institution`} className="mb-1 block text-xs font-medium text-zinc-300">{t("common.universidade", {}, locale)}</label>
            <select id={`${filterId}-institution`} value={institutionId} className={selectClass}
              onChange={(event) => { setInstitutionId(event.target.value); setCourseId(""); setClassId(""); }}>
              <option value="">{t("chatFeedback.admin.allInstitutions", {}, locale)}</option>
              {institutions.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor={`${filterId}-course`} className="mb-1 block text-xs font-medium text-zinc-300">{t("chatFeedback.admin.course", {}, locale)}</label>
            <select id={`${filterId}-course`} value={courseId} disabled={!institutionId} className={selectClass}
              onChange={(event) => { setCourseId(event.target.value); setClassId(""); }}>
              <option value="">{t("chatFeedback.admin.allCourses", {}, locale)}</option>
              {courses.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor={`${filterId}-class`} className="mb-1 block text-xs font-medium text-zinc-300">{t("chatFeedback.admin.class", {}, locale)}</label>
            <select id={`${filterId}-class`} value={classId} disabled={!courseId} className={selectClass} onChange={(event) => setClassId(event.target.value)}>
              <option value="">{t("chatFeedback.admin.allClasses", {}, locale)}</option>
              {classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
            </select>
          </div>
        </div>
        <p className="mt-2 text-xs text-zinc-400">{t("feedback.entityHint", {}, locale)}</p>
      </section>

      {/* Type and search */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("feedback.typeLabel", {}, locale)}>
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              aria-pressed={typeFilter === opt}
              onClick={() => setTypeFilter(opt)}
              className={`flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                typeFilter === opt
                  ? "border-blue-500/50 bg-blue-500/15 text-blue-300"
                  : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:text-white"
              }`}
            >
              {opt === ALL ? (
                <MessageSquare aria-hidden="true" className="h-3.5 w-3.5" />
              ) : (
                TYPE_META[opt]?.icon
              )}
              {opt === ALL ? t("feedback.all", {}, locale) : (TYPE_META[opt]?.label ?? opt)}
              <span className="ml-0.5 tabular-nums">{counts[opt] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            aria-label={t("feedback.buscarPorMensagemOuAluno", {}, locale)}
            placeholder={t("feedback.buscarPorMensagemOuAluno", {}, locale)}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-control bg-neutral-950/60 pl-9 pr-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-blue-500/50 sm:h-9 sm:w-72"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      )}

      {isError && (
        <div role="alert" className="flex items-center justify-center gap-2 py-20 text-sm text-red-400">
          <AlertCircle aria-hidden="true" className="h-5 w-5" />
          {t("feedback.erroAoCarregarFeedbacks", {}, locale)}</div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-zinc-500">
          <MessageSquare aria-hidden="true" className="h-10 w-10 opacity-40" />
          <p className="text-sm">
            {feedbacks.length === 0
              ? t("feedback.nenhumFeedbackRecebidoAinda", {}, locale)
              : t("feedback.nenhumResultadoParaOsFiltrosAplicados", {}, locale)}
          </p>
          {hasFilters && feedbacks.length > 0 && (
            <button type="button" onClick={clearFilters}
              className="min-h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-zinc-100 hover:bg-white/10 sm:min-h-9">
              {t("feedback.clearFilters", {}, locale)}
            </button>
          )}
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div ref={listRef} className="scroll-mt-4 space-y-4">
          <ul className="grid gap-4 sm:grid-cols-2">
            {visible.map((item) => (
              <li key={item.id}><FeedbackCard item={item} onOpen={() => setOpen(item)} /></li>
            ))}
          </ul>
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            total={filtered.length}
            pageSize={pageSize}
            onPageChange={goTo}
            onPageSizeChange={setPageSize}
            label={t("feedback.listLabel", {}, locale)}
          />
        </div>
      )}
    </div>

    <AppModal isOpen={!!open} type="info" size="lg" title={t("feedback.detailsTitle", {}, locale)} onClose={() => setOpen(null)}>
      {open && (
        <div className="space-y-4 font-[Poppins]">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={open.type} />
            <span className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Calendar aria-hidden="true" className="h-3.5 w-3.5" />
              {t("feedback.sentAt", {}, locale)} {formatDate(open.createdAt)}
            </span>
          </div>
          <section aria-labelledby={`${filterId}-message`} className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-4">
            <h3 id={`${filterId}-message`} className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-200">{t("feedback.messageLabel", {}, locale)}</h3>
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-white">{open.message}</p>
          </section>
          <dl className="grid gap-2 sm:grid-cols-2">
            <Detail label={t("feedback.author", {}, locale)} value={open.authorName ?? t("feedback.usuarioRemovido", {}, locale)} />
            <Detail label={t("feedback.email", {}, locale)} value={open.authorEmail ?? "—"} />
          </dl>
          <section aria-labelledby={`${filterId}-origin`}>
            <h3 id={`${filterId}-origin`} className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-300">
              <Building2 aria-hidden="true" className="h-4 w-4" />
              {t("feedback.origin", {}, locale)}
            </h3>
            <dl className="grid gap-2 sm:grid-cols-3">
              <Detail label={t("common.universidade", {}, locale)} value={open.schoolName ?? notInformed} />
              <Detail label={t("chatFeedback.admin.course", {}, locale)} value={open.courseName ?? notInformed} />
              <Detail label={t("chatFeedback.admin.class", {}, locale)} value={open.className ?? notInformed} />
            </dl>
          </section>
        </div>
      )}
    </AppModal>
    </main>
  );
}
