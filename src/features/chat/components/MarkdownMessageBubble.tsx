import { t, useLocale, type Language } from "@/i18n";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, BookOpen, ChevronDown, ChevronUp, Pencil, Loader2 } from "lucide-react";
import logo from "@/assets/logo.svg";
import { Children, isValidElement, memo, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { useResolvedPreferences } from "@/shared/preferences";
import { codeTheme } from "@/features/chat/codeTheme";
import type { RetrievedChunk } from "@/features/chat/api/chatApi";

const remarkPlugins = [remarkGfm];

const CodeBlock = memo(function CodeBlock({
  language,
  children,
}: {
  language: string;
  children: string;
}) {
  useLocale();

  const [copied, setCopied] = useState(false);
  const { theme, contrast } = useResolvedPreferences();
  const { style, background } = codeTheme(theme, contrast);
  const languageName = language.toUpperCase();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 border border-neutral-700 rounded-xl overflow-hidden shadow-lg group">
      <div className="flex justify-between items-center px-4 py-2 bg-neutral-800 border-b border-neutral-700 text-xs text-white font-mono">
        <span className="text-neutral-400 font-bold">
          {languageName}
        </span>
        <span className="sr-only" aria-live="polite">{copied ? t("common.copiado") : ""}</span>
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs text-zinc-200 hover:text-white transition-colors bg-neutral-700 hover:bg-neutral-600 px-2 py-1 rounded"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check size={14} />
              {t("common.copiado")}</>
          ) : (
            <>
              <Copy size={14} />
              {t("common.copiar")}</>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={style}
        role="region"
        tabIndex={0}
        aria-label={t("chat.codigoEmLinguagem", { language: languageName })}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: "0.875rem",
          lineHeight: "1.625",
          background,
        }}
        codeTagProps={{ style: { fontFamily: "ui-monospace, monospace" } }}
        wrapLongLines={false}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
});

