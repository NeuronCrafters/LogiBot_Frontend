import { useState, useMemo } from "react";
import { useQueries, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";
import { ragApi } from "@/features/rag/api/ragApi";
import { professorQuizApi } from "@/features/quiz/api/quizApi";
import { academicFiltersApi } from "@/services/apiClient";
import { toast } from "@/shared/lib/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";

const inputCls =
  "h-11 w-full rounded-xl border border-white/10 bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-indigo-500/60 placeholder:text-zinc-600 disabled:opacity-40";
const labelCls =
  "block mb-1.5 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500";
const selectCls = inputCls + " cursor-pointer";

type DocWithClass = {
  id: string;
  title: string;
  originalFileName: string;
  className: string;
};

type Props = {
  onClose: () => void;
};

export function AiQuizForm({ onClose }: Props) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [disciplineId, setDisciplineId] = useState("");
  const [theme, setTheme] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // User's managed disciplines from academic data
  const { data: academicData } = useQuery({
    queryKey: ["academicData"],
    queryFn: async () => {
      const res = await academicFiltersApi.getAcademicData();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const userDisciplineIds = useMemo(() => {
    const raw = user?.disciplines;
    if (!raw) return [];
    if (Array.isArray(raw))
      return raw.map((d) =>
        typeof d === "string" ? d : (d as any).id ?? (d as any)._id ?? "",
      ).filter(Boolean);
    return [String(raw)];
  }, [user]);

  const disciplines = useMemo(() => {
    if (!academicData) return [];
    const result: Array<{ id: string; name: string }> = [];
    for (const uni of academicData.universities ?? []) {
      for (const course of uni.courses ?? []) {
        for (const disc of course.disciplines ?? []) {
          if (userDisciplineIds.includes(disc._id)) {
            result.push({ id: disc._id, name: disc.name });
          }
        }
      }
    }
    return result;
  }, [academicData, userDisciplineIds]);

  // Load all manageable classes then fetch documents in parallel
  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ["ragClasses"],
    queryFn: () => ragApi.listClasses(),
    staleTime: 60_000,
  });

  const docQueries = useQueries({
    queries: classes.map((c) => ({
      queryKey: ["ragDocuments", c.id],
      queryFn: () => ragApi.listDocuments(c.id).then((docs) =>
        docs
          .filter((d) => d.status === "ready" && !d.deletedAt)
          .map((d) => ({ ...d, className: c.name })),
      ),
      staleTime: 30_000,
    })),
  });

  const loadingDocs = loadingClasses || docQueries.some((q) => q.isLoading);

  const readyDocs = useMemo<DocWithClass[]>(() => {
    const seen = new Set<string>();
    const result: DocWithClass[] = [];
    for (const q of docQueries) {
      for (const doc of q.data ?? []) {
        if (!seen.has(doc.id)) {
          seen.add(doc.id);
          result.push({
            id: doc.id,
            title: doc.title || doc.originalFileName,
            originalFileName: doc.originalFileName,
            className: doc.className,
          });
        }
      }
    }
    // Group by class: sort so docs from the same class are together
    return result.sort((a, b) => a.className.localeCompare(b.className));
  }, [docQueries]);

  // Group docs by class name for display
  const docsByClass = useMemo(() => {
    const map = new Map<string, DocWithClass[]>();
    for (const doc of readyDocs) {
      if (!map.has(doc.className)) map.set(doc.className, []);
      map.get(doc.className)!.push(doc);
    }
    return [...map.entries()];
  }, [readyDocs]);

  const generateMutation = useMutation({
    mutationFn: professorQuizApi.generateAiQuiz,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professorQuizzes"] });
      toast.success("Quiz generated as a draft. Review it before publishing.");
      onClose();
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ??
        "Failed to generate quiz with AI. Please try again.";
      toast.error(msg);
    },
  });

  function toggleDoc(id: string) {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!disciplineId) return toast.error("Select a subject.");
    if (!theme.trim()) return toast.error("Enter the quiz topic.");
    if (theme.trim().length > 180) return toast.error("Topic must be at most 180 characters.");
    if (!selectedDocIds.size) return toast.error("Select at least one document.");

    generateMutation.mutate({
      disciplineId,
      theme: theme.trim(),
      questionCount,
      documentIds: [...selectedDocIds],
      title: title.trim() || undefined,
      description: description.trim() || undefined,
    });
  }

  const isPending = generateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Disciplina */}
      <div>
        <label className={labelCls}>Subject</label>
        {disciplines.length === 0 ? (
          <p className="text-sm text-zinc-500">No subject available.</p>
        ) : (
          <select
            value={disciplineId}
            onChange={(e) => setDisciplineId(e.target.value)}
            className={selectCls}
            disabled={isPending}
            required
          >
            <option value="">Select subject…</option>
            {disciplines.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Tema */}
      <div>
        <label className={labelCls}>
          Quiz topic{" "}
          <span className="normal-case text-zinc-600">({theme.length}/180)</span>
        </label>
        <input
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          maxLength={180}
          placeholder="e.g. variables and data types in Python"
          className={inputCls}
          disabled={isPending}
          required
        />
      </div>

      {/* Quantidade de perguntas */}
      <div>
        <label className={labelCls}>Number of questions</label>
        <div className="flex gap-2">
          {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setQuestionCount(n)}
              disabled={isPending}
              className={`h-9 w-9 rounded-lg border font-[Poppins] text-sm font-semibold transition-colors ${
                questionCount === n
                  ? "border-indigo-500 bg-indigo-600 text-white"
                  : "border-white/10 bg-neutral-950/60 text-zinc-400 hover:border-indigo-500/40 hover:text-white"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Documentos RAG de todas as turmas */}
      <div>
        <label className={labelCls}>
          RAG documents{" "}
          <span className="normal-case font-normal text-zinc-600">
            (all manageable classes)
          </span>
        </label>

        {loadingDocs ? (
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading documents…
          </div>
        ) : readyDocs.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
            <p className="font-[Poppins] text-xs text-amber-300">
              No ready document found. Process documents in the RAG area first.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
            {docsByClass.map(([className, docs]) => (
              <div key={className}>
                <p className="mb-1 font-[Poppins] text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  {className}
                </p>
                <div className="space-y-1.5">
                  {docs.map((doc) => {
                    const checked = selectedDocIds.has(doc.id);
                    return (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => toggleDoc(doc.id)}
                        disabled={isPending}
                        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                          checked
                            ? "border-indigo-500/50 bg-indigo-600/10"
                            : "border-white/10 bg-neutral-950/40 hover:border-white/20"
                        }`}
                      >
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                            checked
                              ? "border-indigo-500 bg-indigo-600"
                              : "border-white/20 bg-transparent"
                          }`}
                        >
                          {checked && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                          )}
                        </div>
                        <FileText className="h-4 w-4 shrink-0 text-zinc-500" />
                        <span className="font-[Poppins] text-sm text-white truncate">
                          {doc.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Título e descrição (opcionais) */}
      <div>
        <label className={labelCls}>Quiz title (optional)</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="Leave blank for the AI to suggest one"
          className={inputCls}
          disabled={isPending}
        />
      </div>

      <div>
        <label className={labelCls}>Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="Short quiz description"
          className="w-full rounded-xl border border-white/10 bg-neutral-950/60 px-3 py-2 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-indigo-500/60 placeholder:text-zinc-600 disabled:opacity-40 resize-none"
          disabled={isPending}
        />
      </div>

      {/* Aviso */}
      <div className="flex items-start gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
        <p className="font-[Poppins] text-xs leading-relaxed text-indigo-300">
          The quiz will be created as a draft. Review the questions and explanations before publishing.
        </p>
      </div>

      <button
        type="submit"
        disabled={
          isPending ||
          !disciplineId ||
          !selectedDocIds.size ||
          !theme.trim()
        }
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-[Poppins] text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating quiz with AI…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate Quiz with AI
          </>
        )}
      </button>
    </form>
  );
}
