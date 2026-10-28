import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import logo from "@/assets/logo.svg";
import { Children, isValidElement, memo, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { RetrievedChunk } from "@/features/chat/api/chatApi";

const remarkPlugins = [remarkGfm];

const CodeBlock = memo(function CodeBlock({
  language,
  children,
}: {
  language: string;
  children: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 border border-neutral-700 rounded-xl overflow-hidden shadow-lg group">
      <div className="flex justify-between items-center px-4 py-2 bg-neutral-800 border-b border-neutral-700 text-xs text-white font-mono">
        <span className="text-neutral-400 font-bold">
          {language.toUpperCase()}
        </span>
        <button
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors bg-neutral-700 hover:bg-neutral-600 px-2 py-1 rounded"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check size={14} />
              Copied
            </>
          ) : (
            <>
              <Copy size={14} />
              Copy
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: "0.875rem",
          lineHeight: "1.625",
          background: "#1e1e1e",
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
        className="my-4 overflow-x-auto rounded-xl border border-neutral-700 bg-[#1e1e1e] p-4 shadow-lg [&_code]:block [&_code]:whitespace-pre-wrap [&_code]:break-words [&_code]:border-0 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-gray-100 [&_code]:shadow-none"
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
  text: string;
  sender: "user" | "bot";
  retrievedChunks?: RetrievedChunk[];
}

const SourcesPanel = memo(function SourcesPanel({ chunks }: { chunks: RetrievedChunk[] }) {
  const [expanded, setExpanded] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mt-3 border-t border-neutral-800 pt-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-[Poppins]"
      >
        <BookOpen size={13} />
        {chunks.length} {chunks.length === 1 ? "source used" : "sources used"}
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
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-neutral-800/40 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold font-[Poppins] bg-blue-500/15 text-blue-300 border border-blue-500/20">
                    {chunk.score}%
                  </span>
                  <span className="truncate text-xs text-zinc-400 font-[Poppins]">
                    {chunk.documentTitle} · excerpt {chunk.chunkIndex + 1}
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
  text,
  sender,
  retrievedChunks,
}: MarkdownMessageBubbleProps) {
  const isUser = sender === "user";

  if (isUser) {
    return (
      <div className="flex justify-end mb-6 px-2">
        <div className="max-w-[75%] bg-neutral-800 border border-neutral-700 rounded-2xl rounded-br-sm px-4 py-3">
          <p className="text-gray-100 text-sm leading-relaxed font-[Poppins] whitespace-pre-wrap">
            {text}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-6 px-2">
      <div className="flex-shrink-0 mt-1">
        <div className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-700 p-0.5 flex items-center justify-center shadow">
          <img src={logo} alt="Bot" className="w-full h-full object-contain" />
        </div>
      </div>
      <div className="flex-1 min-w-0 text-sm font-[Poppins]">
        <Markdown remarkPlugins={remarkPlugins} components={markdownComponents}>
          {text}
        </Markdown>
        {retrievedChunks && retrievedChunks.length > 0 && (
          <SourcesPanel chunks={retrievedChunks} />
        )}
      </div>
    </div>
  );
});
