import { t, useLocale } from "@/i18n";
﻿import { ArrowUp, Loader2 } from "lucide-react";
import { logger } from "@/shared/lib/logger";
import { userAnalysisApi } from "@/features/chat/api/chatAnalyticsApi";
import { memo, useCallback, useEffect, useRef, useState } from "react";

interface ChatInputProps {
  sendMessage: (message: string) => void | Promise<void>;
  isWaitingResponse?: boolean;
}

export const ChatInput = memo(function ChatInput({
  sendMessage,
  isWaitingResponse = false,
}: ChatInputProps) {
  const locale = useLocale();

  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isLocked = isSending || isWaitingResponse;
  const canSend = !isLocked && inputText.trim().length > 0;
  const [isMultiline, setIsMultiline] = useState(false);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(scrollHeight, 200)}px`;
      setIsMultiline(scrollHeight > 40);
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [adjustHeight, inputText]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isLocked) return;

    setIsSending(true);
    try {
      userAnalysisApi.addInteraction(text).catch(() => {});
      setInputText("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      await Promise.resolve(sendMessage(text));
    } catch (err) {
      logger.error("Chat", "Erro ao enviar mensagem.", err);
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
      <div
        className={`flex items-end gap-2 w-full max-w-3xl bg-neutral-800 border border-neutral-700 ${isMultiline ? "rounded-3xl" : "rounded-full"} pl-5 pr-2 py-2 shadow-lg transition-opacity ${isLocked ? "bg-neutral-700 border-neutral-600" : ""}`}
      >
        <textarea
          ref={textareaRef}
          placeholder={
            isWaitingResponse
              ? t("chat.logibotEstaDigitando", {}, locale)
              : t("chat.mensagemParaOLogibot", {}, locale)
          }
          className="flex-1 bg-transparent text-gray-200 text-sm outline-none resize-none overflow-y-auto max-h-[200px] min-h-[24px] py-1 leading-normal placeholder-neutral-500 font-[Poppins] disabled:cursor-not-allowed"
          rows={1}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLocked}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          aria-label={t("chat.enviarMensagem", {}, locale)}
          className={`shrink-0 h-8 w-8 flex items-center justify-center rounded-full transition-all ${
            isLocked
              ? "bg-neutral-700 text-neutral-500 cursor-not-allowed"
              : canSend
                ? "bg-blue-600 hover:bg-blue-500 text-on-accent cursor-pointer"
                : "bg-neutral-700 text-neutral-500 cursor-not-allowed"
          }`}
        >
          {isLocked ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ArrowUp size={16} strokeWidth={2.5} />
          )}
        </button>
      </div>
    </div>
  );
});
