import { motion } from "framer-motion";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { User, Copy, Check } from "lucide-react";
import logo from "@/assets/logo.svg";
import { useState } from "react";

// Componente de Syntax Highlight personalizado (sem dependências externas)
const CodeBlock = ({ language, children }: { language: string; children: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 border border-neutral-700 rounded-xl overflow-hidden shadow-lg group">
      {/* Cabeçalho do Código */}
      <div className="flex justify-between items-center px-4 py-2 bg-neutral-800 border-b border-neutral-700 text-xs text-white font-mono">
        <span className="text-neutral-400 font-bold">{language.toUpperCase()}</span>
        <button
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors bg-neutral-700 hover:bg-neutral-600 px-2 py-1 rounded"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check size={14} />
              Copiado
            </>
          ) : (
            <>
              <Copy size={14} />
              Copiar
            </>
          )}
        </button>
      </div>
      {/* Bloco de Código com estilo manual */}
      <pre className="m-0 p-4 bg-[#1e1e1e] overflow-x-auto">
        <code className="text-sm font-mono text-gray-200 leading-relaxed">
          {children}
        </code>
      </pre>
    </div>
  );
};

const markdownComponents = {
  // Renderizador personalizado para blocos de código
  code: ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || "");
    const codeContent = String(children).replace(/\n$/, "");

    return !inline && match ? (
      <CodeBlock language={match[1]}>
        {codeContent}
      </CodeBlock>
    ) : (
      // Código inline (ex: `variavel`)
      <code
        className="bg-neutral-700/50 text-orange-300 rounded px-1.5 py-0.5 text-sm font-mono"
        {...props}
      >
        {children}
      </code>
    );
  },
  // Estilização dos elementos Markdown básicos
  p: ({ node, ...props }: any) => (
    <p className="mb-2 last:mb-0 leading-relaxed text-gray-200" {...props} />
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="pl-4 mb-2 list-disc space-y-1 text-gray-200" {...props} />
  ),
  ol: ({ node, ...props }: any) => (
    <ol className="pl-4 mb-2 list-decimal space-y-1 text-gray-200" {...props} />
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
    <strong className="font-bold text-white" {...props} />
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
  blockquote: ({ node, ...props }: any) => (
    <blockquote
      className="border-l-4 border-blue-500 pl-4 py-2 my-2 bg-neutral-800/50 italic text-gray-300"
      {...props}
    />
  ),
  table: ({ node, ...props }: any) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border border-neutral-700 rounded-lg" {...props} />
    </div>
  ),
  thead: ({ node, ...props }: any) => (
    <thead className="bg-neutral-800" {...props} />
  ),
  th: ({ node, ...props }: any) => (
    <th className="border border-neutral-700 px-4 py-2 text-left text-white font-semibold" {...props} />
  ),
  td: ({ node, ...props }: any) => (
    <td className="border border-neutral-700 px-4 py-2 text-gray-200" {...props} />
  ),
};

interface MarkdownMessageBubbleProps {
  text: string;
  sender: "user" | "bot";
}

export function MarkdownMessageBubble({ text, sender }: MarkdownMessageBubbleProps) {
  const isUser = sender === "user";

  return (
    <motion.div
      className={`flex w-full mb-6 ${isUser ? "justify-end" : "justify-start"}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`flex max-w-[90%] md:max-w-[85%] gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>

        {/* Avatar */}
        <div className="flex-shrink-0 mt-1">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
              <User size={16} className="text-white" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-white p-1 flex items-center justify-center shadow-lg">
              <img src={logo} alt="Bot" className="w-full h-full object-contain" />
            </div>
          )}
        </div>

        {/* Conteúdo da Mensagem */}
        <div
          className={`px-5 py-4 rounded-2xl shadow-md overflow-hidden ${isUser
              ? "bg-blue-600 text-white rounded-tr-sm"
              : "bg-[#2c2c2c] text-gray-100 rounded-tl-sm border border-neutral-800"
            }`}
        >
          <div className="text-sm md:text-base font-poppins">
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {text}
            </Markdown>
          </div>
        </div>
      </div>
    </motion.div>
  );
}