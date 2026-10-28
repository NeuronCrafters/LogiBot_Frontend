import { useState, useMemo } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  EyeOff,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { academicFiltersApi } from "@/services/apiClient";
import { professorQuizApi } from "@/features/quiz/api/quizApi";
import { QUIZ_TOPICS } from "@/features/quiz/types";
import type {
  ProfessorQuiz,
  QuizQuestionWithAnswer,
} from "@/features/quiz/types";
import { AiQuizForm } from "@/features/quiz/components/AiQuizForm";
import { AppModal } from "@/shared/components/feedback/AppModal";
import { toast } from "@/shared/lib/toast";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const TOPIC_LABEL: Record<string, string> = Object.fromEntries(
  QUIZ_TOPICS.map((t) => [t.value, t.label]),
);

const LETTERS = ["A", "B", "C", "D", "E"] as const;

const inputCls =
  "h-11 w-full rounded-xl border border-white/10 bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-indigo-500/60 placeholder:text-zinc-600";
const labelCls =
  "block mb-1.5 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500";

// ── Modal shell ────────────────────────────────────────────────────────────────

function Modal({
  title,
  icon,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  icon: ReactNode;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex min-h-full items-start justify-center px-4 py-10">
        <div className={`w-full ${wide ? "max-w-3xl" : "max-w-lg"}`}>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1c1c1c] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                  {icon}
                </div>
                <h2 className="font-[Poppins] text-base font-semibold text-white">
                  {title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Quiz form (create / edit) ──────────────────────────────────────────────────

function QuizForm({
  disciplines,
  initial,
  onSubmit,
  isPending,
}: {
  disciplines: Array<{ id: string; name: string }>;
  initial?: Partial<ProfessorQuiz>;
  onSubmit: (data: {
    title: string;
    disciplineId: string;
    topic: string;
    description: string;
  }) => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [disciplineId, setDisciplineId] = useState(
    initial?.disciplineId ?? "",
  );
  const [topic, setTopic] = useState(initial?.topic ?? "");
  const [description, setDescription] = useState(
    initial?.description ?? "",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !disciplineId || !topic) return;
    onSubmit({ title: title.trim(), disciplineId, topic, description: description.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Quiz Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Variables Quiz"
          required
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>Subject</label>
        <Select
          value={disciplineId}
          onChange={setDisciplineId}
          placeholder="Select the subject"
          options={disciplines.map((d) => ({ value: d.id, label: d.name }))}
        />
      </div>
      <div>
        <label className={labelCls}>Topic</label>
        <Select
          value={topic}
          onChange={setTopic}
          placeholder="Select the topic"
          options={QUIZ_TOPICS.map((t) => ({ value: t.value, label: t.label }))}
        />
      </div>
      <div>
        <label className={labelCls}>Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the goal of this quiz..."
          rows={2}
          className="w-full resize-none rounded-xl border border-white/10 bg-neutral-950/60 px-3 py-2.5 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-indigo-500/60 placeholder:text-zinc-600"
        />
      </div>
      <button
        type="submit"
        disabled={isPending || !title.trim() || !disciplineId || !topic}
        className="h-11 w-full rounded-lg bg-indigo-600 font-[Poppins] text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </span>
        ) : initial?.id ? (
          "Save changes"
        ) : (
          "Create Quiz"
        )}
      </button>
    </form>
  );
}

// ── Question editor form ───────────────────────────────────────────────────────

function QuestionForm({
  initial,
  onSubmit,
  onCancel,
  isPending,
}: {
  initial?: Partial<QuizQuestionWithAnswer>;
  onSubmit: (data: {
    question: string;
    options: string[];
    correctOption: string;
    explanation: string;
  }) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [question, setQuestion] = useState(initial?.question ?? "");
  const [options, setOptions] = useState<string[]>(
    initial?.options ?? ["", "", "", ""],
  );
  const [correctOption, setCorrectOption] = useState(
    initial?.correctOption ?? "A",
  );
  const [explanation, setExplanation] = useState(
    initial?.explanation ?? "",
  );

  const setOption = (i: number, val: string) =>
    setOptions((prev) => {
      const next = [...prev];
      next[i] = val;
      return next;
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filled = options.filter((o) => o.trim());
    if (!question.trim() || filled.length < 2) return;
    onSubmit({
      question: question.trim(),
      options: options.map((o) => o.trim()).filter(Boolean),
      correctOption,
      explanation: explanation.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-neutral-950/40 p-4">
      <div>
        <label className={labelCls}>Question</label>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type the question..."
          required
          className={inputCls}
        />
      </div>
      <div className="space-y-2">
        <label className={labelCls}>Options</label>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 font-[Poppins] text-xs font-bold text-zinc-500">
              {LETTERS[i]}
            </span>
            <input
              value={options[i] ?? ""}
              onChange={(e) => setOption(i, e.target.value)}
              placeholder={`Option ${LETTERS[i]}`}
              className={inputCls}
            />
          </div>
        ))}
      </div>
      <div>
        <label className={labelCls}>Correct answer</label>
        <Select
          value={correctOption}
          onChange={setCorrectOption}
          placeholder="Select the correct answer"
          options={options
            .map((opt, i) => (opt.trim() ? { value: LETTERS[i], label: `${LETTERS[i]} — ${opt}` } : null))
            .filter((o): o is NonNullable<typeof o> => o !== null)}
        />
      </div>
      <div>
        <label className={labelCls}>Explanation (optional)</label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Explain why this is the correct answer..."
          rows={2}
          className="w-full resize-none rounded-xl border border-white/10 bg-neutral-950/60 px-3 py-2.5 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-indigo-500/60 placeholder:text-zinc-600"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="h-9 flex-1 rounded-lg bg-indigo-600 font-[Poppins] text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : initial?.id ? "Save" : "Add"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-9 rounded-lg border border-white/10 bg-white/5 px-4 font-[Poppins] text-sm text-zinc-300 hover:bg-white/10"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Questions panel (inside modal) ─────────────────────────────────────────────

function QuestionsPanel({ quizId }: { quizId: string }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["professorQuizQuestions", quizId],
    queryFn: () => professorQuizApi.getQuestions(quizId),
    staleTime: 60 * 1000,
  });

  const addMutation = useMutation({
    mutationFn: (data: Parameters<typeof professorQuizApi.addQuestion>[1]) =>
      professorQuizApi.addQuestion(quizId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professorQuizQuestions", quizId] });
      queryClient.invalidateQueries({ queryKey: ["professorQuizzes"] });
      setShowForm(false);
      toast.success("Question added.");
    },
    onError: () => toast.error("Failed to add question."),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      questionId,
      data,
    }: {
      questionId: string;
      data: Parameters<typeof professorQuizApi.updateQuestion>[2];
    }) => professorQuizApi.updateQuestion(quizId, questionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professorQuizQuestions", quizId] });
      setEditingId(null);
      toast.success("Question updated.");
    },
    onError: () => toast.error("Failed to update question."),
  });

  const deleteMutation = useMutation({
    mutationFn: (questionId: string) =>
      professorQuizApi.deleteQuestion(quizId, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professorQuizQuestions", quizId] });
      queryClient.invalidateQueries({ queryKey: ["professorQuizzes"] });
      setDeleteId(null);
      toast.success("Question removed.");
    },
    onError: () => toast.error("Failed to remove question."),
  });

  return (
    <div className="space-y-3">
      {isLoading && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
        </div>
      )}

      {!isLoading && questions.length === 0 && !showForm && (
        <div className="rounded-xl border border-dashed border-white/10 py-8 text-center">
          <p className="font-[Poppins] text-sm text-zinc-500">
            No questions yet.
          </p>
        </div>
      )}

      {questions.map((q, i) =>
        editingId === q.id ? (
          <QuestionForm
            key={q.id}
            initial={q}
            onSubmit={(data) =>
              updateMutation.mutate({ questionId: q.id, data })
            }
            onCancel={() => setEditingId(null)}
            isPending={updateMutation.isPending}
          />
        ) : (
          <div
            key={q.id}
            className="flex items-start gap-3 rounded-xl border border-white/10 bg-neutral-950/40 p-4"
          >
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 font-[Poppins] text-xs font-bold text-indigo-400">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-[Poppins] text-sm text-white">{q.question}</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {q.options.map((opt, oi) => (
                  <span
                    key={oi}
                    className={`rounded-md px-2 py-0.5 font-[Poppins] text-[10px] ${
                      LETTERS[oi] === q.correctOption
                        ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border border-white/10 bg-white/5 text-zinc-600"
                    }`}
                  >
                    {LETTERS[oi]}: {opt}
                  </span>
                ))}
              </div>
              {q.explanation && (
                <p className="mt-2 font-[Poppins] text-[11px] leading-relaxed text-zinc-500">
                  <span className="font-semibold text-zinc-400">Explanation: </span>
                  {q.explanation}
                </p>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => setEditingId(q.id)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-500 hover:text-white"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                onClick={() => setDeleteId(q.id)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-500 hover:border-red-500/30 hover:text-red-400"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ),
      )}

      {showForm ? (
        <QuestionForm
          onSubmit={(data) => addMutation.mutate(data)}
          onCancel={() => setShowForm(false)}
          isPending={addMutation.isPending}
        />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 font-[Poppins] text-sm text-zinc-500 transition-colors hover:border-indigo-500/30 hover:text-indigo-400"
        >
          <Plus className="h-4 w-4" />
          Add question
        </button>
      )}

      <AppModal
        isOpen={!!deleteId}
        type="delete"
        title="Remove question"
        description="This action cannot be undone."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        onClose={() => setDeleteId(null)}
        disabled={deleteMutation.isPending}
      />
    </div>
  );
}

// ── Results modal ──────────────────────────────────────────────────────────────

function ResultsModal({
  quizId,
  onClose,
}: {
  quizId: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["professorQuizResults", quizId],
    queryFn: () => professorQuizApi.getResults(quizId),
    staleTime: 2 * 60 * 1000,
  });

  return (
    <Modal
      wide
      title="Quiz Results"
      icon={<CheckCircle2 className="h-5 w-5" />}
      onClose={onClose}
    >
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      )}
      {data && !isLoading && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-[Poppins] text-xs text-zinc-400">
              {data.attempts.length}{" "}
              {data.attempts.length === 1 ? "attempt" : "attempts"}
            </span>
            {data.attempts.length > 0 && (
              <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 font-[Poppins] text-xs text-indigo-400">
                Average:{" "}
                {Math.round(
                  (data.attempts.reduce(
                    (sum, a) =>
                      sum + (a.totalQuestions ? (a.score / a.totalQuestions) * 100 : 0),
                    0,
                  ) /
                    data.attempts.length) *
                    10,
                ) / 10}
                %
              </span>
            )}
          </div>

          {data.attempts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 py-10 text-center">
              <p className="font-[Poppins] text-sm text-zinc-500">
                No student has answered this quiz yet.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Student", "Correct", "Score", "Date"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left font-[Poppins] text-[10px] font-semibold uppercase tracking-wider text-zinc-600"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.attempts.map((a) => {
                    const pct = a.totalQuestions
                      ? Math.round((a.score / a.totalQuestions) * 100)
                      : 0;
                    return (
                      <tr
                        key={a.attemptId}
                        className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-3 font-[Poppins] text-sm text-zinc-200">
                          {a.studentName}
                        </td>
                        <td className="px-4 py-3 font-[Poppins] text-sm text-zinc-400">
                          {a.score}/{a.totalQuestions}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 font-[Poppins] text-xs font-medium ${
                              pct >= 70
                                ? "bg-emerald-500/10 text-emerald-400"
                                : pct >= 50
                                  ? "bg-amber-500/10 text-amber-400"
                                  : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {pct}%
                          </span>
                        </td>
                        <td className="px-4 py-3 font-[Poppins] text-xs text-zinc-600">
                          {new Date(a.completedAt).toLocaleDateString("en-US")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ── Quiz card ──────────────────────────────────────────────────────────────────

function QuizCard({
  quiz,
  myDisciplines,
  onEdit,
  onDelete,
  onViewResults,
  onPublish,
  onUnpublish,
  onLinkToDisciplines,
  onUnlinkFromDiscipline,
  isExpanded,
  onToggleExpand,
  isPublishing,
  isLinking,
  isUnlinking,
}: {
  quiz: ProfessorQuiz;
  myDisciplines: { id: string; name: string }[];
  onEdit: () => void;
  onDelete: () => void;
  onViewResults: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onLinkToDisciplines: (quizId: string, disciplineIds: string[]) => void;
  onUnlinkFromDiscipline: (quizId: string, disciplineId: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isPublishing: boolean;
  isLinking: boolean;
  isUnlinking: boolean;
}) {
  const isDraft = quiz.status === "draft";
  const [selectedDisciplineIds, setSelectedDisciplineIds] = useState<string[]>(
    [],
  );

  const { data: linkedDisciplineIds = [] } = useQuery({
    queryKey: ["quizLinkedDisciplines", quiz.id],
    queryFn: () => professorQuizApi.getLinkedDisciplineIds(quiz.id),
    staleTime: 30 * 1000,
  });

  const toggleSelected = (disciplineId: string) => {
    setSelectedDisciplineIds((prev) =>
      prev.includes(disciplineId)
        ? prev.filter((id) => id !== disciplineId)
        : [...prev, disciplineId],
    );
  };

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-[#1f1f1f] shadow-md shadow-black/10 transition-colors hover:border-white/20 ${
        isDraft ? "border-white/10" : "border-emerald-500/20"
      }`}
    >
      <div className="flex items-start gap-3 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
          <Brain className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-[Poppins] text-sm font-semibold leading-snug text-white">
              {quiz.title}
            </p>
            {isDraft ? (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-[Poppins] text-[10px] font-medium text-amber-400">
                Draft
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-[Poppins] text-[10px] font-medium text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Published
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {(quiz.disciplines?.length
              ? quiz.disciplines
              : [{ id: quiz.disciplineId, name: quiz.disciplineName }]
            ).map((discipline) => (
              <span
                key={discipline.id}
                className="inline-flex items-center gap-1 rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 font-[Poppins] text-[10px] font-medium text-indigo-400"
              >
                <BookOpen className="h-3 w-3" />
                {discipline.name}
              </span>
            ))}
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-[Poppins] text-[10px] text-zinc-500">
              {TOPIC_LABEL[quiz.topic] ?? quiz.topic}
            </span>
            {quiz.generationSource === "ai" && (
              <span className="flex items-center gap-1 rounded-md border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 font-[Poppins] text-[10px] font-medium text-purple-400">
                <Sparkles className="h-2.5 w-2.5" />
                AI
              </span>
            )}
            <span className="font-[Poppins] text-[10px] text-zinc-600">
              {quiz.questionCount} {quiz.questionCount === 1 ? "question" : "questions"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-white/5 px-5 py-3">
        <button
          onClick={onToggleExpand}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 font-[Poppins] text-xs text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          Questions
        </button>
        <button
          onClick={onViewResults}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 font-[Poppins] text-xs text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Users className="h-3 w-3" />
          Results
        </button>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 font-[Poppins] text-xs text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Pencil className="h-3 w-3" />
          Edit
        </button>

        <Dialog>
          <DialogTrigger>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 font-[Poppins] text-xs text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Link2 className="h-3 w-3" />
              Subjects
            </button>
          </DialogTrigger>
          <DialogContent className="border-white/10 bg-neutral-900 text-white">
            <DialogHeader>
              <DialogTitle className="font-[Poppins] text-white">
                Link to another subject
              </DialogTitle>
              <DialogDescription className="font-[Poppins] text-zinc-400">
                Use this same quiz in another subject, without duplicating questions.
              </DialogDescription>
            </DialogHeader>

            {myDisciplines.length ? (
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {myDisciplines.map((discipline) => {
                  const alreadyLinked = linkedDisciplineIds.includes(
                    discipline.id,
                  );
                  const checked =
                    alreadyLinked || selectedDisciplineIds.includes(discipline.id);
                  const isLastLink =
                    alreadyLinked && linkedDisciplineIds.length <= 1;
                  return (
                    <div
                      key={discipline.id}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-white/5"
                    >
                      <label
                        className={`flex flex-1 items-center gap-2.5 ${
                          alreadyLinked ? "cursor-default" : "cursor-pointer"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={alreadyLinked}
                          onChange={() => toggleSelected(discipline.id)}
                          className="sr-only"
                        />
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                            checked
                              ? alreadyLinked
                                ? "border-emerald-600/60 bg-emerald-600/40"
                                : "border-indigo-500 bg-indigo-600"
                              : "border-white/20 bg-transparent"
                          }`}
                        >
                          {checked && (
                            <Check className="h-3 w-3 text-white" strokeWidth={3} />
                          )}
                        </span>
                        <span
                          className={`font-[Poppins] text-sm ${
                            alreadyLinked ? "text-zinc-500" : "text-zinc-200"
                          }`}
                        >
                          {discipline.name}
                        </span>
                      </label>
                      {alreadyLinked && (
                        <button
                          type="button"
                          disabled={isLastLink || isUnlinking}
                          title={
                            isLastLink
                              ? "A quiz needs at least one subject"
                              : "Unlink"
                          }
                          onClick={() =>
                            onUnlinkFromDiscipline(quiz.id, discipline.id)
                          }
                          className="shrink-0 rounded-lg p-1 text-zinc-600 transition-colors hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="font-[Poppins] text-sm text-zinc-500">
                No subject available.
              </p>
            )}

            <DialogFooter>
              <button
                type="button"
                disabled={!selectedDisciplineIds.length || isLinking}
                onClick={() =>
                  onLinkToDisciplines(quiz.id, selectedDisciplineIds)
                }
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-4 font-[Poppins] text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLinking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                Link
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Publish / unpublish */}
        {isDraft ? (
          <button
            onClick={onPublish}
            disabled={isPublishing || quiz.questionCount === 0}
            title={quiz.questionCount === 0 ? "Add at least one question" : undefined}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 font-[Poppins] text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPublishing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
            Publish
          </button>
        ) : (
          <button
            onClick={onUnpublish}
            disabled={isPublishing}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 font-[Poppins] text-xs text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            {isPublishing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <EyeOff className="h-3 w-3" />
            )}
            Unpublish
          </button>
        )}

        <button
          onClick={onDelete}
          className="ml-auto flex items-center justify-center rounded-lg border border-white/10 bg-white/5 p-1.5 text-zinc-600 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-white/5 p-5">
          <QuestionsPanel quizId={quiz.id} />
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export function ProfessorQuizPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [createModal, setCreateModal] = useState(false);
  const [aiModal, setAiModal] = useState(false);
  const [editTarget, setEditTarget] = useState<ProfessorQuiz | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProfessorQuiz | null>(null);
  const [resultsQuizId, setResultsQuizId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const userDisciplineIds: string[] = useMemo(() => {
    const raw = user?.disciplines;
    if (!raw) return [];
    if (Array.isArray(raw))
      return raw.map((d) =>
        typeof d === "string" ? d : (d as any).id ?? (d as any)._id ?? "",
      ).filter(Boolean);
    return [String(raw)];
  }, [user]);

  const { data: academicData } = useQuery({
    queryKey: ["academicData"],
    queryFn: async () => {
      const res = await academicFiltersApi.getAcademicData();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const myDisciplines = useMemo(() => {
    if (!academicData) return [];
    const all: Array<{ id: string; name: string }> = [];
    for (const uni of academicData.universities ?? []) {
      for (const course of uni.courses ?? []) {
        for (const disc of course.disciplines ?? []) {
          if (userDisciplineIds.includes(disc._id)) {
            all.push({ id: disc._id, name: disc.name });
          }
        }
      }
    }
    return all;
  }, [academicData, userDisciplineIds]);

  const { data: quizzes = [], isLoading, error, refetch } = useQuery({
    queryKey: ["professorQuizzes"],
    queryFn: () => professorQuizApi.getMyQuizzes(),
    staleTime: 2 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: professorQuizApi.createQuiz,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professorQuizzes"] });
      setCreateModal(false);
      toast.success("Quiz created successfully!");
    },
    onError: () => toast.error("Failed to create quiz."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof professorQuizApi.updateQuiz>[1] }) =>
      professorQuizApi.updateQuiz(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professorQuizzes"] });
      setEditTarget(null);
      toast.success("Quiz updated.");
    },
    onError: () => toast.error("Failed to update quiz."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => professorQuizApi.deleteQuiz(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professorQuizzes"] });
      setDeleteTarget(null);
      toast.success("Quiz deleted.");
    },
    onError: () => toast.error("Failed to delete quiz."),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => professorQuizApi.publishQuiz(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professorQuizzes"] });
      toast.success("Quiz published! Students can now answer it.");
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Failed to publish quiz."),
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => professorQuizApi.unpublishQuiz(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professorQuizzes"] });
      toast.success("Quiz moved back to draft.");
    },
    onError: () => toast.error("Failed to unpublish quiz."),
  });

  const linkDisciplinesMutation = useMutation({
    mutationFn: ({ quizId, disciplineIds }: { quizId: string; disciplineIds: string[] }) =>
      professorQuizApi.linkQuizToDisciplines(quizId, disciplineIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["professorQuizzes"] });
      queryClient.invalidateQueries({
        queryKey: ["quizLinkedDisciplines", variables.quizId],
      });
      toast.success("Quiz linked to the subject.");
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Failed to link quiz."),
  });

  const unlinkDisciplineMutation = useMutation({
    mutationFn: ({ quizId, disciplineId }: { quizId: string; disciplineId: string }) =>
      professorQuizApi.unlinkQuizFromDiscipline(quizId, disciplineId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["professorQuizzes"] });
      queryClient.invalidateQueries({
        queryKey: ["quizLinkedDisciplines", variables.quizId],
      });
      toast.success("Quiz unlinked from the subject.");
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Failed to unlink quiz."),
  });

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        {/* Header */}
        <section className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5 shadow-lg shadow-black/10 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-[Poppins] text-2xl font-semibold text-white">
                  My Quizzes
                </h1>
                <p className="mt-1 font-[Poppins] text-sm leading-relaxed text-zinc-400">
                  Create and manage quizzes for your subjects.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => setAiModal(true)}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 font-[Poppins] text-sm font-semibold text-indigo-300 transition-colors hover:border-indigo-500/60 hover:bg-indigo-500/20"
              >
                <Sparkles className="h-4 w-4" />
                Create with AI
              </button>
              <button
                onClick={() => setCreateModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 font-[Poppins] text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Create Quiz
              </button>
            </div>
          </div>
        </section>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 py-16">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="font-[Poppins] text-sm text-zinc-400">
              Failed to load quizzes.
            </p>
            <button
              onClick={() => refetch()}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 font-[Poppins] text-sm text-red-300 hover:bg-red-500/20"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !error && quizzes.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/10 bg-[#1f1f1f] py-20">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-neutral-950/60 text-zinc-700">
              <Brain className="h-7 w-7" />
            </div>
            <div className="text-center">
              <p className="font-[Poppins] text-sm font-semibold text-white">
                No quiz created
              </p>
              <p className="mt-1 max-w-xs font-[Poppins] text-xs leading-relaxed text-zinc-500">
                Create your first quiz for the students of your subjects.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAiModal(true)}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 font-[Poppins] text-sm font-semibold text-indigo-300 hover:border-indigo-500/60 hover:bg-indigo-500/20"
              >
                <Sparkles className="h-4 w-4" />
                Create with AI
              </button>
              <button
                onClick={() => setCreateModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 font-[Poppins] text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Create Quiz
              </button>
            </div>
          </div>
        )}

        {!isLoading && !error && quizzes.length > 0 && (
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                myDisciplines={myDisciplines}
                onEdit={() => setEditTarget(quiz)}
                onDelete={() => setDeleteTarget(quiz)}
                onViewResults={() => setResultsQuizId(quiz.id)}
                onPublish={() => publishMutation.mutate(quiz.id)}
                onUnpublish={() => unpublishMutation.mutate(quiz.id)}
                onLinkToDisciplines={(quizId, disciplineIds) =>
                  linkDisciplinesMutation.mutate({ quizId, disciplineIds })
                }
                onUnlinkFromDiscipline={(quizId, disciplineId) =>
                  unlinkDisciplineMutation.mutate({ quizId, disciplineId })
                }
                isExpanded={expandedId === quiz.id}
                onToggleExpand={() =>
                  setExpandedId((prev) => (prev === quiz.id ? null : quiz.id))
                }
                isPublishing={
                  (publishMutation.isPending || unpublishMutation.isPending) &&
                  (publishMutation.variables === quiz.id || unpublishMutation.variables === quiz.id)
                }
                isLinking={
                  linkDisciplinesMutation.isPending &&
                  linkDisciplinesMutation.variables?.quizId === quiz.id
                }
                isUnlinking={
                  unlinkDisciplineMutation.isPending &&
                  unlinkDisciplineMutation.variables?.quizId === quiz.id
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* AI generate modal */}
      {aiModal && (
        <Modal
          title="Create Quiz with AI"
          icon={<Sparkles className="h-5 w-5" />}
          onClose={() => setAiModal(false)}
          wide
        >
          <AiQuizForm onClose={() => setAiModal(false)} />
        </Modal>
      )}

      {/* Create modal */}
      {createModal && (
        <Modal
          title="Create Quiz"
          icon={<Brain className="h-5 w-5" />}
          onClose={() => setCreateModal(false)}
        >
          <QuizForm
            disciplines={myDisciplines}
            onSubmit={(data) => createMutation.mutate(data)}
            isPending={createMutation.isPending}
          />
        </Modal>
      )}

      {/* Edit modal */}
      {editTarget && (
        <Modal
          title="Edit Quiz"
          icon={<Pencil className="h-5 w-5" />}
          onClose={() => setEditTarget(null)}
        >
          <QuizForm
            disciplines={myDisciplines}
            initial={editTarget}
            onSubmit={(data) =>
              updateMutation.mutate({ id: editTarget.id, data })
            }
            isPending={updateMutation.isPending}
          />
        </Modal>
      )}

      {/* Results modal */}
      {resultsQuizId && (
        <ResultsModal
          quizId={resultsQuizId}
          onClose={() => setResultsQuizId(null)}
        />
      )}

      {/* Delete confirm */}
      <AppModal
        isOpen={!!deleteTarget}
        type="delete"
        title={`Delete "${deleteTarget?.title}"`}
        description="All questions and attempts of this quiz will be permanently removed."
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        onClose={() => setDeleteTarget(null)}
        disabled={deleteMutation.isPending}
      />
    </main>
  );
}
