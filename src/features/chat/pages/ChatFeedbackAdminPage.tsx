import { useEffect, useId, useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Quote, ThumbsUp } from "lucide-react";
import { t, useLocale, type MessageKey } from "@/i18n";
import { EmptyState, PageHeader, Panel } from "@/components/AppUI";
import { apiError } from "@/shared/lib/apiError";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { chatFeedbackApi, type ChatRating, type FeedbackGroup, type NotUsefulItem } from "@/features/chat/api/chatFeedbackApi";
import { Pagination } from "@/shared/components/navigation/Pagination";
import { academicFiltersApi } from "@/features/academic/api/academicFiltersApi";
import { AppModal } from "@/shared/components/feedback/AppModal";
import { MarkdownMessageBubble } from "@/features/chat/components/MarkdownMessageBubble";
import { normalizeLanguage } from "@/i18n";
import { cn } from "@/shared/lib/cn";

type Recent = NotUsefulItem;
const RATING_TONE: Record<ChatRating, string> = {
  up: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
  partial: "border-amber-400/40 bg-amber-500/10 text-amber-200",
  down: "border-red-400/40 bg-red-500/10 text-red-200",
};
const selectClass = "h-11 w-full rounded-xl border border-control bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white disabled:opacity-60";
const cardClass = "rounded-2xl border border-white/10 bg-surface p-4 shadow-lg shadow-black/10";

/** The rater's own words: the most useful part of a review, so it stands out. */
function CommentCard({ text }: { text: string }) {
  return (
    <figure className="rounded-xl border border-blue-400/40 bg-blue-500/10 p-3 font-[Poppins]">
      <figcaption className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-blue-200">
        <Quote aria-hidden="true" className="h-4 w-4" />
        {t("chatFeedback.admin.raterComment")}
      </figcaption>
      <blockquote className="whitespace-pre-wrap text-sm leading-relaxed text-white">{text}</blockquote>
    </figure>
  );
}

function Tag({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs", className ?? "border-white/15 bg-white/5 text-zinc-200")}>
      <span className="text-zinc-400">{label}:</span>{" "}
      <span className="font-semibold">{value}</span>
    </span>
  );
}

const PERIODS = [7, 30, 90, 365];
const percent = (value: number | null) => (value === null ? "—" : new Intl.NumberFormat(document.documentElement.lang || undefined, { style: "percent", maximumFractionDigits: 0 }).format(value));
const ratingLabel = (rating: ChatRating) => t(`chatFeedback.rating.${rating}` as MessageKey);

function groupLabel(dimension: "role" | "course" | "topic" | "language", key: string) {
  if (key === "unknown") return t("chatFeedback.admin.unknown");
  if (dimension === "role") return t(`chatFeedback.admin.role.${key}` as MessageKey) || key;
  return key;
}

