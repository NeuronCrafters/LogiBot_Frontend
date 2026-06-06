import { useNavigate, useSearchParams } from "react-router-dom";
import { MessageSquare, Loader2, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/shared/lib/formatDate";
import { useChatHistory } from "@/features/chat/hooks/useChatHistory";

interface ChatHistoryProps {
  userId: string;
  closeMenu?: () => void;
}

function ChatHistory({ userId, closeMenu }: ChatHistoryProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeSessionId = searchParams.get("session") ?? "";

  const {
    sessions = [],
    isLoading,
    isError,
  } = useChatHistory({
    userId,
    enabled: !!userId,
  });

  const handleSelect = (sessionId: string) => {
    navigate(`/chat?session=${sessionId}`);
    closeMenu?.();
  };

  const handleNewChat = () => {
    navigate("/chat");
    closeMenu?.();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2">
        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        <span className="text-xs text-zinc-500 font-[Poppins]">
          Carregando...
        </span>
      </div>
    );
  }

  const hasNoSessions = !Array.isArray(sessions) || sessions.length === 0;

  return (
    <div className="flex flex-col w-full gap-1">
      <Button
        onClick={handleNewChat}
        className="w-full h-9 bg-blue-600 hover:bg-blue-500 text-white text-xs font-[Poppins] font-medium rounded-lg border border-blue-500/30 transition-colors gap-1.5 mb-1"
      >
        <Plus size={14} />
        Nova conversa
      </Button>

      {isError ? (
        <div className="flex flex-col items-center justify-center h-32 gap-2 px-4 text-center">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-xs text-zinc-500 font-[Poppins]">
            Erro ao carregar histórico.
          </span>
        </div>
      ) : hasNoSessions ? (
        <div className="flex flex-col items-center justify-center h-32 gap-2 px-4 text-center">
          <MessageSquare className="w-5 h-5 text-zinc-700" />
          <span className="text-xs text-zinc-500 font-[Poppins]">
            Nenhuma conversa iniciada.
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {sessions.map((session) => (
            <div
              key={session.sessionId}
              onClick={() => handleSelect(session.sessionId)}
              className={`group flex items-start gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                session.sessionId === activeSessionId
                  ? "bg-white/10 border border-white/10"
                  : "hover:bg-white/5"
              }`}
            >
              <MessageSquare
                size={14}
                className="text-blue-400 shrink-0 mt-0.5"
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className={`text-xs font-[Poppins] truncate leading-snug transition-colors ${session.sessionId === activeSessionId ? "text-white" : "text-zinc-300 group-hover:text-white"}`}>
                  {session.title || "Nova Interação"}
                </span>
                <span className="text-[11px] text-zinc-600 font-[Poppins] leading-snug">
                  {session.lastActivityAt
                    ? formatRelativeTime(new Date(session.lastActivityAt))
                    : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { ChatHistory };