const markdownComponents = {
  code: ({ node, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || "");
    const codeContent = String(children).replace(/\n$/, "");

    return match ? (
      <CodeBlock language={match[1]}>{codeContent}</CodeBlock>
    ) : codeContent.includes("\n") ? (
      <code
        className="my-3 block whitespace-pre-wrap break-words rounded-lg border border-neutral-700 bg-neutral-900/80 px-3 py-2 text-sm font-mono text-gray-100 leading-relaxed shadow-sm"
        {...props}
      >
        {codeContent}
      </code>
    ) : (
      <code
        className="rounded-md border border-orange-400/20 bg-neutral-800/80 px-1.5 py-0.5 text-sm font-mono text-orange-300"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ node, children, ...props }: any) => {
    const childArray = Children.toArray(children);
    const onlyChild = childArray.length === 1 ? childArray[0] : null;

    if (isValidElement(onlyChild) && onlyChild.type !== "code") {
      return <>{children}</>;
    }

    return (
      <pre
        className="my-4 overflow-x-auto rounded-xl border border-neutral-700 bg-surface p-4 shadow-lg [&_code]:block [&_code]:whitespace-pre-wrap [&_code]:break-words [&_code]:border-0 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-gray-100 [&_code]:shadow-none"
        {...props}
      >
        {children}
      </pre>
    );
  },
  p: ({ node, ...props }: any) => (
    <p className="mb-3 last:mb-0 leading-relaxed text-gray-200" {...props} />
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="pl-5 mb-3 list-disc space-y-1 text-gray-200" {...props} />
  ),
  ol: ({ node, ...props }: any) => (
    <ol className="pl-5 mb-3 list-decimal space-y-1 text-gray-200" {...props} />
  ),
  li: ({ node, ...props }: any) => <li className="pl-1" {...props} />,
  a: ({ node, ...props }: any) => (
    <a
      className="text-blue-400 hover:underline cursor-pointer"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  strong: ({ node, ...props }: any) => (
    <strong className="font-semibold text-white" {...props} />
  ),
  h1: ({ node, ...props }: any) => (
    <h1 className="text-xl font-bold text-white mt-4 mb-2" {...props} />
  ),
  h2: ({ node, ...props }: any) => (
    <h2 className="text-lg font-bold text-white mt-3 mb-2" {...props} />
  ),
  h3: ({ node, ...props }: any) => (
    <h3 className="text-base font-bold text-white mt-2 mb-1" {...props} />
  ),
  h4: ({ node, ...props }: any) => (
    <h4 className="text-sm font-bold text-white mt-2 mb-1" {...props} />
  ),
  h5: ({ node, ...props }: any) => (
    <h5 className="text-sm font-semibold text-white mt-2 mb-1" {...props} />
  ),
  h6: ({ node, ...props }: any) => (
    <h6 className="text-sm font-semibold text-gray-200 mt-2 mb-1" {...props} />
  ),
  hr: () => null,
  blockquote: ({ node, ...props }: any) => (
    <blockquote
      className="border-l-4 border-blue-500 pl-4 py-2 my-2 bg-neutral-800/50 italic text-gray-300"
      {...props}
    />
  ),
  table: ({ node, ...props }: any) => (
    <div className="overflow-x-auto my-4 rounded-xl border border-neutral-700">
      <table
        className="min-w-full border-separate border-spacing-0 rounded-xl overflow-hidden"
        {...props}
      />
    </div>
  ),
  thead: ({ node, ...props }: any) => (
    <thead className="bg-neutral-800" {...props} />
  ),
  th: ({ node, ...props }: any) => (
    <th
      className="border-r border-b border-neutral-700 px-4 py-2 text-left text-white font-semibold last:border-r-0"
      {...props}
    />
  ),
  td: ({ node, ...props }: any) => (
    <td
      className="border-r border-b border-neutral-700 px-4 py-2 text-gray-200 last:border-r-0"
      {...props}
    />
  ),
};

interface MarkdownMessageBubbleProps {
  onEdit?: (text: string) => Promise<void>;
  busy?: boolean;
  outputLanguage?: Language;
  text: string;
  sender: "user" | "bot";
  retrievedChunks?: RetrievedChunk[];
}

const SourcesPanel = memo(function SourcesPanel({ chunks }: { chunks: RetrievedChunk[] }) {
  useLocale();

  const [expanded, setExpanded] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mt-3 border-t border-neutral-800 pt-3">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-[Poppins]"
      >
        <BookOpen size={13} />
        {t("common.sources", { count: chunks.length })}
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {chunks.map((chunk, index) => (
            <div
              key={chunk.chromaId}
              className="rounded-lg border border-neutral-800 bg-neutral-950/60 overflow-hidden"
            >
              <button
                type="button"
                aria-expanded={openIndex === index}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-neutral-800/40 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex-shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold font-[Poppins] bg-blue-500/15 text-blue-300 border border-blue-500/20">
                    {chunk.score}%
                  </span>
                  <span className="truncate text-xs text-zinc-400 font-[Poppins]">
                    {chunk.documentTitle} {t("chat.trecho")}{" "}{chunk.chunkIndex + 1}
                  </span>
                </div>
                {openIndex === index ? (
                  <ChevronUp size={13} className="flex-shrink-0 text-zinc-600" />
                ) : (
                  <ChevronDown size={13} className="flex-shrink-0 text-zinc-600" />
                )}
              </button>

              {openIndex === index && (
                <div className="px-3 pb-3 pt-1 text-xs text-zinc-400 font-[Poppins] leading-relaxed border-t border-neutral-800/60 whitespace-pre-wrap">
                  {chunk.content}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export const MarkdownMessageBubble = memo(function MarkdownMessageBubble({
  outputLanguage,
  text,
  sender,
  retrievedChunks,
  onEdit,
  busy = false,
}: MarkdownMessageBubbleProps) {
  useLocale();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editError, setEditError] = useState(false);
  const editButton = useRef<HTMLButtonElement>(null);
  const closeEditor = () => { setEditing(false); setEditError(false); requestAnimationFrame(() => editButton.current?.focus()); };
  const confirmEdit = async () => {
    if (!draft.trim() || submitting || busy || !onEdit) return;
    setSubmitting(true); setEditError(false);
    setEditing(false);
    try { await onEdit(draft.trim()); }
    catch { setEditing(true); setEditError(true); }
    finally { setSubmitting(false); }
  };

  const isUser = sender === "user";

  if (isUser) {
    if (editing) return <form onSubmit={event => { event.preventDefault(); void confirmEdit(); }}
      className="mb-6 ml-auto mr-2 w-[calc(100%-1rem)] max-w-2xl rounded-2xl border border-control bg-neutral-800 p-3 font-[Poppins] sm:p-4">
      <textarea autoFocus aria-label={t("chat.editMessage")} value={draft} disabled={submitting || busy}
        onChange={event => setDraft(event.target.value)}
        onKeyDown={event => {
          if (event.key === "Escape" && !submitting && !busy) { event.preventDefault(); closeEditor(); }
          if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); void confirmEdit(); }
        }}
        rows={Math.min(10, Math.max(3, draft.split("\n").length))}
        className="w-full resize-y rounded-lg border border-control bg-neutral-900 p-3 text-sm leading-relaxed text-gray-100 focus:outline focus:outline-2 focus:outline-blue-400" />
      <p className="mt-2 text-xs text-zinc-400">{t("chat.editHint")}</p>
      {editError && <p role="alert" className="mt-2 text-sm text-red-400">{t("chat.editFailed")}</p>}
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" disabled={submitting || busy} onClick={closeEditor} className="min-h-11 rounded-lg border border-control px-3 py-2 text-sm text-zinc-300 disabled:opacity-50">{t("chat.cancelEdit")}</button>
        <button type="submit" disabled={!draft.trim() || submitting || busy} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-on-accent disabled:opacity-50">
          {submitting && <Loader2 aria-hidden="true" size={16} className="animate-spin" />}{t("chat.resendEdit")}
        </button>
      </div>
    </form>;
    return (
      <div className="group mb-6 flex flex-col items-end px-2">
        <div className="max-w-[90%] bg-neutral-800 border border-neutral-700 rounded-2xl rounded-br-sm px-4 py-3 sm:max-w-[75%]">
          <p className="text-gray-100 text-sm leading-relaxed font-[Poppins] whitespace-pre-wrap">
            {text}
          </p>
        </div>
        {onEdit && <button ref={editButton} type="button" disabled={busy || submitting} aria-label={t("chat.editMessage")} title={t("chat.editMessage")}
          onClick={() => { setDraft(text); setEditError(false); setEditing(true); }}
          className="mt-1 inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-neutral-800 hover:text-white disabled:opacity-40">
          <Pencil aria-hidden="true" size={15} />
        </button>}
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-6 px-2">
      <div className="flex-shrink-0 mt-1">
        <div className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-700 p-0.5 flex items-center justify-center shadow">
          <img src={logo} alt={t("common.bot")} className="brand-mark w-full h-full object-contain" />
        </div>
      </div>
      <div className="flex-1 min-w-0 text-sm font-[Poppins]">
        <div lang={outputLanguage}>
        <Markdown remarkPlugins={remarkPlugins} components={markdownComponents}>
          {text}
        </Markdown>
        </div>
        {retrievedChunks && retrievedChunks.length > 0 && (
          <SourcesPanel chunks={retrievedChunks} />
        )}
      </div>
    </div>
  );
});
