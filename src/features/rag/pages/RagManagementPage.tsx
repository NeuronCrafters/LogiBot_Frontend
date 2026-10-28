import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Database,
  FileText,
  Link2,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/shared/lib/toast";
import { ragApi } from "@/features/rag/api/ragApi";
import type {
  RagClass,
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
  "h-11 w-full rounded-xl border border-white/10 bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-blue-500/60 placeholder:text-zinc-600";

/* ── Status badge ── */
const STATUS_META: Record<string, { label: string; className: string }> = {
  uploaded: {
    label: "Queued",
    className: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  },
  processing: {
    label: "Processing",
    className: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  },
  ready: {
    label: "Ready",
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  },
  error: {
    label: "Error",
    className: "border-red-500/20 bg-red-500/10 text-red-300",
  },
  deleted: {
    label: "Removed",
    className: "border-white/10 bg-white/5 text-zinc-500",
  },
};

function formatBytes(value: number) {
  if (!Number.isFinite(value)) return "-";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 102.4) / 10} KB`;
  return `${Math.round(value / 1024 / 102.4) / 10} MB`;
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
  const tabs: {
    id: Tab;
    label: string;
    icon: React.ReactNode;
    locked?: boolean;
  }[] = [
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
    },
    {
      id: "documents",
      label: "Documents",
      icon: <FileText className="h-4 w-4" />,
      locked: ragMode === "none",
    },
    {
      id: "chat",
      label: "Test Chat",
      icon: <MessageSquare className="h-4 w-4" />,
      locked: ragMode === "none",
    },
  ];

  return (
    <div className="flex gap-1 rounded-2xl border border-white/10 bg-neutral-900 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
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
  const active = current === value;
  return (
    <button
      type="button"
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
          RAG Mode
        </h2>
        <p className="mt-1 font-[Poppins] text-sm text-zinc-500">
          Defines how the AI will retrieve information from the documents.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ModeButton
          value="none"
          current={ragMode}
          label="None"
          description="AI answers without using documents."
          onClick={setRagMode}
        />
        <ModeButton
          value="context"
          current={ragMode}
          label="Context"
          description="Always searches the documents before answering."
          onClick={setRagMode}
        />
        <ModeButton
          value="self"
          current={ragMode}
          label="Self"
          description="AI decides whether it needs to search before answering."
          onClick={setRagMode}
        />
        <ModeButton
          value="hybrid"
          current={ragMode}
          label="Hybrid"
          description="Searches by meaning and by keywords at the same time."
          onClick={setRagMode}
        />
      </div>

      {ragMode !== "none" && (
        <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Top K</label>
          <input
            type="number"
            min={1}
            max={10}
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            className={inputCls}
          />
          <p className="mt-1.5 font-[Poppins] text-xs text-zinc-600">
            Maximum number of retrieved excerpts.
          </p>
        </div>
        <div>
          <label className={labelCls}>Minimum score</label>
          <input
            type="number"
            min={0}
            max={100}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className={inputCls}
          />
          <p className="mt-1.5 font-[Poppins] text-xs text-zinc-600">
            Minimum relevance to accept an excerpt (0–100).
          </p>
        </div>
        </div>
      )}

      <button
        type="button"
        disabled={!settings || isSaving}
        onClick={() => onSave({ ragMode, topK, minScore })}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-5 font-[Poppins] text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Save settings
      </button>
    </Panel>
  );
}

/* ── Document row ── */
function DocumentRow({
  document,
  otherClasses,
  onDelete,
  onReprocess,
  onToggleEnabled,
  onLinkToClasses,
  isDeleting,
  isReprocessing,
  isTogglingEnabled,
  isLinking,
}: {
  document: RagDocument;
  otherClasses: RagClass[];
  onDelete: (id: string) => void;
  onReprocess: (id: string) => void;
  onToggleEnabled: (id: string, enabled: boolean) => void;
  onLinkToClasses: (id: string, classIds: string[]) => void;
  isDeleting: boolean;
  isReprocessing: boolean;
  isTogglingEnabled: boolean;
  isLinking: boolean;
}) {
  const meta = STATUS_META[document.status] ?? STATUS_META.uploaded;
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  const { data: linkedClassIds = [] } = useQuery({
    queryKey: ["ragDocumentLinkedClasses", document.id],
    queryFn: () => ragApi.getLinkedClassIds(document.id),
    enabled: document.status === "ready",
    staleTime: 30 * 1000,
  });

  const toggleSelected = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId],
    );
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-neutral-950/40 p-3 min-w-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-500">
        <FileText className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className="truncate font-[Poppins] text-sm font-medium text-white"
            title={document.title}
          >
            {document.title}
          </p>
          {!document.isOwner && (
            <span className="shrink-0 rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 font-[Poppins] text-[10px] font-medium text-blue-300">
              Shared
            </span>
          )}
        </div>
        <p className="font-[Poppins] text-xs text-zinc-600 truncate">
          {document.sourceType.toUpperCase()} · {formatBytes(document.fileSize)}{" "}
          · {new Date(document.createdAt).toLocaleDateString("en-US")}
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
          onClick={() => onToggleEnabled(document.id, !document.enabled)}
          disabled={isTogglingEnabled}
          className={`hidden h-8 shrink-0 items-center rounded-full border px-3 font-[Poppins] text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:inline-flex ${
            document.enabled
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
              : "border-white/10 bg-white/5 text-zinc-500 hover:bg-white/10"
          }`}
          title={document.enabled ? "Deactivate in this class" : "Activate in this class"}
        >
          {document.enabled ? "Active" : "Inactive"}
        </button>

        {document.status === "ready" && (
          <Dialog>
            <DialogTrigger>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
                title="Link to another class"
              >
                <Link2 className="h-3.5 w-3.5" />
              </button>
            </DialogTrigger>
            <DialogContent className="border-white/10 bg-neutral-900 text-white">
              <DialogHeader>
                <DialogTitle className="font-[Poppins] text-white">
                  Link to another class
                </DialogTitle>
                <DialogDescription className="font-[Poppins] text-zinc-400">
                  Reuse this already processed document in another class, without re-uploading the file.
                </DialogDescription>
              </DialogHeader>

              {otherClasses.length ? (
                <div className="max-h-64 space-y-1 overflow-y-auto">
                  {otherClasses.map((cls) => {
                    const alreadyLinked = linkedClassIds.includes(cls.id);
                    const checked = alreadyLinked || selectedClassIds.includes(cls.id);
                    return (
                    <label
                      key={cls.id}
                      className={`flex items-center gap-2.5 rounded-lg px-2 py-2 ${
                        alreadyLinked ? "cursor-default" : "cursor-pointer hover:bg-white/5"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={alreadyLinked}
                        onChange={() => toggleSelected(cls.id)}
                        className="sr-only"
                      />
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          checked
                            ? alreadyLinked
                              ? "border-emerald-600/60 bg-emerald-600/40"
                              : "border-blue-500 bg-blue-600"
                            : "border-white/20 bg-transparent"
                        }`}
                      >
                        {checked && (
                          <Check className="h-3 w-3 text-white" strokeWidth={3} />
                        )}
                      </span>
                      <span
                        className={`font-[Poppins] text-sm ${alreadyLinked ? "text-zinc-500" : "text-zinc-200"}`}
                      >
                        {cls.courseName} — {cls.name}
                      </span>
                      {alreadyLinked && (
                        <span className="ml-auto shrink-0 font-[Poppins] text-xs text-emerald-500">
                          Already linked
                        </span>
                      )}
                    </label>
                    );
                  })}
                </div>
              ) : (
                <p className="font-[Poppins] text-sm text-zinc-500">
                  No other class available.
                </p>
              )}

              <DialogFooter>
                <button
                  type="button"
                  disabled={!selectedClassIds.length || isLinking}
                  onClick={() => onLinkToClasses(document.id, selectedClassIds)}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 font-[Poppins] text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
        )}

        <button
          type="button"
          onClick={() => onReprocess(document.id)}
          disabled={isReprocessing || document.status === "processing"}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-500 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          title="Reprocess"
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
          title={document.isOwner ? "Remove" : "Remove from this class"}
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
  otherClasses,
  uploadFile,
  uploadTitle,
  isUploading,
  onFileChange,
  onTitleChange,
  onUpload,
  onDelete,
  onReprocess,
  onToggleEnabled,
  onLinkToClasses,
  deletingId,
  reprocessingId,
  togglingId,
  linkingId,
}: {
  classLabel: string;
  documents: RagDocument[];
  documentsLoading: boolean;
  ragMode?: RagMode;
  otherClasses: RagClass[];
  uploadFile: File | null;
  uploadTitle: string;
  isUploading: boolean;
  onFileChange: (file: File | null) => void;
  onTitleChange: (title: string) => void;
  onUpload: () => void;
  onDelete: (id: string) => void;
  onReprocess: (id: string) => void;
  onToggleEnabled: (id: string, enabled: boolean) => void;
  onLinkToClasses: (id: string, classIds: string[]) => void;
  deletingId?: string;
  reprocessingId?: string;
  togglingId?: string;
  linkingId?: string;
}) {
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
              Documents disabled
            </p>
            <p className="mt-1.5 font-[Poppins] text-xs text-zinc-500 leading-relaxed">
              Enable the{" "}
              <span className="text-blue-400 font-medium">Context</span>,{" "}
              <span className="text-blue-400 font-medium">Self</span> or{" "}
              <span className="text-blue-400 font-medium">Hybrid</span> mode in the Settings tab.
            </p>
          </div>
        </div>
      )}

      <Panel className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-[Poppins] text-base font-semibold text-white">
              Documents
            </h2>
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
            New document
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="flex h-10 min-w-0 flex-1 cursor-pointer items-center gap-3 overflow-hidden rounded-xl border border-white/10 bg-neutral-800/50 px-4 transition-colors hover:bg-neutral-800/80">
              <Upload className="h-4 w-4 shrink-0 text-zinc-400" />
              <span className="truncate font-[Poppins] text-sm text-zinc-400">
                {uploadFile ? uploadFile.name : "Select file (.pdf, .txt, .docx)"}
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
              placeholder="Title (optional)"
              className="h-10 rounded-xl border border-white/10 bg-neutral-800/50 px-3 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-blue-500/60 placeholder:text-zinc-600 sm:w-48"
            />
            <button
              type="submit"
              disabled={!uploadFile || isUploading}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 font-[Poppins] text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload
            </button>
          </div>
        </form>

        {/* Document list */}
        {documentsLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : documents.length ? (
          <div className="space-y-2 overflow-hidden">
            {documents.map((doc) => (
              <DocumentRow
                key={doc.id}
                document={doc}
                otherClasses={otherClasses}
                onDelete={onDelete}
                onReprocess={onReprocess}
                onToggleEnabled={onToggleEnabled}
                onLinkToClasses={onLinkToClasses}
                isDeleting={deletingId === doc.id}
                isReprocessing={reprocessingId === doc.id}
                isTogglingEnabled={togglingId === doc.id}
                isLinking={linkingId === doc.id}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 py-12 text-center">
            <p className="font-[Poppins] text-sm text-zinc-500">
              No document uploaded for this class.
            </p>
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
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTesting]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isTesting) return;
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
              Chat disabled
            </p>
            <p className="mt-1.5 font-[Poppins] text-xs text-zinc-500 leading-relaxed">
              Enable the{" "}
              <span className="text-blue-400 font-medium">Context</span>,{" "}
              <span className="text-blue-400 font-medium">Self</span> or{" "}
              <span className="text-blue-400 font-medium">Hybrid</span> mode to test RAG.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-5 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-zinc-500" />
          <span className="font-[Poppins] text-sm font-medium text-zinc-300">
            Test Chat
          </span>
          {settings && (
            <span className="ml-auto rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-[Poppins] text-xs text-zinc-500">
              mode: {settings.ragMode}
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto scroll-smooth px-4 py-4"
      >
        {messages.length === 0 && !isTesting && (
          <div className="flex h-full items-center justify-center">
            <p className="font-[Poppins] text-sm text-zinc-600">
              Type a question to test this class's RAG...
            </p>
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
            <div className="flex items-center gap-2 px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-white/10 p-3">
        <div className="mx-auto flex w-full max-w-3xl items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Type your question... (Enter to send)"
            rows={1}
            disabled={isTesting || locked}
            className="flex-1 resize-none overflow-hidden rounded-xl border border-white/10 bg-neutral-950/60 px-3 py-2.5 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-blue-500/60 placeholder:text-zinc-600 disabled:opacity-50"
            style={{ height: "44px" }}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!input.trim() || isTesting || locked}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
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
      toast.success("RAG settings saved.");
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message ?? "Failed to save RAG."),
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!uploadFile) throw new Error("Select a file.");
      return ragApi.uploadDocument(selectedClassId, uploadFile, uploadTitle);
    },
    onSuccess: () => {
      setUploadFile(null);
      setUploadTitle("");
      queryClient.invalidateQueries({
        queryKey: ["ragDocuments", selectedClassId],
      });
      toast.success("Document sent for processing.");
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message ?? "Failed to upload file."),
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) =>
      ragApi.deleteDocument(selectedClassId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ragDocuments", selectedClassId],
      });
      toast.success("Document removed from this class.");
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message ?? "Failed to remove."),
  });

  const toggleEnabledMutation = useMutation({
    mutationFn: ({ documentId, enabled }: { documentId: string; enabled: boolean }) =>
      ragApi.setDocumentEnabled(selectedClassId, documentId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ragDocuments", selectedClassId],
      });
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message ?? "Failed to update document."),
  });

  const linkMutation = useMutation({
    mutationFn: ({ documentId, classIds }: { documentId: string; classIds: string[] }) =>
      ragApi.linkDocumentToClasses(documentId, classIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ragDocuments"] });
      queryClient.invalidateQueries({
        queryKey: ["ragDocumentLinkedClasses", variables.documentId],
      });
      toast.success("Document linked.");
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message ?? "Failed to link document."),
  });

  const reprocessMutation = useMutation({
    mutationFn: ragApi.reprocessDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ragDocuments", selectedClassId],
      });
      toast.success("Reprocessing scheduled.");
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message ?? "Failed to reprocess."),
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
      toast.error(error?.response?.data?.message ?? "Failed to test RAG.");
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
          title="RAG Base"
          description="Configure material retrieval per class."
        />

        {/* Class selector */}
        <Panel>
          <label className={labelCls}>Class</label>
          {classesLoading ? (
            <div className="flex h-11 items-center gap-2 font-[Poppins] text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading classes...
            </div>
          ) : classes.length ? (
            <Select
              value={selectedClassId}
              onChange={setSelectedClassId}
              options={classes.map((c) => ({ value: c.id, label: `${c.courseName} — ${c.name}` }))}
            />
          ) : (
            <p className="font-[Poppins] text-sm text-zinc-500">
              No class available.
            </p>
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
                otherClasses={classes.filter((c) => c.id !== selectedClassId)}
                uploadFile={uploadFile}
                uploadTitle={uploadTitle}
                isUploading={uploadMutation.isPending}
                onFileChange={setUploadFile}
                onTitleChange={setUploadTitle}
                onUpload={() => uploadMutation.mutate()}
                onDelete={(id) => deleteMutation.mutate(id)}
                onReprocess={(id) => reprocessMutation.mutate(id)}
                onToggleEnabled={(documentId, enabled) =>
                  toggleEnabledMutation.mutate({ documentId, enabled })
                }
                onLinkToClasses={(documentId, classIds) =>
                  linkMutation.mutate({ documentId, classIds })
                }
                togglingId={
                  toggleEnabledMutation.isPending
                    ? toggleEnabledMutation.variables?.documentId
                    : undefined
                }
                linkingId={
                  linkMutation.isPending
                    ? linkMutation.variables?.documentId
                    : undefined
                }
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
