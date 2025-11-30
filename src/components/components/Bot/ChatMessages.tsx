import { Avatar } from "@/components/components/Avatar/Avatar";
import logo from "@/assets/logo.svg";
import { Typograph } from "@/components/components/Typograph/Typograph";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import kotlin from 'react-syntax-highlighter/dist/esm/languages/prism/kotlin';
import csharp from 'react-syntax-highlighter/dist/esm/languages/prism/csharp';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';

SyntaxHighlighter.registerLanguage('java', java);
SyntaxHighlighter.registerLanguage('kotlin', kotlin);
SyntaxHighlighter.registerLanguage('csharp', csharp);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('sql', sql);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('jsx', jsx);

interface Message {
    role: "user" | "assistant";
    content: string;
    context?: "quiz" | "chat";
}

interface ChatMessagesProps {
    messages: Message[];
    userName: string;
    userId: string;
}

const markdownComponents = {
    code: ({ node, inline, className, children, ...props }: any) => {
        const match = /language-(\w+)/.exec(className || "");
        return !inline && match ? (
            <div className="relative my-4 border border-neutral-700 rounded-xl overflow-hidden">
                <div className="flex justify-between items-center px-4 py-2 bg-neutral-800 border-b border-neutral-700 text-xs text-white font-mono">
                    <span className="text-neutral-400">{match[1]}</span>
                    <button
                        className="text-white bg-neutral-700 hover:bg-neutral-600 px-2 py-0.5 rounded text-xs"
                        onClick={() => navigator.clipboard.writeText(String(children))}
                    >
                        Copiar
                    </button>
                </div>
                <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{ margin: 0, padding: "1rem", fontSize: "0.875rem" }}
                    {...props}
                >
                    {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
            </div>
        ) : (
            <code className="bg-muted rounded-md px-1.5 py-0.5 text-sm" {...props}>
                {children}
            </code>
        );
    },
    h1: ({ node, ...props }: any) => <h1 className="mt-6 mb-2 text-2xl font-bold" {...props} />,
    h2: ({ node, ...props }: any) => <h2 className="mt-5 mb-2 text-xl font-bold" {...props} />,
    h3: ({ node, ...props }: any) => <h3 className="mt-4 mb-2 text-lg font-bold" {...props} />,
    h4: ({ node, ...props }: any) => <h4 className="mt-3 mb-1 text-base font-bold" {...props} />,
    ul: ({ node, ...props }: any) => <ul className="pl-4 my-2 list-disc list-inside" {...props} />,
    ol: ({ node, ...props }: any) => <ol className="pl-4 my-2 list-decimal list-inside" {...props} />,
    li: ({ node, ...props }: any) => <li className="my-1" {...props} />,
    p: ({ node, ...props }: any) => <p className="my-2" {...props} />,
    strong: ({ node, ...props }: any) => <strong className="font-bold" {...props} />,
    em: ({ node, ...props }: any) => <em className="italic" {...props} />,
    hr: ({ node, ...props }: any) => <hr className="my-6 border-t border-muted" {...props} />,
    blockquote: ({ node, ...props }: any) => (
        <blockquote className="pl-4 my-3 italic border-l-4 border-muted" {...props} />
    ),
    a: ({ node, ...props }: any) => (
        <a className="break-all transition-colors text-primary hover:underline" {...props} />
    ),
    table: ({ node, ...props }: any) => (
        <div className="w-full my-4 overflow-x-auto">
            <table className="border-collapse table-auto" style={{ minWidth: "100%" }} {...props} />
        </div>
    ),
    thead: ({ node, ...props }: any) => <thead className="bg-muted/50" {...props} />,
    tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-muted" {...props} />,
    tr: ({ node, ...props }: any) => <tr className="divide-x divide-muted" {...props} />,
    th: ({ node, ...props }: any) => <th className="px-3 py-2 font-semibold text-left" {...props} />,
    td: ({ node, ...props }: any) => <td className="px-3 py-2" {...props} />,
    img: ({ node, ...props }: any) => (
        <img
            className="h-auto max-w-full rounded-lg"
            {...props}
            onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/api/placeholder/400/300";
                e.currentTarget.alt = "Imagem não carregada";
            }}
        />
    ),
};

function ChatMessages({ messages, userId }: ChatMessagesProps) {
    const formatMessage = (message: Message) => {
        const { content } = message;

        const isInstruction =
            content.toLowerCase().includes("escolha seu nível") ||
            content.toLowerCase().includes("escolha um assunto") ||
            content.toLowerCase().includes("escolha um tópico") ||
            content.toLowerCase().includes("tópico selecionado") ||
            content.toLowerCase().includes("suas perguntas estão prontas") ||
            content.toLowerCase().includes("respostas:") ||
            content.toLowerCase().includes("⚠️") ||
            content.toLowerCase().includes("praticar") ||
            content.toLowerCase().includes("gerando suas perguntas");

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

        return <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents} children={content} />;
    };

    return (
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
            {messages.map((message, index) => {
                const isUser = message.role === "user";
                const content = formatMessage(message);
                if (!content) return null;

                return (
                    <div
                        key={index}
                        className={`flex items-end w-full mb-3 ${isUser ? "justify-end" : "justify-start"
                            } animate-fade-in`}
                    >
                        {!isUser && (
                            <div className="mr-2">
                                <img src={logo} alt="Bot" className="w-10 h-10 p-1 bg-white rounded-full" />
                            </div>
                        )}

                        <div
                            className={`px-4 py-2 rounded-xl max-w-[80%] text-sm leading-relaxed ${isUser
                                ? "bg-blue-600 text-white ml-auto rounded-br-none"
                                : "bg-[#2a2a2a] text-white mr-auto rounded-bl-none"
                                }`}
                        >
                            {content}
                        </div>

                        {isUser && (
                            <div className="flex items-center justify-center w-10 h-10 ml-2 rounded-full rainbow-avatar">
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
