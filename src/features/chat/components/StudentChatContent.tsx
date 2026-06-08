import { ArrowDown } from "lucide-react";
import { logger } from "@/shared/lib/logger";
import { User } from "@/app/providers/AuthContext";
import { ChatInput } from "@/features/chat/components/ChatInput";
import { useChatFlow, type ChatMessage } from "@/features/chat/hooks/useChatFlow";
import { useChatHistory } from "@/features/chat/hooks/useChatHistory";
import { memo, useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { MarkdownMessageBubble } from "./MarkdownMessageBubble";
import { ChatTypingDots } from "./ChatTypingDots";
import { historyService } from "@/features/chat/api/chatHistoryApi";

interface StudentChatContentProps {
  user: User;
}

const ChatMessageList = memo(function ChatMessageList({
  messages,
  loadingHistory,
}: {
  messages: ChatMessage[];
  loadingHistory: boolean;
}) {
  return (
    <>
      {messages.length === 0 && !loadingHistory && (
        <div className="text-center text-neutral-500 py-10 font-[Poppins] text-sm">
          Inicie a conversa abaixo...
        </div>
      )}

      {messages.map((msg, index) =>
        msg.type === "typing" ? (
          <ChatTypingDots key={msg.id || index} />
        ) : (
          <MarkdownMessageBubble
            key={msg.id || index}
            text={msg.text}
            sender={msg.sender}
            retrievedChunks={msg.retrievedChunks}
          />
        ),
      )}
    </>
  );
});

const StudentChatContent: React.FC<StudentChatContentProps> = ({ user }) => {
  const userId = user?._id || "user";
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionIdFromUrl = searchParams.get("session");

  const {
    messages,
    mode,
    resumeOpenJobs,
    sendMessage,
    setMessages,
    setMode,
    setSessionId,
    sessionId,
  } = useChatFlow({ userId });

  const { addSessionToCache } = useChatHistory({ userId });

  useEffect(() => {
    if (!sessionIdFromUrl) {
      setMessages([]);
      setSessionId(undefined);
      setMode("chat");
    }
  }, [sessionIdFromUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sessionId) return;
    if (sessionIdFromUrl) return; // existing session loaded from URL, not new

    setSearchParams({ session: sessionId }, { replace: true });

    const firstUserMsg = messages.find((m) => m.sender === "user");
    const rawTitle = firstUserMsg?.text.trim().replace(/\s+/g, " ") ?? "";
    const title = rawTitle.length > 55 ? `${rawTitle.slice(0, 55).trimEnd()}...` : rawTitle || "Nova Conversa";
    addSessionToCache({ sessionId, title, lastActivityAt: new Date().toISOString() });
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const [isWaitingResponse, setIsWaitingResponse] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
      setShowScrollButton(false);
    }
  }, []);

  useEffect(() => {
    async function loadHistory() {
      if (!sessionIdFromUrl) return;
      if (sessionIdFromUrl === sessionId && messages.length > 0) {
        setMode("chat");
        return;
      }

      setLoadingHistory(true);

      try {
        const data = await historyService.getChatMessages(
          userId,
          sessionIdFromUrl,
        );

        // Backend returns a raw array; also handle wrapped { messages: [...] } for safety
        const rows: any[] = Array.isArray(data)
          ? data
          : ((data as any)?.messages ?? []);

        if (rows.length > 0) {
          const formatted = rows.map((m: any, index: number) => ({
            id: m.id || m._id || `msg-${index}`,
            text: m.content || "",
            sender: (m.role === "assistant" ? "bot" : "user") as "user" | "bot",
            type: "text" as const,
            retrievedChunks: m.metadata?.retrievedChunks?.length
              ? m.metadata.retrievedChunks
              : undefined,
          }));

          setMessages(formatted);
          setMode("chat");
          setSessionId(sessionIdFromUrl);
          void resumeOpenJobs(sessionIdFromUrl);

          setTimeout(() => scrollToBottom(false), 100);
        }
      } catch (error) {
        logger.error("Chat", "Erro ao carregar histórico.", error);
      } finally {
        setLoadingHistory(false);
      }
    }

    loadHistory();
  }, [
    sessionIdFromUrl,
    sessionId,
    userId,
    messages.length,
    setMessages,
    setMode,
    setSessionId,
    resumeOpenJobs,
    scrollToBottom,
  ]);

  const checkScrollPosition = useCallback(() => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  }, []);

  useEffect(() => {
    if (mode !== "chat" && !sessionIdFromUrl) return;

    const frameId = window.requestAnimationFrame(() => scrollToBottom(true));
    const timeoutId = window.setTimeout(() => scrollToBottom(true), 50);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [messages, mode, sessionIdFromUrl, scrollToBottom]);

  const handleSendWrapper = useCallback(async (text: string) => {
    scrollToBottom();
    setIsWaitingResponse(true);
    try {
      await sendMessage(text);
    } catch (error) {
      logger.error("Chat", "Erro ao enviar mensagem.", error);
    } finally {
      setIsWaitingResponse(false);
    }
  }, [scrollToBottom, sendMessage]);

  if (loadingHistory) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-poppins text-sm text-gray-400">
            Carregando conversa...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative min-h-0">
      <div
        id="chat-container"
        ref={containerRef}
        onScroll={checkScrollPosition}
        className="absolute inset-0 overflow-y-auto scroll-smooth"
      >
        {(mode === "chat" || sessionIdFromUrl) && (
          <div className="w-full max-w-3xl mx-auto px-4 pt-6 pb-44 flex flex-col">
            <ChatMessageList
              messages={messages}
              loadingHistory={loadingHistory}
            />
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {(mode === "chat" || sessionIdFromUrl) && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-neutral-900 via-neutral-900/80 to-transparent pt-10">
          <ChatInput
            sendMessage={handleSendWrapper}
            isWaitingResponse={isWaitingResponse}
          />
        </div>
      )}

      {showScrollButton && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-36 left-0 right-0 mx-auto w-fit z-20 p-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-full shadow-lg border border-neutral-600 transition-colors cursor-pointer"
        >
          <ArrowDown size={16} />
        </button>
      )}
    </div>
  );
};

export default StudentChatContent;
