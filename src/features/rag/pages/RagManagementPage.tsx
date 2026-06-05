import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Database,
  FileText,
  Loader2,
  MessageSquare,
  RefreshCw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { PageHeader } from "@/components/AppUI/PageHeader";
import { Panel } from "@/components/AppUI/Panel";
import { toast } from "@/shared/lib/toast";
import { ragApi } from "@/features/rag/api/ragApi";
import type {
  RagDocument,
  RagMode,
  RagSettings,
  RagTestChatResponse,
} from "@/features/rag/types";

const labelCls =
  "mb-1.5 block font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500";
const inputCls =
  "h-11 w-full rounded-xl border border-white/10 bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-blue-500/60 placeholder:text-zinc-600";
const textareaCls =
  "w-full resize-none rounded-xl border border-white/10 bg-neutral-950/60 px-3 py-2.5 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-blue-500/60 placeholder:text-zinc-600";

const STATUS_META: Record<
  string,
  { label: string; className: string }
> = {
  uploaded: {
    label: "Na fila",
    className: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  },
  processing: {
    label: "Processando",
    className: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  },
  ready: {
    label: "Pronto",
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  },
  error: {
    label: "Erro",
    className: "border-red-500/20 bg-red-500/10 text-red-300",
  },
  deleted: {
    label: "Removido",
    className: "border-white/10 bg-white/5 text-zinc-500",
  },
};

