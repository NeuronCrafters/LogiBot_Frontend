import { apiError } from "@/shared/lib/apiError";
import { useReducedMotion } from "@/shared/preferences";
import { t, useLocale, getLanguage } from "@/i18n";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  Database,
  FileText,
  Loader2,
  Lock,
  MessageSquare,
  RefreshCw,
  Save,
  Send,
  Settings,
  Trash2,
  Upload,
} from "lucide-react";
import { PageHeader } from "@/components/AppUI/PageHeader";
import { Panel } from "@/components/AppUI/Panel";
import { Select } from "@/components/ui/select";
import { toast } from "@/shared/lib/toast";
import { ragApi } from "@/features/rag/api/ragApi";
import type {
  RagDocument,
  RagMode,
  RagSettings,
  RagTestChatResponse,
} from "@/features/rag/types";
import { MarkdownMessageBubble } from "@/features/chat/components/MarkdownMessageBubble";
import type { RetrievedChunk } from "@/features/chat/api/chatApi";

/* ── Shared styles ── */
const labelCls =
  "mb-1.5 block font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500";
const inputCls =
  "h-11 w-full rounded-xl border border-control bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-blue-500/60 placeholder:text-zinc-600";

/* ── Status badge ── */
const STATUS_META: Record<string, { label: string; className: string }> = {
  uploaded: {
    get label() { return t("rag.naFila"); },
    className: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  },
  processing: {
    get label() { return t("rag.processando"); },
    className: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  },
  ready: {
    get label() { return t("rag.pronto"); },
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  },
  error: {
    get label() { return t("common.erro"); },
    className: "border-red-500/20 bg-red-500/10 text-red-300",
  },
  deleted: {
    get label() { return t("rag.removido"); },
    className: "border-white/10 bg-white/5 text-zinc-500",
  },
};

function formatBytes(value: number) {
  if (!Number.isFinite(value)) return "-";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return t("rag.value0Kb", { value0: Math.round(value / 102.4) / 10 });
  return t("rag.value0Mb", { value0: Math.round(value / 1024 / 102.4) / 10 });
}

/* ── Tab bar ── */
type Tab = "settings" | "documents" | "chat";

function TabBar({
  active,
  ragMode,
  onChange,
}: {
  active: Tab;
  ragMode?: RagMode;
  onChange: (t: Tab) => void;
}) {
  useLocale();

  const tabs: {
    id: Tab;
    label: string;
    icon: React.ReactNode;
    locked?: boolean;
  }[] = [
    {
      id: "settings",
      label: t("rag.configuracoes"),
      icon: <Settings className="h-4 w-4" />,
    },
    {
      id: "documents",
      label: t("common.documentos"),
      icon: <FileText className="h-4 w-4" />,
      locked: ragMode === "none",
    },
    {
      id: "chat",
      label: t("common.chatDeTeste"),
      icon: <MessageSquare className="h-4 w-4" />,
      locked: ragMode === "none",
    },
  ];

  return (
    <div className="flex gap-1 rounded-2xl border border-white/10 bg-neutral-900 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          aria-label={tab.label}
          aria-pressed={active === tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 font-[Poppins] text-sm font-medium transition-colors ${
            active === tab.id
              ? "bg-white/10 text-white"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          {tab.icon}
          <span className="hidden sm:inline">{tab.label}</span>
          {tab.locked && <Lock className="h-3 w-3 text-zinc-600" />}
        </button>
      ))}
    </div>
  );
}

/* ── Mode button ── */
function ModeButton({
  value,
  current,
  label,
  description,
  onClick,
}: {
  value: RagMode;
  current: RagMode;
  label: string;
  description: string;
  onClick: (mode: RagMode) => void;
}) {
  useLocale();

  const active = current === value;
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onClick(value)}
      className={`flex flex-col gap-0.5 rounded-xl border p-3 text-left transition-colors ${
        active
          ? "border-blue-500/40 bg-blue-500/10"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
      }`}
    >
      <span
        className={`font-[Poppins] text-sm font-semibold ${active ? "text-blue-200" : "text-zinc-300"}`}
      >
        {label}
      </span>
      <span className="font-[Poppins] text-xs text-zinc-500 leading-relaxed">
        {description}
      </span>
    </button>
  );
}

