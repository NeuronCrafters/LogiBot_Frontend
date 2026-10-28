import { ArrowDown } from "lucide-react";
import { logger } from "@/shared/lib/logger";
import { User } from "@/app/providers/AuthContext";
import { ChatInput } from "@/features/chat/components/ChatInput";
import {
  useChatFlow,
  type ChatMessage,
} from "@/features/chat/hooks/useChatFlow";
import { useChatHistory } from "@/features/chat/hooks/useChatHistory";
import {
  memo,
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react";
import { useSearchParams } from "react-router-dom";
import logo from "@/assets/logo.svg";
import { MarkdownMessageBubble } from "./MarkdownMessageBubble";
import { ChatTypingDots } from "./ChatTypingDots";
import { historyService } from "@/features/chat/api/chatHistoryApi";

interface StudentChatContentProps {
  user: User;
}

const ChatMessageList = memo(function ChatMessageList({
  messages,
}: {
  messages: ChatMessage[];
}) {
  return (
    <>
      {messages.map((msg, index) =>
        msg.type === "typing" ? (
          <ChatTypingDots key={msg.id || index} streamStage={msg.streamStage} />
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
    const title =
      rawTitle.length > 55
        ? `${rawTitle.slice(0, 55).trimEnd()}...`
        : rawTitle || "New Chat";
    addSessionToCache({
      sessionId,
      title,
      lastActivityAt: new Date().toISOString(),
    });
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const [isWaitingResponse, setIsWaitingResponse] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldJumpToHistoryBottomRef = useRef(false);

  const scrollToBottom = useCallback((smooth = true) => {
    const container = containerRef.current;
    if (container) {
      if (smooth) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      } else {
        container.scrollTop = container.scrollHeight;
      }
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

          shouldJumpToHistoryBottomRef.current = true;
          setMessages(formatted);
          setMode("chat");
          setSessionId(sessionIdFromUrl);
        }
      } catch (error) {
        logger.error("Chat", "Failed to load history.", error);
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
  ]);

  const checkScrollPosition = useCallback(() => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  }, []);

  useLayoutEffect(() => {
    if (mode !== "chat" && !sessionIdFromUrl) return;

    if (shouldJumpToHistoryBottomRef.current) {
      shouldJumpToHistoryBottomRef.current = false;
      scrollToBottom(false);
      return;
    }

    const frameId = window.requestAnimationFrame(() => scrollToBottom(true));
    const timeoutId = window.setTimeout(() => scrollToBottom(true), 50);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [messages, mode, sessionIdFromUrl, scrollToBottom]);

  const handleSendWrapper = useCallback(
    async (text: string) => {
      scrollToBottom();
      setIsWaitingResponse(true);
      try {
        await sendMessage(text);
      } catch (error) {
        logger.error("Chat", "Failed to send message.", error);
      } finally {
        setIsWaitingResponse(false);
      }
    },
    [scrollToBottom, sendMessage],
  );

  const isNewConversation =
    !sessionIdFromUrl && mode === "chat" && messages.length === 0;

  if (loadingHistory) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-poppins text-sm text-gray-400">
            Loading conversation...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative min-h-0">
      {isNewConversation ? (
        <div className="absolute inset-0 flex items-center justify-center px-4 pb-16">
          <div className="w-full max-w-3xl">
            <div className="mb-7 flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center bg-neutral-900 shadow-lg">
                <img
                  src={logo}
                  alt="LogiBot"
                  className="h-full w-full object-contain"
                />
              </div>
              <h1 className="font-[Poppins] text-2xl sm:text-3xl font-semibold text-white">
                What are we going to code today?
              </h1>
              <p className="mt-3 font-[Poppins] text-sm sm:text-base text-neutral-400">
                Ask questions about logic, understand errors in your code and request step-by-step explanations to learn programming more clearly.
              </p>
            </div>
            <ChatInput
              sendMessage={handleSendWrapper}
              isWaitingResponse={isWaitingResponse}
            />
          </div>
        </div>
      ) : (
        <>
          <div
            id="chat-container"
            ref={containerRef}
            onScroll={checkScrollPosition}
            className="absolute inset-0 overflow-y-auto"
          >
            {(mode === "chat" || sessionIdFromUrl) && (
              <div className="w-full max-w-6xl mx-auto pt-6 pb-40 flex flex-col">
                <ChatMessageList messages={messages} />
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
        </>
      )}

      {!isNewConversation && showScrollButton && (
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