function GroupTable({ title, dimension, groups, hidden }: { title: string; dimension: "role" | "course" | "topic" | "language"; groups: FeedbackGroup[]; hidden: number }) {
  const captionId = useId();
  return (
    <Panel>
      <h2 id={captionId} className="font-[Poppins] text-base font-semibold text-white">{title}</h2>
      {groups.length === 0 ? (
        <p className="mt-2 font-[Poppins] text-sm text-zinc-400">{t("chatFeedback.admin.noGroups")}</p>
      ) : (
        <div role="region" aria-labelledby={captionId} tabIndex={0} className="mt-3 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[28rem] border-collapse font-[Poppins] text-sm">
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr className="bg-surface-raised text-left text-zinc-300">
                <th scope="col" className="px-3 py-2">{t("chatFeedback.admin.group")}</th>
                <th scope="col" className="px-3 py-2 text-right">{ratingLabel("up")}</th>
                <th scope="col" className="px-3 py-2 text-right">{ratingLabel("partial")}</th>
                <th scope="col" className="px-3 py-2 text-right">{ratingLabel("down")}</th>
                <th scope="col" className="px-3 py-2 text-right">{t("chatFeedback.admin.satisfaction")}</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.key} className="border-t border-white/5 text-zinc-200">
                  <th scope="row" className="px-3 py-2 text-left font-medium text-white">{groupLabel(dimension, group.key)}</th>
                  <td className="px-3 py-2 text-right">{group.up}</td>
                  <td className="px-3 py-2 text-right">{group.partial}</td>
                  <td className="px-3 py-2 text-right">{group.down}</td>
                  <td className="px-3 py-2 text-right font-semibold">{percent(group.score)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {hidden > 0 && <p className="mt-2 font-[Poppins] text-xs text-zinc-400">{t("chatFeedback.admin.hidden", { count: hidden })}</p>}
    </Panel>
  );
}

export function ChatFeedbackAdminPage() {
  useLocale();
  const { user } = useAuth();
  const isAdmin = Array.isArray(user?.role) ? user!.role.includes("admin") : user?.role === "admin";
  const [days, setDays] = useState(30);
  const [institutionId, setInstitutionId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [classId, setClassId] = useState("");
  const [open, setOpen] = useState<Recent | null>(null);
  const periodId = useId();
  const filterId = useId();
  const academic = useQuery({ queryKey: ["academicFilters"], queryFn: academicFiltersApi.getAcademicData, enabled: isAdmin, staleTime: 5 * 60 * 1000 });
  const institutions = useMemo(() => academic.data?.data?.universities ?? [], [academic.data]);
  const courses = useMemo(() => institutions.find((item) => item._id === institutionId)?.courses ?? [], [institutions, institutionId]);
  const classes = useMemo(() => courses.find((item) => item._id === courseId)?.classes ?? [], [courses, courseId]);
  const filters = { days, institutionId, courseId, classId };
  const summary = useQuery({ queryKey: ["chatFeedbackSummary", filters], queryFn: () => chatFeedbackApi.summary(filters), enabled: isAdmin });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [rating, setRating] = useState<"" | "partial" | "down">("");
  const ratingId = useId();
  const recentRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setPage(1); }, [days, institutionId, courseId, classId, pageSize, rating]);
  const recentQuery = { ...filters, page, pageSize, rating: rating || undefined };
  const recent = useQuery({
    queryKey: ["chatFeedbackNotUseful", recentQuery],
    queryFn: () => chatFeedbackApi.notUseful(recentQuery),
    enabled: isAdmin,
    placeholderData: keepPreviousData,
  });
  const goTo = (next: number) => {
    setPage(next);
    recentRef.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  if (!isAdmin) {
    return (
      <main className="flex flex-1 items-center justify-center px-4">
        <p className="font-[Poppins] text-sm text-zinc-400">{t("feedback.acessoRestrito")}</p>
      </main>
    );
  }

  const data = summary.data;
  return (
    <main className="relative flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <PageHeader
          icon={<ThumbsUp aria-hidden="true" className="h-5 w-5" />}
          title={t("chatFeedback.admin.title")}
          description={t("chatFeedback.admin.description")}
          action={(
            <div className="min-w-[10rem]">
              <label htmlFor={periodId} className="mb-1 block font-[Poppins] text-xs font-medium text-zinc-300">{t("chatFeedback.admin.period")}</label>
              <select id={periodId} value={days} onChange={(event) => setDays(Number(event.target.value))}
                className="h-11 w-full rounded-xl border border-control bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white">
                {PERIODS.map((value) => <option key={value} value={value}>{t("chatFeedback.admin.lastDays", { count: value })}</option>)}
              </select>
            </div>
          )}
        />

        <section aria-labelledby={`${filterId}-title`} className={cardClass}>
          <h2 id={`${filterId}-title`} className="mb-3 font-[Poppins] text-sm font-semibold text-white">{t("chatFeedback.admin.filters")}</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label htmlFor={`${filterId}-institution`} className="mb-1 block font-[Poppins] text-xs font-medium text-zinc-300">{t("common.universidade")}</label>
              <select id={`${filterId}-institution`} value={institutionId} className={selectClass}
                onChange={(event) => { setInstitutionId(event.target.value); setCourseId(""); setClassId(""); }}>
                <option value="">{t("chatFeedback.admin.allInstitutions")}</option>
                {institutions.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor={`${filterId}-course`} className="mb-1 block font-[Poppins] text-xs font-medium text-zinc-300">{t("chatFeedback.admin.course")}</label>
              <select id={`${filterId}-course`} value={courseId} disabled={!institutionId} className={selectClass}
                onChange={(event) => { setCourseId(event.target.value); setClassId(""); }}>
                <option value="">{t("chatFeedback.admin.allCourses")}</option>
                {courses.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor={`${filterId}-class`} className="mb-1 block font-[Poppins] text-xs font-medium text-zinc-300">{t("chatFeedback.admin.class")}</label>
              <select id={`${filterId}-class`} value={classId} disabled={!courseId} className={selectClass} onChange={(event) => setClassId(event.target.value)}>
                <option value="">{t("chatFeedback.admin.allClasses")}</option>
                {classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
              </select>
            </div>
          </div>
          <p className="mt-2 font-[Poppins] text-xs text-zinc-400">{t("chatFeedback.admin.filtersHint")}</p>
        </section>

        {summary.isError && <p role="alert" className="font-[Poppins] text-sm text-red-300">{apiError(summary.error)}</p>}
        <section aria-busy={summary.isLoading || undefined} aria-label={t("chatFeedback.admin.overview")} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: t("chatFeedback.admin.satisfaction"), value: percent(data?.score ?? null) },
            { label: ratingLabel("up"), value: String(data?.up ?? 0) },
            { label: ratingLabel("partial"), value: String(data?.partial ?? 0) },
            { label: ratingLabel("down"), value: String(data?.down ?? 0) },
          ].map((card) => (
            <div key={card.label} className={cardClass}>
              <p className="font-[Poppins] text-xs text-zinc-400">{card.label}</p>
              <p className="mt-1 font-[Poppins] text-2xl font-semibold text-white">{card.value}</p>
            </div>
          ))}
        </section>
        <p className="font-[Poppins] text-xs text-zinc-400">{t("chatFeedback.admin.scoreHint", { min: data?.minGroupSize ?? 5 })}</p>

        {data && data.total === 0 ? (
          <EmptyState icon={<ThumbsUp className="h-5 w-5" />} title={t("chatFeedback.admin.emptyTitle")} description={t("chatFeedback.admin.emptyDescription")} />
        ) : data && (
          <>
            <div className="grid gap-5 lg:grid-cols-2">
              <GroupTable title={t("chatFeedback.admin.byRole")} dimension="role" {...data.byRole} />
              <GroupTable title={t("chatFeedback.admin.byCourse")} dimension="course" {...data.byCourse} />
              <GroupTable title={t("chatFeedback.admin.byTopic")} dimension="topic" {...data.byTopic} />
              <GroupTable title={t("chatFeedback.admin.byLanguage")} dimension="language" {...data.byLanguage} />
            </div>

            <Panel>
              <h2 className="font-[Poppins] text-base font-semibold text-white">{t("chatFeedback.admin.reasons")}</h2>
              {Object.keys(data.reasons).length === 0 && <p className="mt-2 font-[Poppins] text-sm text-zinc-400">{t("chatFeedback.admin.noReasons")}</p>}
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {Object.keys(data.reasons).map((key) => (
                  <li key={key} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 font-[Poppins] text-sm text-zinc-200">
                    <span>{key === "none" ? t("chatFeedback.admin.noReason") : t(`chatFeedback.reason.${key}` as MessageKey)}</span>
                    <span className="font-semibold text-white">{data.reasons[key]}</span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel>
              <div ref={recentRef} className="scroll-mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-[Poppins] text-base font-semibold text-white">{t("chatFeedback.admin.recent")}</h2>
                  <p className="mt-1 font-[Poppins] text-xs text-zinc-400">{t("chatFeedback.admin.recentHint")}</p>
                </div>
                <div className="sm:min-w-[12rem]">
                  <label htmlFor={ratingId} className="mb-1 block font-[Poppins] text-xs font-medium text-zinc-300">{t("chatFeedback.admin.ratingFilter")}</label>
                  <select id={ratingId} value={rating} className={selectClass} onChange={(event) => setRating(event.target.value as "" | "partial" | "down")}>
                    <option value="">{t("chatFeedback.admin.allNotUseful")}</option>
                    <option value="partial">{ratingLabel("partial")}</option>
                    <option value="down">{ratingLabel("down")}</option>
                  </select>
                </div>
              </div>
              {recent.isError && <p role="alert" className="mt-2 font-[Poppins] text-sm text-red-300">{apiError(recent.error)}</p>}
              {recent.data && recent.data.total === 0 && <p className="mt-3 font-[Poppins] text-sm text-zinc-400">{t("chatFeedback.admin.noRecent")}</p>}
              <ul aria-busy={recent.isFetching || undefined} className="mt-3 space-y-3">
                {(recent.data?.items ?? []).map((item, index) => {
                  const number = (recent.data!.page - 1) * recent.data!.pageSize + index + 1;
                  return (
                    <li key={`${item.ratedAt}-${number}`}>
                      <article aria-label={t("chatFeedback.admin.recentItem", { number })} className="space-y-3 rounded-xl border border-white/10 bg-surface-sunken p-4 font-[Poppins] text-sm">
                        <div className="flex flex-wrap gap-2">
                          <Tag label={t("chatFeedback.admin.tagRating")} value={ratingLabel(item.rating)} className={RATING_TONE[item.rating]} />
                          {item.reason && <Tag label={t("chatFeedback.admin.tagReason")} value={t(`chatFeedback.reason.${item.reason}` as MessageKey)} />}
                          {item.topic && <Tag label={t("chatFeedback.admin.tagTopic")} value={item.topic} />}
                        </div>
                        <p className="line-clamp-3 text-zinc-300"><span className="font-semibold text-white">{t("chatFeedback.admin.question")}: </span>{item.question}</p>
                        {item.comment && <CommentCard text={item.comment} />}
                        <button type="button" onClick={() => setOpen(item)}
                          className="inline-flex min-h-11 items-center rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-semibold text-zinc-100 transition-colors hover:bg-white/10 sm:min-h-9">
                          {t("chatFeedback.admin.showAnswer")}
                        </button>
                      </article>
                    </li>
                  );
                })}
              </ul>
              {recent.data && recent.data.total > 0 && (
                <Pagination
                  className="mt-4"
                  page={recent.data.page}
                  totalPages={recent.data.totalPages}
                  total={recent.data.total}
                  pageSize={recent.data.pageSize}
                  onPageChange={goTo}
                  onPageSizeChange={setPageSize}
                  label={t("chatFeedback.admin.pagination")}
                />
              )}
            </Panel>
          </>
        )}
      </div>
      <AppModal isOpen={!!open} type="info" size="lg" title={t("chatFeedback.admin.answerTitle")} onClose={() => setOpen(null)}>
        {open && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Tag label={t("chatFeedback.admin.tagRating")} value={ratingLabel(open.rating)} className={RATING_TONE[open.rating]} />
              {open.reason && <Tag label={t("chatFeedback.admin.tagReason")} value={t(`chatFeedback.reason.${open.reason}` as MessageKey)} />}
            </div>
            {open.comment && <CommentCard text={open.comment} />}
            <MarkdownMessageBubble text={open.question} sender="user" />
            <MarkdownMessageBubble text={open.answer} sender="bot" outputLanguage={normalizeLanguage(open.language ?? undefined)} />
          </div>
        )}
      </AppModal>
    </main>
  );
}
