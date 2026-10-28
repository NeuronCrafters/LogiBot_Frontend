import { t, useLocale } from "@/i18n";
import logo from "@/assets/logo.svg";
import type { ChatStreamStage } from "@/features/chat/api/chatApi";

interface ChatTypingDotsProps {
  streamStage?: ChatStreamStage;
}

function getStageLabel(streamStage?: ChatStreamStage) {
  if (streamStage === "queued") {
    return t("chat.aguardandoNaFila");
  }
  if (streamStage === "history") {
    return t("chat.carregandoContexto");
  }
  if (streamStage === "rag") {
    return t("chat.consultandoMateriais");
  }
  if (streamStage === "agent") {
    return t("chat.gerandoResposta");
  }
  return null;
}

export function ChatTypingDots({ streamStage }: ChatTypingDotsProps) {
  useLocale();

  const stageLabel = getStageLabel(streamStage);

  return (
    <div className="flex gap-3 mb-6 px-2">
      <div className="flex-shrink-0 mt-1">
        <div className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-700 p-0.5 flex items-center justify-center shadow">
          <img src={logo} alt={t("common.bot")} className="w-full h-full object-contain" />
        </div>
      </div>
      <div className="bg-[#2a2a2a] border border-neutral-700 px-4 py-3 rounded-2xl rounded-bl-sm">
        <div className="flex items-center gap-3 min-h-5">
          {stageLabel && (
            <span className="font-[Poppins] text-xs text-zinc-300">
              {stageLabel}
            </span>
          )}
          <span
            className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"
            style={{ animationDelay: "160ms" }}
          />
          <span
            className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"
            style={{ animationDelay: "320ms" }}
          />
        </div>
      </div>
    </div>
  );
}
