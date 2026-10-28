import { Avatar } from "@/shared/components/Avatar";
import { logger } from "@/shared/lib/logger";
import logo from "@/assets/logo.svg";
import { Typograph } from "@/shared/components/Typography";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface Message {
  role?: "user" | "assistant";
  content?: string;
  context?: "quiz" | "chat";
  id?: string;
  text?: string;
  sender?: "user" | "bot";
  type?: string;
}

interface ChatMessagesProps {
  messages: Message[];
  userName: string;
  userId: string;
}

const CodeBlock = ({
  language,
  children,
}: {
  language: string;
  children: string;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const languageColors: Record<string, string> = {
    java: "text-orange-400",
    kotlin: "text-purple-400",
    csharp: "text-green-400",
    javascript: "text-yellow-400",
    python: "text-blue-400",
    sql: "text-pink-400",
    css: "text-cyan-400",
    jsx: "text-yellow-400",
  };

  const colorClass = languageColors[language.toLowerCase()] || "text-gray-300";

  return (
    <div className="relative my-4 border border-neutral-700 rounded-xl overflow-hidden">
      <div className="flex justify-between items-center px-4 py-2 bg-neutral-800 border-b border-neutral-700 text-xs text-white font-mono">
        <span className={`font-semibold ${colorClass}`}>
          {language.toUpperCase()}
        </span>
        <button
          className="flex items-center gap-1.5 text-white bg-neutral-700 hover:bg-neutral-600 px-2 py-1 rounded text-xs transition-colors"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check size={12} />
              Copied
            </>
          ) : (
            <>
              <Copy size={12} />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="m-0 p-4 bg-[#282c34] overflow-x-auto">
        <code className="text-sm font-mono text-gray-200 leading-relaxed block whitespace-pre">
          {children}
        </code>
      </pre>
    </div>
  );
};

const markdownComponents = {
  code: ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || "");
    const codeContent = String(children).replace(/\n$/, "");
    return !inline && match ? (
      <CodeBlock language={match[1]}>{codeContent}</CodeBlock>
    ) : (
      <code
        className="bg-muted rounded-md px-1.5 py-0.5 text-sm font-mono text-orange-300"
        {...props}
      >
        {children}
      </code>
    );
  },
  h1: ({ node, ...props }: any) => (
    <h1 className="mt-6 mb-2 text-2xl font-bold" {...props} />
  ),
  h2: ({ node, ...props }: any) => (
    <h2 className="mt-5 mb-2 text-xl font-bold" {...props} />
  ),
  h3: ({ node, ...props }: any) => (
    <h3 className="mt-4 mb-2 text-lg font-bold" {...props} />
  ),
  h4: ({ node, ...props }: any) => (
    <h4 className="mt-3 mb-1 text-base font-bold" {...props} />
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="pl-4 my-2 list-disc list-inside" {...props} />
  ),
  ol: ({ node, ...props }: any) => (
    <ol className="pl-4 my-2 list-decimal list-inside" {...props} />
  ),
  li: ({ node, ...props }: any) => <li className="my-1" {...props} />,
  p: ({ node, ...props }: any) => <p className="my-2" {...props} />,
  strong: ({ node, ...props }: any) => (
    <strong className="font-bold" {...props} />
  ),
  em: ({ node, ...props }: any) => <em className="italic" {...props} />,
  hr: ({ node, ...props }: any) => (
    <hr className="my-6 border-t border-muted" {...props} />
  ),
  blockquote: ({ node, ...props }: any) => (
    <blockquote
      className="pl-4 my-3 italic border-l-4 border-muted"
      {...props}
    />
  ),
  a: ({ node, ...props }: any) => (
    <a
      className="break-all transition-colors text-primary hover:underline"
      {...props}
    />
  ),
  table: ({ node, ...props }: any) => (
    <div className="w-full my-4 overflow-x-auto">
      <table
        className="border-collapse table-auto"
        style={{ minWidth: "100%" }}
        {...props}
      />
    </div>
  ),
  thead: ({ node, ...props }: any) => (
    <thead className="bg-muted/50" {...props} />
  ),
  tbody: ({ node, ...props }: any) => (
    <tbody className="divide-y divide-muted" {...props} />
  ),
  tr: ({ node, ...props }: any) => (
    <tr className="divide-x divide-muted" {...props} />
  ),
  th: ({ node, ...props }: any) => (
    <th className="px-3 py-2 font-semibold text-left" {...props} />
  ),
  td: ({ node, ...props }: any) => <td className="px-3 py-2" {...props} />,
  img: ({ node, ...props }: any) => (
    <img
      className="h-auto max-w-full rounded-lg"
      {...props}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src =
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23262626'/%3E%3Ctext x='200' y='150' fill='%23d4d4d4' font-family='Arial,sans-serif' font-size='16' text-anchor='middle' dominant-baseline='middle'%3EImagem indisponivel%3C/text%3E%3C/svg%3E";
        e.currentTarget.alt = "Image failed to load";
      }}
    />
  ),
};

function ChatMessages({ messages, userId }: ChatMessagesProps) {
  const formatMessage = (message: Message) => {
    const content = message.content || message.text;

    if (!content || typeof content !== "string") {
      logger.warn("Chat", "Message with invalid content.", message);
      return null;
    }

    const contentLower = content.toLowerCase();
    const isInstruction =
      contentLower.includes("choose your level") ||
      contentLower.includes("choose a topic") ||
      contentLower.includes("choose a subtopic") ||
      contentLower.includes("selected topic") ||
      contentLower.includes("your questions are ready") ||
      contentLower.includes("respostas:") ||
      contentLower.includes("⚠️") ||
      contentLower.includes("praticar") ||
      contentLower.includes("generating your questions");

    if (isInstruction) {
      return (
        <Typograph
          text={content}
          variant="text8"
          weight="regular"
          fontFamily="poppins"
          colorText="text-white"
        />
      );
    }

    return (
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
        children={content}
      />
    );
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      {messages.map((message, index) => {
        const isUser = message.role === "user" || message.sender === "user";
        const content = formatMessage(message);

        if (!content) return null;

        return (
          <div
            key={message.id || index}
            className={`flex items-end w-full mb-3 ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}
          >
            {!isUser && (
              <div className="mr-2">
                <img
                  src={logo}
                  alt="Bot"
                  className="w-10 h-10 p-1 bg-white rounded-full"
                />
              </div>
            )}
            <div
              className={`px-4 py-2 rounded-xl max-w-[80%] text-sm leading-relaxed ${
                isUser
                  ? "bg-blue-600 text-white ml-auto rounded-br-none"
                  : "bg-[#2a2a2a] text-white mr-auto rounded-bl-none"
              }`}
            >
              {content}
            </div>
            {isUser && (
              <div className="flex items-center justify-center w-10 h-10 ml-2 rounded-full border border-white/10">
                <Avatar
                  seed={userId}
                  backgroundColor="#2a2a2a"
                  className="w-full h-full rounded-full"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { ChatMessages };
