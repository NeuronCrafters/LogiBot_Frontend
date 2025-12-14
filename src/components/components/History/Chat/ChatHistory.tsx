import { useNavigate } from "react-router-dom";
import { MessageSquare, Clock, Loader2, AlertCircle, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useChatHistory } from "@/hooks/use-ChatHistory";

interface ChatHistoryProps {
  userId: string;
  closeMenu?: () => void;
}

function ChatHistory({ userId, closeMenu }: ChatHistoryProps) {
  const navigate = useNavigate();

  const { sessions = [], isLoading, isError } = useChatHistory({
    userId,
    enabled: !!userId
  });

  const handleSelect = (sessionId: string) => {
    navigate(`/chat?session=${sessionId}`);
    if (closeMenu) {
      closeMenu();
    }
  };

  const handleNewChat = () => {
    navigate("/chat");
    if (closeMenu) {
      closeMenu();
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <Typograph
          text="Carregando..."
          colorText="text-zinc-500"
          variant="text6"
          weight="regular"
          fontFamily="poppins"
        />
      </div>
    );
  }

  const hasNoSessions = !Array.isArray(sessions) || sessions.length === 0;

  return (
    <div className="flex flex-col h-full w-full pr-3">
      <div className="pb-4 px-1">
        <Button
          onClick={handleNewChat}
          className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-poppins font-medium rounded-xl shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 border border-blue-500/50 transition-all duration-300 group"
        >
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
              <Plus size={14} className="text-white" />
            </div>
            <span>Nova Conversa</span>
          </div>
        </Button>
      </div>

      {isError ? (
        <div className="flex flex-col items-center justify-center h-40 gap-3 px-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <Typograph
            text="Erro ao carregar histórico."
            colorText="text-zinc-500"
            variant="text6"
            weight="regular"
            fontFamily="poppins"
          />
        </div>
      ) : hasNoSessions ? (
        <div className="flex flex-col items-center justify-center h-40 gap-3 px-6 text-center">
          <MessageSquare className="w-8 h-8 text-zinc-700" />
          <Typograph
            text="Nenhuma conversa iniciada."
            colorText="text-zinc-500"
            variant="text6"
            weight="regular"
            fontFamily="poppins"
          />
        </div>
      ) : (
        <ScrollArea className="flex-1 -mr-3 pr-3">
          <div className="flex flex-col gap-3 pb-4 px-1">
            {sessions.map((session, index) => (
              <motion.div
                key={session.sessionId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => handleSelect(session.sessionId)}
                className="group flex flex-col gap-2 p-3.5 rounded-xl bg-[#2a2a2a] hover:bg-[#333333] border border-transparent hover:border-zinc-700 cursor-pointer transition-all duration-200 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0 group-hover:bg-blue-500/20 transition-colors">
                      <MessageSquare size={16} />
                    </div>
                    <Typograph
                      text={session.title || "Nova Conversa"}
                      colorText="text-zinc-200 group-hover:text-white"
                      variant="text5"
                      weight="medium"
                      fontFamily="poppins"
                      className="truncate transition-colors"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-1 pl-1">
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <Clock size={12} />
                    <span className="text-[10px] font-medium font-poppins uppercase tracking-wider">
                      {session.lastActivityAt ? formatDistanceToNow(new Date(session.lastActivityAt), {
                        addSuffix: true,
                        locale: ptBR
                      }) : ''}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

export { ChatHistory };