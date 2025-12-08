import { Send, Loader2 } from "lucide-react";
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

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${textarea.scrollHeight}px`;
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
            userAnalysisApi.addInteraction(text)
                .catch(() => { });

            sendMessage(text);
            setInputText("");

            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }
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
        <div className="fixed bottom-0 left-0 right-0 mb-8 px-4 flex justify-center z-40 pointer-events-none">
            <div className={`pointer-events-auto flex items-end bg-[#1a1f27] rounded-3xl w-full max-w-lg mx-auto p-2 border border-gray-800 shadow-xl transition-all duration-200 ${isLocked ? "opacity-70" : "opacity-100"}`}>
                <textarea
                    ref={textareaRef}
                    placeholder={isWaitingResponse ? "O LogiBot está digitando..." : "Comece a escrever..."}
                    className="flex-1 bg-transparent text-gray-200 outline-none py-3 px-4 resize-none overflow-y-auto max-h-[140px] min-h-[48px] leading-relaxed custom-scrollbar disabled:cursor-not-allowed placeholder-gray-500"
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLocked}
                />

                <button
                    onClick={handleSend}
                    className={`mb-1 text-neutral-200 ${isLocked ? 'bg-gray-700' : 'bg-blue-700 hover:bg-blue-600'} rounded-full p-2 ml-2 transition-all flex-shrink-0 shadow-lg`}
                    aria-label="Enviar mensagem"
                    disabled={isLocked}
                >
                    {isLocked ? (
                        <Loader2 size={20} className="animate-spin text-gray-400" />
                    ) : (
                        <Send size={20} strokeWidth={1.5} />
                    )}
                </button>
            </div>
        </div>
    );
}