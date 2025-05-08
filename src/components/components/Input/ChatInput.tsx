import { Send } from "lucide-react";

interface ChatInputProps {
    inputText: string;
    setInputText: (text: string) => void;
    sendMessage: (message: string) => void;
}

function ChatInput({ inputText, setInputText, sendMessage }: ChatInputProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 mb-8 px-4 flex justify-center">
            <div className="flex items-center bg-[#1a1f27] size-14 rounded-full w-full max-w-lg mx-auto p-2">
                <input
                    type="text"
                    placeholder="Comece a escrever"
                    className="w-full bg-transparent text-gray-200 outline-none rounded-full py-3 px-6"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                />
                <button
                    onClick={() => sendMessage(inputText)}
                    className="text-neutral-200 bg-blue-700 rounded-full p-2 ml-2"
                    aria-label="Enviar mensagem"
                >
                    <Send strokeWidth={1.5} />
                </button>

            </div>
        </div>
    );
}

export { ChatInput };
