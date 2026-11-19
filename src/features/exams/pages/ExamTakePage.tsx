import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, ClipboardCheck, Send, Timer } from "lucide-react";
import { number, t, useLocale, type MessageKey } from "@/i18n";
import { AppButton, PageHeader, Panel } from "@/components/AppUI";
import { AppModal } from "@/shared/components/feedback/AppModal";
import { cn } from "@/shared/lib/cn";
import { toast } from "@/shared/lib/toast";
import { apiError } from "@/shared/lib/apiError";
import { examsApi } from "@/features/exams/api/examsApi";
import { ExamQuestionView } from "@/features/exams/components/ExamQuestionView";
import { isAnswered } from "@/features/exams/lib/examAnswers";
import { formatDateTime, formatRemaining } from "@/features/exams/lib/examLabels";
import type { ExamAnswer, ExamAttempt } from "@/features/exams/types";

type InProgress = Extract<ExamAttempt, { status: "in_progress" }>;
type NotStarted = Extract<ExamAttempt, { status: "not_started" }>;
type Submitted = Extract<ExamAttempt, { status: "submitted" }>;
type Released = Extract<ExamAttempt, { status: "released" }>;
type EventLog = Record<string, Array<{ t: number; action: string }>>;

const SAVE_DELAY_MS = 1500;
const RETRY_DELAY_MS = 10000;
const WARNINGS_MIN = [5, 1];
const status = (error: unknown) => (error as { response?: { status?: number } }).response?.status;