/* ── Settings tab ── */
function SettingsTab({
  settings,
  isSaving,
  onSave,
}: {
  settings?: RagSettings;
  isSaving: boolean;
  onSave: (input: { ragMode: RagMode; topK: number; minScore: number }) => void;
}) {
  useLocale();

  const [ragMode, setRagMode] = useState<RagMode>("none");
  const [topK, setTopK] = useState(4);
  const [minScore, setMinScore] = useState(40);

  useEffect(() => {
    if (!settings) return;
    setRagMode(settings.ragMode);
    setTopK(settings.topK);
    setMinScore(settings.minScore);
  }, [settings]);

  return (
    <Panel className="space-y-6">
      <div>
        <h2 className="font-[Poppins] text-base font-semibold text-white">
          {t("rag.modoRag")}</h2>
        <p className="mt-1 font-[Poppins] text-sm text-zinc-500">
          {t("rag.defineComoAIaIraRecuperarInformacoes")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ModeButton
          value="none"
          current={ragMode}
          label={t("rag.nenhum")}
          description={t("rag.iaRespondeSemUsarDocumentos")}
          onClick={setRagMode}
        />
        <ModeButton
          value="context"
          current={ragMode}
          label={t("common.context")}
          description={t("rag.sempreBuscaNosDocumentosAntesDeResponder")}
          onClick={setRagMode}
        />
        <ModeButton
          value="self"
          current={ragMode}
          label={t("common.self")}
          description={t("rag.iaDecideSePrecisaBuscarAntesDe")}
          onClick={setRagMode}
        />
        <ModeButton
          value="hybrid"
          current={ragMode}
          label={t("common.hybrid")}
          description={t("rag.buscaPorSignificadoEPorPalavrasChave")}
          onClick={setRagMode}
        />
      </div>

      {ragMode !== "none" && (
        <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>{t("rag.topK")}</label>
          <input
            aria-label={t("rag.topK")}
            type="number"
            min={1}
            max={10}
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            className={inputCls}
          />
          <p className="mt-1.5 font-[Poppins] text-xs text-zinc-600">
            {t("rag.quantidadeMaximaDeTrechosRecuperados")}</p>
        </div>
        <div>
          <label className={labelCls}>{t("rag.scoreMinimo")}</label>
          <input
            aria-label={t("rag.scoreMinimo")}
            type="number"
            min={0}
            max={100}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className={inputCls}
          />
          <p className="mt-1.5 font-[Poppins] text-xs text-zinc-600">
            {t("rag.relevanciaMinimaParaAceitarUmTrecho0100")}</p>
        </div>
        </div>
      )}

      <button
        type="button"
        disabled={!settings || isSaving}
        onClick={() => onSave({ ragMode, topK, minScore })}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-5 font-[Poppins] text-sm font-semibold text-on-accent transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {t("rag.salvarConfiguracoes")}</button>
    </Panel>
  );
}

/* ── Document row ── */
function DocumentRow({
  document,
  onDelete,
  onReprocess,
  isDeleting,
  isReprocessing,
}: {
  document: RagDocument;
  onDelete: (id: string) => void;
  onReprocess: (id: string) => void;
  isDeleting: boolean;
  isReprocessing: boolean;
}) {
  useLocale();

  const meta = STATUS_META[document.status] ?? STATUS_META.uploaded;
  return (
    <div role="listitem" className="flex items-center gap-3 rounded-xl border border-white/10 bg-neutral-950/40 p-3 min-w-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-500">
        <FileText className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className="truncate font-[Poppins] text-sm font-medium text-white"
          title={document.title}
        >
          {document.title}
        </p>
        <p className="font-[Poppins] text-xs text-zinc-600 truncate">
          {document.sourceType.toUpperCase()} · {formatBytes(document.fileSize)}{" "}
          · {new Date(document.createdAt).toLocaleDateString(getLanguage())}
        </p>
        {document.errorMessage && (
          <p className="mt-1 line-clamp-1 font-[Poppins] text-xs text-red-400">
            {document.errorMessage}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span
          className={`hidden sm:inline-flex rounded-full border px-2.5 py-0.5 font-[Poppins] text-xs font-medium ${meta.className}`}
        >
          {meta.label}
        </span>
        <button
          type="button"
          onClick={() => onReprocess(document.id)}
          disabled={isReprocessing || document.status === "processing"}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-500 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          title={t("rag.reprocessar")}
        >
          {isReprocessing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          type="button"
          onClick={() => onDelete(document.id)}
          disabled={isDeleting}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-500 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
          title={t("common.remover")}
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Documents tab ── */
function DocumentsTab({
  classLabel,
  documents,
  documentsLoading,
  ragMode,
  uploadFile,
  uploadTitle,
  isUploading,
  onFileChange,
  onTitleChange,
  onUpload,
  onDelete,
  onReprocess,
  deletingId,
  reprocessingId,
}: {
  classLabel: string;
  documents: RagDocument[];
  documentsLoading: boolean;
  ragMode?: RagMode;
  uploadFile: File | null;
  uploadTitle: string;
  isUploading: boolean;
  onFileChange: (file: File | null) => void;
  onTitleChange: (title: string) => void;
  onUpload: () => void;
  onDelete: (id: string) => void;
  onReprocess: (id: string) => void;
  deletingId?: string;
  reprocessingId?: string;
}) {
  useLocale();

  const locked = ragMode === "none";

  return (
    <div className="relative">
      {locked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl bg-neutral-950/85 backdrop-blur-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <Lock className="h-6 w-6 text-zinc-400" />
          </div>
          <div className="text-center px-8">
            <p className="font-[Poppins] text-sm font-semibold text-zinc-200">
              {t("rag.documentosDesativados")}</p>
            <p className="mt-1.5 font-[Poppins] text-xs text-zinc-500 leading-relaxed">
              {t("common.ativeOModo")}{" "}
              <span className="text-blue-400 font-medium">{t("common.context")}</span>,{" "}
              <span className="text-blue-400 font-medium">{t("common.self")}</span>{" "}{t("common.or")}{" "}
              <span className="text-blue-400 font-medium">{t("common.hybrid")}</span> {t("rag.naAbaDeConfiguracoes")}</p>
          </div>
        </div>
      )}

      <Panel className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-[Poppins] text-base font-semibold text-white">
              {t("common.documentos")}</h2>
            <p className="mt-0.5 font-[Poppins] text-sm text-zinc-500">
              {classLabel}
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-[Poppins] text-xs text-zinc-500">
            {documents.length}/30
          </span>
        </div>

        {/* Upload form */}
        <form
          onSubmit={(e) => { e.preventDefault(); onUpload(); }}
          className="rounded-xl bg-neutral-950/50 p-4"
        >
          <p className="mb-3 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {t("rag.novoDocumento")}</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="flex h-10 min-w-0 flex-1 cursor-pointer items-center gap-3 overflow-hidden rounded-xl border border-white/10 bg-neutral-800/50 px-4 transition-colors hover:bg-neutral-800/80">
              <Upload className="h-4 w-4 shrink-0 text-zinc-400" />
              <span className="truncate font-[Poppins] text-sm text-zinc-400">
                {uploadFile ? uploadFile.name : t("rag.selecionarArquivoPdfTxtDocx")}
              </span>
              <input
                type="file"
                accept=".pdf,.txt,.docx"
                onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>
            <input
              value={uploadTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder={t("rag.tituloOpcional")}
              className="h-10 rounded-xl border border-control bg-neutral-800/50 px-3 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-blue-500/60 placeholder:text-zinc-600 sm:w-48"
            />
            <button
              type="submit"
              disabled={!uploadFile || isUploading}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 font-[Poppins] text-sm font-semibold text-on-accent transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {t("rag.enviar")}</button>
          </div>
        </form>

        {/* Document list */}
        {documentsLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : documents.length ? (
          <div role="list" className="space-y-2 overflow-hidden">
            {documents.map((doc) => (
              <DocumentRow
                key={doc.id}
                document={doc}
                onDelete={onDelete}
                onReprocess={onReprocess}
                isDeleting={deletingId === doc.id}
                isReprocessing={reprocessingId === doc.id}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 py-12 text-center">
            <p className="font-[Poppins] text-sm text-zinc-500">
              {t("rag.nenhumDocumentoEnviadoParaEstaTurma")}</p>
          </div>
        )}
      </Panel>
    </div>
  );
}

/* ── Test chat message types ── */
type TestChatMsg = {
  id: string;
  role: "user" | "bot";
  text: string;
  retrievedChunks?: RetrievedChunk[];
};

/* ── Chat de Teste tab ── */
function ChatTab({
  settings,
  isTesting,
  onTest,
  messages,
  ragMode,
}: {
  settings?: RagSettings;
  isTesting: boolean;
  onTest: (message: string) => void;
  messages: TestChatMsg[];
  ragMode?: RagMode;
}) {
  useLocale();

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const reduceMotion = useReducedMotion();
  const followBottomRef = useRef(true);
  const wasTestingRef = useRef(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const scrollToBottom = (smooth = true) => {
    followBottomRef.current = true;
    setShowScrollButton(false);
    bottomRef.current?.scrollIntoView({ behavior: smooth && !reduceMotion ? "smooth" : "auto", block: "end" });
  };

  const checkScrollPosition = () => {
    const container = containerRef.current;
    if (!container) return;
    const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    followBottomRef.current = nearBottom;
    setShowScrollButton(!nearBottom);
  };

  useEffect(() => {
    if (followBottomRef.current) scrollToBottom();
    else setShowScrollButton(true);
  }, [messages, isTesting]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (wasTestingRef.current && !isTesting) setAnnouncement(t("chat.respostaRecebida"));
    if (isTesting) setAnnouncement("");
    wasTestingRef.current = isTesting;
  }, [isTesting]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isTesting) return;
    scrollToBottom();
    onTest(trimmed);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "44px";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "44px";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  };

  const locked = ragMode === "none";

  return (
    <div className="relative flex h-[600px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-900">
      {/* Lock overlay */}
      {locked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-neutral-950/85 backdrop-blur-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <Lock className="h-6 w-6 text-zinc-400" />
          </div>
          <div className="text-center px-8">
            <p className="font-[Poppins] text-sm font-semibold text-zinc-200">
              {t("rag.chatDesativado")}</p>
            <p className="mt-1.5 font-[Poppins] text-xs text-zinc-500 leading-relaxed">
              {t("common.ativeOModo")}{" "}
              <span className="text-blue-400 font-medium">{t("common.context")}</span>,{" "}
              <span className="text-blue-400 font-medium">{t("common.self")}</span>{" "}{t("common.or")}{" "}
              <span className="text-blue-400 font-medium">{t("common.hybrid")}</span> {t("rag.paraTestarORag")}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-5 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-zinc-500" />
          <span className="font-[Poppins] text-sm font-medium text-zinc-300">
            {t("common.chatDeTeste")}</span>
          {settings && (
            <span className="ml-auto rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-[Poppins] text-xs text-zinc-500">
              {t("rag.mode", { value: settings.ragMode })}
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
      <div
        ref={containerRef}
        onScroll={checkScrollPosition}
        className="relative flex-1 overflow-y-auto scroll-smooth px-4 py-4"
      >
        {messages.length === 0 && !isTesting && (
          <div className="flex h-full items-center justify-center">
            <p className="font-[Poppins] text-sm text-zinc-600">
              {t("rag.digiteUmaPerguntaParaTestarORag")}</p>
          </div>
        )}

        <div className="mx-auto w-full max-w-3xl space-y-1">
          {messages.map((msg) =>
            msg.role === "user" ? (
              <div key={msg.id} className="flex justify-end px-2 py-1">
                <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-3">
                  <p className="font-[Poppins] text-sm text-white leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </p>
                </div>
              </div>
            ) : (
              <div key={msg.id} className="py-1">
                <MarkdownMessageBubble
                  text={msg.text}
                  sender="bot"
                  retrievedChunks={msg.retrievedChunks}
                />
              </div>
            ),
          )}

          {isTesting && (
            <div role="status" className="flex items-center gap-2 px-4 py-3">
              <span className="sr-only">{t("chat.gerandoResposta")}</span>
              <div className="flex gap-1" aria-hidden="true">
                <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {showScrollButton && (
        <button
          type="button"
          aria-label={t("chat.irParaUltimaMensagem")}
          title={t("chat.irParaUltimaMensagem")}
          onClick={() => scrollToBottom()}
          className="absolute bottom-20 left-0 right-0 z-20 mx-auto w-fit rounded-full border border-neutral-600 bg-neutral-700 p-2 text-white shadow-lg transition-colors hover:bg-neutral-600"
        >
          <ArrowDown size={16} aria-hidden="true" />
        </button>
      )}

      {/* Input */}
      <div className="shrink-0 border-t border-white/10 p-3">
        <div className="mx-auto flex w-full max-w-3xl items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={t("rag.digiteSuaPerguntaEnterParaEnviar")}
            rows={1}
            disabled={isTesting || locked}
            className="flex-1 resize-none overflow-hidden rounded-xl border border-control bg-neutral-950/60 px-3 py-2.5 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-blue-500/60 placeholder:text-zinc-600 disabled:opacity-50"
            style={{ height: "44px" }}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!input.trim() || isTesting || locked}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-on-accent transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ── */
export function RagManagementPage() {
  const locale = useLocale();

  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("settings");
  const [chatMessages, setChatMessages] = useState<TestChatMsg[]>([]);

  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ["ragClasses"],
    queryFn: ragApi.listClasses,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!selectedClassId && classes.length) setSelectedClassId(classes[0].id);
  }, [classes, selectedClassId]);

  useEffect(() => {
    setChatMessages([]);
  }, [selectedClassId]);

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId) ?? null,
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
      toast.success({ key: "rag.configuracaoRagSalva", params: {} });
    },
    onError: (error: any) =>
      toast.error(apiError(error, "rag.erroAoSalvarRag")),
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!uploadFile) throw new Error(t("rag.selecioneUmArquivo", {}, locale));
      return ragApi.uploadDocument(selectedClassId, uploadFile, uploadTitle);
    },
    onSuccess: () => {
      setUploadFile(null);
      setUploadTitle("");
      queryClient.invalidateQueries({
        queryKey: ["ragDocuments", selectedClassId],
      });
      toast.success({ key: "rag.documentoEnviadoParaProcessamento", params: {} });
    },
    onError: (error: any) =>
      toast.error(apiError(error, "rag.erroAoEnviarArquivo")),
  });

  const deleteMutation = useMutation({
    mutationFn: ragApi.deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ragDocuments", selectedClassId],
      });
      toast.success({ key: "rag.documentoRemovido", params: {} });
    },
    onError: (error: any) =>
      toast.error(apiError(error, "rag.erroAoRemover")),
  });

  const reprocessMutation = useMutation({
    mutationFn: ragApi.reprocessDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ragDocuments", selectedClassId],
      });
      toast.success({ key: "rag.reprocessamentoAgendado", params: {} });
    },
    onError: (error: any) =>
      toast.error(apiError(error, "rag.erroAoReprocessar")),
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
    onSuccess: (result: RagTestChatResponse) => {
      setChatMessages((prev) => {
        const withoutTyping = prev.filter((m) => m.id !== "typing");
        return [
          ...withoutTyping,
          {
            id: `bot-${Date.now()}`,
            role: "bot",
            text: result.answer,
            retrievedChunks: result.retrievedChunks as RetrievedChunk[],
          },
        ];
      });
    },
    onError: (error: any) => {
      setChatMessages((prev) => prev.filter((m) => m.id !== "typing"));
      toast.error(apiError(error, "rag.erroAoTestarRag"));
    },
  });

  const handleTestMessage = (message: string) => {
    setChatMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", text: message },
    ]);
    testChatMutation.mutate(message);
  };

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <PageHeader
          icon={<Database className="h-5 w-5" />}
          title={t("common.baseRag", {}, locale)}
          description={t("rag.configureARecuperacaoDeMateriaisPorTurma", {}, locale)}
        />

        {/* Class selector */}
        <Panel>
          <label className={labelCls}>{t("common.turma", {}, locale)}</label>
          {classesLoading ? (
            <div className="flex h-11 items-center gap-2 font-[Poppins] text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("rag.carregandoTurmas", {}, locale)}</div>
          ) : classes.length ? (
            <Select
              value={selectedClassId}
              onChange={setSelectedClassId}
              options={classes.map((c) => ({ value: c.id, label: `${c.courseName} — ${c.name}` }))}
            />
          ) : (
            <p className="font-[Poppins] text-sm text-zinc-500">
              {t("rag.nenhumaTurmaDisponivel", {}, locale)}</p>
          )}
        </Panel>

        {selectedClass && (
          <>
            <TabBar
              active={activeTab}
              ragMode={settings?.ragMode}
              onChange={setActiveTab}
            />

            {activeTab === "settings" && (
              <SettingsTab
                settings={settings}
                isSaving={settingsMutation.isPending || settingsLoading}
                onSave={(input) => settingsMutation.mutate(input)}
              />
            )}

            {activeTab === "documents" && (
              <DocumentsTab
                classLabel={`${selectedClass.courseName} — ${selectedClass.name}`}
                documents={documents}
                documentsLoading={documentsLoading}
                ragMode={settings?.ragMode}
                uploadFile={uploadFile}
                uploadTitle={uploadTitle}
                isUploading={uploadMutation.isPending}
                onFileChange={setUploadFile}
                onTitleChange={setUploadTitle}
                onUpload={() => uploadMutation.mutate()}
                onDelete={(id) => deleteMutation.mutate(id)}
                onReprocess={(id) => reprocessMutation.mutate(id)}
                deletingId={
                  deleteMutation.isPending
                    ? (deleteMutation.variables as string)
                    : undefined
                }
                reprocessingId={
                  reprocessMutation.isPending
                    ? (reprocessMutation.variables as string)
                    : undefined
                }
              />
            )}

            {activeTab === "chat" && (
              <ChatTab
                settings={settings}
                isTesting={testChatMutation.isPending}
                onTest={handleTestMessage}
                messages={chatMessages}
                ragMode={settings?.ragMode}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}