function formatBytes(value: number) {
  if (!Number.isFinite(value)) return "-";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 102.4) / 10} KB`;
  return `${Math.round(value / 1024 / 102.4) / 10} MB`;
}

function ModeButton({
  value,
  current,
  label,
  onClick,
}: {
  value: RagMode;
  current: RagMode;
  label: string;
  onClick: (mode: RagMode) => void;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`h-10 rounded-lg border px-3 font-[Poppins] text-sm transition-colors ${
        active
          ? "border-blue-500/40 bg-blue-500/15 text-blue-200"
          : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function SettingsPanel({
  settings,
  isSaving,
  onSave,
}: {
  settings?: RagSettings;
  isSaving: boolean;
  onSave: (input: {
    ragMode: RagMode;
    topK: number;
    minScore: number;
  }) => void;
}) {
  const [ragMode, setRagMode] = useState<RagMode>("none");
  const [topK, setTopK] = useState(4);
  const [minScore, setMinScore] = useState(40);

  useEffect(() => {
    if (!settings) return;
    setRagMode(settings.ragMode);
    setTopK(settings.topK);
    setMinScore(settings.minScore);
  }, [settings]);

  const canSave = Boolean(settings) && !isSaving;

  return (
    <Panel className="space-y-5">
      <div>
        <h2 className="font-[Poppins] text-base font-semibold text-white">
          Configuracao da turma
        </h2>
        <p className="mt-1 font-[Poppins] text-sm text-zinc-500">
          O aluno continua usando o chat normalmente.
        </p>
      </div>

      <div>
        <label className={labelCls}>Modo RAG</label>
        <div className="grid grid-cols-3 gap-2">
          <ModeButton
            value="none"
            current={ragMode}
            label="Nenhum"
            onClick={setRagMode}
          />
          <ModeButton
            value="context"
            current={ragMode}
            label="Context"
            onClick={setRagMode}
          />
          <ModeButton
            value="self"
            current={ragMode}
            label="Self"
            onClick={setRagMode}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Top K</label>
          <input
            type="number"
            min={1}
            max={10}
            value={topK}
            onChange={(event) => setTopK(Number(event.target.value))}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Score minimo</label>
          <input
            type="number"
            min={0}
            max={100}
            value={minScore}
            onChange={(event) => setMinScore(Number(event.target.value))}
            className={inputCls}
          />
        </div>
      </div>

      <button
        type="button"
        disabled={!canSave}
        onClick={() =>
          onSave({
            ragMode,
            topK,
            minScore,
          })
        }
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 font-[Poppins] text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Salvar
      </button>
    </Panel>
  );
}

function DocumentRow({
  document,
  onDelete,
  onReprocess,
  isDeleting,
  isReprocessing,
}: {
  document: RagDocument;
  onDelete: (documentId: string) => void;
  onReprocess: (documentId: string) => void;
  isDeleting: boolean;
  isReprocessing: boolean;
}) {
  const meta = STATUS_META[document.status] ?? STATUS_META.uploaded;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-neutral-950/40 p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-500">
          <FileText className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-[Poppins] text-sm font-medium text-white">
            {document.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="font-[Poppins] text-xs text-zinc-600">
              {document.sourceType.toUpperCase()}
            </span>
            <span className="font-[Poppins] text-xs text-zinc-700">|</span>
            <span className="font-[Poppins] text-xs text-zinc-600">
              {formatBytes(document.fileSize)}
            </span>
            <span className="font-[Poppins] text-xs text-zinc-700">|</span>
            <span className="font-[Poppins] text-xs text-zinc-600">
              {new Date(document.createdAt).toLocaleDateString("pt-BR")}
            </span>
          </div>
          {document.errorMessage && (
            <p className="mt-2 line-clamp-2 font-[Poppins] text-xs text-red-300">
              {document.errorMessage}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span
          className={`rounded-full border px-2.5 py-1 font-[Poppins] text-xs font-medium ${meta.className}`}
        >
          {meta.label}
        </span>
        <button
          type="button"
          onClick={() => onReprocess(document.id)}
          disabled={isReprocessing || document.status === "processing"}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-500 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          title="Reprocessar"
        >
          {isReprocessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={() => onDelete(document.id)}
          disabled={isDeleting}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-500 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
          title="Remover"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function TestChatPanel({
  settings,
  isTesting,
  result,
  onTest,
}: {
  settings?: RagSettings;
  isTesting: boolean;
  result?: RagTestChatResponse;
  onTest: (message: string) => void;
}) {
  const [message, setMessage] = useState("");

  return (
    <Panel className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-500">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-[Poppins] text-base font-semibold text-white">
            Teste RAG
          </h2>
          <p className="mt-1 font-[Poppins] text-sm text-zinc-500">
            Modo atual: {settings?.ragMode ?? "none"}
          </p>
        </div>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          const cleanMessage = message.trim();
          if (cleanMessage) onTest(cleanMessage);
        }}
        className="space-y-3"
      >
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
          placeholder="Digite uma pergunta para testar..."
          className={textareaCls}
        />
        <button
          type="submit"
          disabled={!message.trim() || isTesting}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 font-[Poppins] text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isTesting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageSquare className="h-4 w-4" />
          )}
          Testar
        </button>
      </form>

      {result && (
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-neutral-950/40 p-4">
            <p className="whitespace-pre-wrap font-[Poppins] text-sm leading-6 text-zinc-200">
              {result.answer}
            </p>
          </div>

          <div className="space-y-2">
            {result.retrievedChunks.map((chunk) => (
              <div
                key={chunk.chromaId}
                className="rounded-xl border border-white/10 bg-white/5 p-3"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="font-[Poppins] text-xs font-semibold text-blue-200">
                    {chunk.documentTitle}
                  </span>
                  <span className="font-[Poppins] text-xs text-zinc-600">
                    trecho {chunk.chunkIndex + 1}
                  </span>
                  <span className="font-[Poppins] text-xs text-zinc-600">
                    score {chunk.score}
                  </span>
                </div>
                <p className="line-clamp-4 font-[Poppins] text-xs leading-5 text-zinc-400">
                  {chunk.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}

export function RagManagementPage() {
  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [testResult, setTestResult] = useState<RagTestChatResponse>();

  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ["ragClasses"],
    queryFn: ragApi.listClasses,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!selectedClassId && classes.length) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  useEffect(() => {
    setTestResult(undefined);
  }, [selectedClassId]);

  const selectedClass = useMemo(
    () => classes.find((item) => item.id === selectedClassId) ?? null,
    [classes, selectedClassId],
  );

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["ragSettings", selectedClassId],
    queryFn: () => ragApi.getSettings(selectedClassId),
    enabled: Boolean(selectedClassId),
  });

  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ["ragDocuments", selectedClassId],
    queryFn: () => ragApi.listDocuments(selectedClassId),
    enabled: Boolean(selectedClassId),
    refetchInterval: 15000,
  });

  const settingsMutation = useMutation({
    mutationFn: (input: Parameters<typeof ragApi.updateSettings>[1]) =>
      ragApi.updateSettings(selectedClassId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ragSettings", selectedClassId],
      });
      toast.success("Configuracao RAG salva.");
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message ?? "Erro ao salvar RAG."),
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!uploadFile) throw new Error("Selecione um arquivo.");
      return ragApi.uploadDocument(selectedClassId, uploadFile, uploadTitle);
    },
    onSuccess: () => {
      setUploadFile(null);
      setUploadTitle("");
      queryClient.invalidateQueries({
        queryKey: ["ragDocuments", selectedClassId],
      });
      toast.success("Documento enviado para processamento.");
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message ?? "Erro ao enviar arquivo."),
  });

  const deleteMutation = useMutation({
    mutationFn: ragApi.deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ragDocuments", selectedClassId],
      });
      toast.success("Documento removido.");
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message ?? "Erro ao remover."),
  });

  const reprocessMutation = useMutation({
    mutationFn: ragApi.reprocessDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ragDocuments", selectedClassId],
      });
      toast.success("Reprocessamento agendado.");
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message ?? "Erro ao reprocessar."),
  });

  const testChatMutation = useMutation({
    mutationFn: (message: string) =>
      ragApi.testChat(selectedClassId, {
        message,
        override: settings
          ? {
              ragMode: settings.ragMode,
              topK: settings.topK,
              minScore: settings.minScore,
            }
          : undefined,
      }),
    onSuccess: (result) => setTestResult(result),
    onError: (error: any) =>
      toast.error(error?.response?.data?.message ?? "Erro ao testar RAG."),
  });

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <PageHeader
          icon={<Database className="h-5 w-5" />}
          title="Base RAG"
          description="Configure a recuperacao de materiais por turma."
        />

        <Panel>
          <label className={labelCls}>Turma</label>
          {classesLoading ? (
            <div className="flex h-11 items-center gap-2 font-[Poppins] text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando turmas...
            </div>
          ) : classes.length ? (
            <select
              value={selectedClassId}
              onChange={(event) => setSelectedClassId(event.target.value)}
              className={inputCls}
            >
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.courseName} - {item.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="font-[Poppins] text-sm text-zinc-500">
              Nenhuma turma disponivel para RAG.
            </p>
          )}
        </Panel>

        {selectedClass && (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,420px)_1fr]">
            <SettingsPanel
              settings={settings}
              isSaving={settingsMutation.isPending || settingsLoading}
              onSave={(input) => settingsMutation.mutate(input)}
            />

            <Panel className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-[Poppins] text-base font-semibold text-white">
                    Documentos
                  </h2>
                  <p className="mt-1 font-[Poppins] text-sm text-zinc-500">
                    {selectedClass.courseName} - {selectedClass.name}
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-[Poppins] text-xs text-zinc-500">
                  {documents.length}/30
                </span>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  uploadMutation.mutate();
                }}
                className="grid gap-3 rounded-xl border border-white/10 bg-neutral-950/30 p-4 lg:grid-cols-[1fr_220px_auto]"
              >
                <input
                  type="file"
                  accept=".pdf,.txt,.docx"
                  onChange={(event) =>
                    setUploadFile(event.target.files?.[0] ?? null)
                  }
                  className="block w-full cursor-pointer rounded-xl border border-white/10 bg-neutral-950/60 font-[Poppins] text-sm text-zinc-400 file:mr-3 file:h-11 file:border-0 file:bg-white/10 file:px-4 file:font-[Poppins] file:text-sm file:font-semibold file:text-white hover:file:bg-white/15"
                />
                <input
                  value={uploadTitle}
                  onChange={(event) => setUploadTitle(event.target.value)}
                  placeholder="Titulo opcional"
                  className={inputCls}
                />
                <button
                  type="submit"
                  disabled={
                    !uploadFile || uploadMutation.isPending || !selectedClassId
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 font-[Poppins] text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploadMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Enviar
                </button>
              </form>

              {documentsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                </div>
              ) : documents.length ? (
                <div className="space-y-3">
                  {documents.map((document) => (
                    <DocumentRow
                      key={document.id}
                      document={document}
                      onDelete={(documentId) =>
                        deleteMutation.mutate(documentId)
                      }
                      onReprocess={(documentId) =>
                        reprocessMutation.mutate(documentId)
                      }
                      isDeleting={
                        deleteMutation.isPending &&
                        deleteMutation.variables === document.id
                      }
                      isReprocessing={
                        reprocessMutation.isPending &&
                        reprocessMutation.variables === document.id
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 py-12 text-center">
                  <p className="font-[Poppins] text-sm text-zinc-500">
                    Nenhum documento enviado para esta turma.
                  </p>
                </div>
              )}
            </Panel>

            <div className="xl:col-span-2">
              <TestChatPanel
                settings={settings}
                isTesting={testChatMutation.isPending}
                result={testResult}
                onTest={(message) => testChatMutation.mutate(message)}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
