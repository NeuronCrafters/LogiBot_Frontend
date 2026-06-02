import { ArrowUp, Loader2 } from "lucide-react";
import { userAnalysisApi } from "@/services/api/api_userAnalysis";
import { useState, useRef, useEffect } from "react";

interface ChatInputProps {
    inputText: string;
    setInputText: (text: string) => void;
    sendMessage: (message: string) => void;
    isWaitingResponse?: boolean;
}

export function ChatInput({ inputText, setInputText, sendMessage, isWaitingResponse = false }: ChatInputProps) {
    const [isSending, setIsSending] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isLocked = isSending || isWaitingResponse;
    const canSend = !isLocked && inputText.trim().length > 0;

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    };

    useEffect(() => {
        adjustHeight();
    }, [inputText]);

    const handleSend = () => {
        const text = inputText.trim();
        if (!text || isLocked) return;

        setIsSending(true);
        try {
            userAnalysisApi.addInteraction(text).catch(() => {});
            sendMessage(text);
            setInputText("");
            if (textareaRef.current) textareaRef.current.style.height = "auto";
        } catch (err) {
            console.error(err);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="w-full px-4 pb-4 pt-2 flex justify-center">
            <div className={`w-full max-w-3xl bg-neutral-800 border border-neutral-700 rounded-2xl shadow-lg transition-opacity ${isLocked ? "opacity-60" : ""}`}>
                <textarea
                    ref={textareaRef}
                    placeholder={isWaitingResponse ? "LogiBot está digitando..." : "Mensagem para o LogiBot"}
                    className="w-full bg-transparent text-gray-200 text-sm outline-none pt-4 px-4 resize-none overflow-hidden max-h-[200px] min-h-[56px] leading-relaxed placeholder-neutral-500 font-[Poppins] disabled:cursor-not-allowed"
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLocked}
                />
                <div className="flex items-center justify-between px-3 pb-3 pt-1">
                    <span className="text-[11px] text-neutral-600 font-[Poppins] select-none">
                        Enter para enviar · Shift+Enter para nova linha
                    </span>
                    <button
                        onClick={handleSend}
                        disabled={!canSend}
                        aria-label="Enviar mensagem"
                        className={`p-2 rounded-lg transition-all ${
                            isLocked
                                ? "bg-neutral-700 text-neutral-500 cursor-not-allowed"
                                : canSend
                                ? "bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                                : "bg-neutral-700 text-neutral-500 cursor-not-allowed"
                        }`}
                    >
                        {isLocked ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <ArrowUp size={18} strokeWidth={2} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
