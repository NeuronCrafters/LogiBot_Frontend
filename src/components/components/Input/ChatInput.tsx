import { Send } from "lucide-react";
import { userAnalysisApi } from "@/services/api/api_userAnalysis";
import { useState } from "react";

interface ChatInputProps {
    inputText: string;
    setInputText: (text: string) => void;
    sendMessage: (message: string) => void;
}

export function ChatInput({ inputText, setInputText, sendMessage }: ChatInputProps) {
    const [isSending, setIsSending] = useState(false);

    const handleSend = () => {
        const text = inputText.trim();
        if (!text || isSending) return;

        setIsSending(true);

        try {
            userAnalysisApi.addInteraction(text)
                .catch(err => {
                    console.error("Erro ao gravar interação:", err);
                });
            sendMessage(text);
            setInputText("");
        } catch (err) {
            console.error("Erro ao enviar mensagem:", err);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 mb-8 px-4 flex justify-center">
            <div className="flex items-center bg-[#1a1f27] rounded-full w-full max-w-lg mx-auto p-2">
                <input
                    type="text"
                    placeholder="Comece a escrever"
                    className="flex-1 bg-transparent text-gray-200 outline-none rounded-full py-3 px-6"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    disabled={isSending}
                />
                <button
                    onClick={handleSend}
                    className={`text-neutral-200 ${isSending ? 'bg-blue-500' : 'bg-blue-700'} rounded-full p-2 ml-2 transition-colors ${isSending ? 'opacity-70' : 'hover:bg-blue-600'}`}
                    aria-label="Enviar mensagem"
                    disabled={isSending}
                >
                    <Send strokeWidth={1.5} />
                </button>
            </div>
        </div>
    );
}