function Intro({ data, starting, onStart }: { data: NotStarted; starting: boolean; onStart: () => void }) {
  return (
    <Panel className="space-y-4 font-[Poppins]">
      <h2 className="text-base font-semibold text-white">{t("exams.take.intro")}</h2>
      {data.instructions && <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-200">{data.instructions}</p>}
      <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-300">
        <li>{t("exams.take.rulesQuestions", { count: data.questionCount })}</li>
        {data.timeLimitMinutes && <li>{t("exams.take.rulesTime", { minutes: data.timeLimitMinutes })}</li>}
        {data.closesAt && <li>{t("exams.take.rulesClose", { date: formatDateTime(data.closesAt) })}</li>}
        <li>{t("exams.take.rulesOnce")}</li>
        <li>{t("exams.take.rulesNoFeedback")}</li>
        <li>{t("exams.take.rulesAutosave")}</li>
      </ul>
      {data.state === "scheduled" && data.opensAt ? (
        <p role="status" className="text-sm text-amber-300">{t("exams.take.notOpen", { date: formatDateTime(data.opensAt) })}</p>
      ) : data.state === "open" ? (
        <AppButton type="button" onClick={onStart} disabled={starting} aria-busy={starting || undefined} className="w-full sm:w-auto">
          {starting ? t("exams.take.starting") : t("exams.take.start")}
        </AppButton>
      ) : (
        <p role="status" className="text-sm text-zinc-300">{t("exams.take.closedNotice")}</p>
      )}
    </Panel>
  );
}

function Done({ data }: { data: Submitted }) {
  return (
    <Panel className="space-y-3 font-[Poppins]">
      <h2 className="flex items-center gap-2 text-base font-semibold text-emerald-300">
        <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
        {t("exams.take.submittedTitle")}
      </h2>
      {data.submittedAt && <p className="text-sm text-zinc-200">{t("exams.take.submittedAt", { date: formatDateTime(data.submittedAt) })}</p>}
      {data.submitReason === "time_limit" && <p className="text-sm text-amber-300">{t("exams.take.submittedTime")}</p>}
      {data.submitReason === "exam_closed" && <p className="text-sm text-amber-300">{t("exams.take.submittedClosed")}</p>}
      <p className="text-sm text-zinc-400">{t("exams.take.awaiting")}</p>
    </Panel>
  );
}

const OUTCOME_STYLE = {
  correct: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
  partial: "border-amber-400/40 bg-amber-500/10 text-amber-300",
  incorrect: "border-red-400/40 bg-red-500/10 text-red-300",
  blank: "border-white/10 bg-white/5 text-zinc-300",
} as const;

/** Released result (RF59): grade, outcome and points per question and the professor's comments. */
function Result({ data }: { data: Released }) {
  return (
    <div className="space-y-4 font-[Poppins]">
      <Panel>
        <p className="text-2xl font-semibold text-white">{t("exams.result.grade", { grade: data.grade === null ? "—" : number(data.grade, { maximumFractionDigits: 2 }) })}</p>
        {data.submittedAt && <p className="mt-1 text-sm text-zinc-400">{t("exams.take.submittedAt", { date: formatDateTime(data.submittedAt) })}</p>}
      </Panel>
      <ol className="space-y-3">
        {data.questions.map((question) => (
          <li key={question.position}>
            <article aria-labelledby={`result-q-${question.position}`} className="space-y-2 rounded-2xl border border-white/10 bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id={`result-q-${question.position}`} className="text-sm font-semibold text-blue-300">{t("exams.result.question", { position: question.position })}</h2>
                <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", OUTCOME_STYLE[question.outcome])}>{t(`exams.result.outcome.${question.outcome}` as MessageKey)}</span>
                <span className="text-xs text-zinc-400">{t("exams.result.points", { points: number(question.points), weight: number(question.weight) })}</span>
              </div>
              <p lang={question.language} className="whitespace-pre-wrap break-words text-sm text-zinc-100">{question.statement}</p>
              {question.comment && (
                <div className="rounded-r-xl border-l-4 border-blue-400/60 bg-neutral-950/40 p-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{t("exams.result.comment")}</h3>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-zinc-200">{question.comment}</p>
                </div>
              )}
            </article>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Runner({ attempt, onFinished }: { attempt: InProgress; onFinished: (value: ExamAttempt) => void }) {
  useLocale();
  const examId = attempt.examId;
  const [answers, setAnswers] = useState<Record<string, ExamAnswer>>(attempt.answers);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const events = useRef<EventLog>({});
  const startedAt = useRef(Date.now());
  // Server time minus local time: the countdown never trusts the device clock.
  const offset = useRef(+new Date(attempt.serverNow) - Date.now());
  const deadline = attempt.deadlineAt ? +new Date(attempt.deadlineAt) : null;
  const [remaining, setRemaining] = useState<number | null>(deadline === null ? null : deadline - (Date.now() + offset.current));
  const [announcement, setAnnouncement] = useState("");
  const [save, setSave] = useState<{ kind: "idle" | "saving" | "saved" | "error"; at?: string }>(attempt.lastSavedAt ? { kind: "saved", at: attempt.lastSavedAt } : { kind: "idle" });
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const dirty = useRef(false);
  const saving = useRef(false);
  const finished = useRef(false);
  const timer = useRef<number>();
  const warned = useRef<number[]>([]);

  const finish = useCallback((value: ExamAttempt) => {
    finished.current = true;
    window.clearTimeout(timer.current);
    onFinished(value);
  }, [onFinished]);

  const saveNow = useCallback(async () => {
    if (saving.current || finished.current || !dirty.current) return;
    saving.current = true;
    dirty.current = false;
    const pending = events.current;
    events.current = {};
    setSave({ kind: "saving" });
    try {
      const result = await examsApi.saveDraft(examId, answersRef.current, pending);
      setSave({ kind: "saved", at: result.savedAt });
    } catch (error) {
      if (status(error) === 409) {
        finish(await examsApi.getAttempt(examId));
        return;
      }
      Object.keys(pending).forEach((key) => { events.current[key] = [...pending[key], ...(events.current[key] ?? [])]; });
      dirty.current = true;
      setSave({ kind: "error" });
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => { void saveNow(); }, RETRY_DELAY_MS);
    } finally {
      saving.current = false;
      if (dirty.current && !finished.current && !timer.current) timer.current = window.setTimeout(() => { timer.current = undefined; void saveNow(); }, SAVE_DELAY_MS);
    }
  }, [examId, finish]);

  const scheduleSave = () => {
    dirty.current = true;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { timer.current = undefined; void saveNow(); }, SAVE_DELAY_MS);
  };

  const submit = useCallback(async () => {
    if (finished.current) return;
    finished.current = true;
    window.clearTimeout(timer.current);
    setSubmitting(true);
    try {
      onFinished(await examsApi.submit(examId, answersRef.current, events.current));
    } catch (error) {
      if (status(error) === 409) { onFinished(await examsApi.getAttempt(examId)); return; }
      finished.current = false;
      setSubmitting(false);
      toast.error(apiError(error));
    }
  }, [examId, onFinished]);

  // Countdown with warnings at 5 and 1 minute; at zero the server already treats it as submitted.
  useEffect(() => {
    if (deadline === null) return;
    const tick = () => {
      const left = deadline - (Date.now() + offset.current);
      setRemaining(left);
      WARNINGS_MIN.forEach((minutes) => {
        if (left <= minutes * 60000 && left > 0 && warned.current.indexOf(minutes) === -1) {
          warned.current.push(minutes);
          setAnnouncement(t("exams.take.timerWarn", { minutes }));
        }
      });
      if (left <= 0) void submit();
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [deadline, submit]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const setAnswer = (questionId: string, answer: ExamAnswer) => {
    setAnswers((current) => ({ ...current, [questionId]: answer }));
    scheduleSave();
  };
  const recordEvent = (questionId: string, action: string) => {
    const list = events.current[questionId] ?? [];
    if (list.length < 200) list.push({ t: Date.now() - startedAt.current, action });
    events.current[questionId] = list;
  };
  const goTo = (index: number) => {
    const element = document.getElementById(`question-${index + 1}`);
    element?.scrollIntoView({ block: "start" });
    element?.focus({ preventScroll: true });
  };
  const unanswered = attempt.questions.filter((question) => !isAnswered(answers[question.id])).length;

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-20 -mx-4 border-b border-white/10 bg-neutral-900/95 px-4 py-2 backdrop-blur md:-mx-8 md:px-8">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 font-[Poppins] text-sm">
          {remaining !== null ? (
            <p role="timer" className={cn("flex items-center gap-1.5 font-semibold tabular-nums", remaining <= 5 * 60000 ? "text-amber-300" : "text-white")}>
              <Timer aria-hidden="true" className="h-4 w-4" />
              {t("exams.take.timer", { time: formatRemaining(remaining) })}
            </p>
          ) : <span />}
          <p className="text-xs text-zinc-400">
            {save.kind === "saving" ? t("exams.take.saving") : save.kind === "saved" && save.at ? t("exams.take.saved", { time: new Date(save.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }) : ""}
          </p>
        </div>
      </div>
      <p aria-live="polite" className="sr-only">{announcement}</p>
      {save.kind === "error" && <p role="alert" className="font-[Poppins] text-sm text-red-300">{t("exams.take.saveError")}</p>}

      {attempt.instructions && <Panel><p className="whitespace-pre-wrap break-words font-[Poppins] text-sm text-zinc-200">{attempt.instructions}</p></Panel>}

      <nav aria-label={t("exams.take.navLabel")}>
        <ol className="flex flex-wrap gap-2">
          {attempt.questions.map((question, index) => {
            const answered = isAnswered(answers[question.id]);
            return (
              <li key={question.id}>
                <button type="button" onClick={() => goTo(index)}
                  aria-label={t("exams.take.navItem", { index: index + 1, state: answered ? t("exams.take.navAnswered") : t("exams.take.navBlank") })}
                  className={cn("inline-flex h-11 min-w-[2.75rem] items-center justify-center rounded-lg border px-2 font-[Poppins] text-sm font-semibold transition-colors",
                    answered ? "border-blue-400/40 bg-blue-600 text-on-accent" : "border-control bg-neutral-950/60 text-white hover:bg-white/10")}>
                  {index + 1}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {attempt.questions.map((question, index) => (
        <ExamQuestionView key={question.id} question={question} index={index} total={attempt.questions.length}
          answer={answers[question.id]} onAnswer={(answer) => setAnswer(question.id, answer)} onEvent={(action) => recordEvent(question.id, action)} />
      ))}

      <AppButton type="button" onClick={() => setConfirming(true)} disabled={submitting} aria-busy={submitting || undefined} className="w-full sm:w-auto">
        <Send aria-hidden="true" className="h-4 w-4" />
        {t("exams.take.submit")}
      </AppButton>

      <AppModal
        isOpen={confirming}
        type="update"
        title={t("exams.take.submitTitle")}
        description={t("exams.take.submitDescription")}
        acceptLabel={t("exams.take.confirmSubmit")}
        cancelLabel={t("exams.take.backToExam")}
        disabled={submitting}
        onConfirm={() => { setConfirming(false); void submit(); }}
        onCancel={() => setConfirming(false)}
        onClose={() => setConfirming(false)}
      >
        <p className={cn("font-[Poppins] text-sm", unanswered ? "text-amber-300" : "text-zinc-300")}>
          {unanswered ? t("exams.take.unanswered", { count: unanswered }) : t("exams.take.allAnswered")}
        </p>
      </AppModal>
    </div>
  );
}

export function ExamTakePage() {
  useLocale();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const attempt = useQuery({ queryKey: ["examAttempt", id], queryFn: () => examsApi.getAttempt(id!), refetchOnWindowFocus: false });
  const setAttempt = useCallback((value: ExamAttempt) => {
    queryClient.setQueryData(["examAttempt", id], value);
    queryClient.invalidateQueries({ queryKey: ["studentExams"] });
  }, [queryClient, id]);
  const start = useMutation({
    mutationFn: () => examsApi.start(id!),
    onSuccess: setAttempt,
    onError: (error) => { toast.error(apiError(error)); void attempt.refetch(); },
  });
  const data = attempt.data;

  return (
    <main className="relative flex-1 overflow-y-auto px-4 pb-8 pt-4 md:px-8 md:pb-10">
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <Link to="/exams" className="inline-flex min-h-[2.75rem] items-center gap-2 font-[Poppins] text-sm text-zinc-300 hover:text-white">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          {t("exams.take.back")}
        </Link>
        {attempt.isError ? (
          <p role="alert" className="font-[Poppins] text-sm text-red-300">{t("exams.take.loadError")}</p>
        ) : !data ? (
          <p role="status" className="font-[Poppins] text-sm text-zinc-400">{t("common.carregando")}</p>
        ) : (
          <>
            <PageHeader icon={<ClipboardCheck aria-hidden="true" className="h-5 w-5" />} title={data.title} />
            {data.status === "not_started" && <Intro data={data} starting={start.isPending} onStart={() => start.mutate()} />}
            {data.status === "in_progress" && <Runner key={data.startedAt} attempt={data} onFinished={setAttempt} />}
            {data.status === "submitted" && <Done data={data} />}
            {data.status === "released" && <Result data={data} />}
          </>
        )}
      </div>
    </main>
  );
}
