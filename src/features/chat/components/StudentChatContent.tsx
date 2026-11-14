import { RobotAvatar } from "@/shared/mascot/RobotAvatar";
import { useQueryClient } from "@tanstack/react-query";
import { ChatFollowUpSuggestions } from "./ChatFollowUpSuggestions";
import { ChatQuizPracticeInvitation } from "./ChatQuizPracticeInvitation";
import { t, useLocale, normalizeLanguage } from "@/i18n";
﻿import { ArrowDown } from "lucide-react";
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
  Fragment,
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react";
import { useSearchParams } from "react-router-dom";
import { usePreferences, useReducedMotion } from "@/shared/preferences";
import { MarkdownMessageBubble } from "./MarkdownMessageBubble";
import { ChatTypingDots } from "./ChatTypingDots";
import { historyService } from "@/features/chat/api/chatHistoryApi";

interface StudentChatContentProps {
  user: User;
}

export const ChatMessageList = memo(function ChatMessageList({
  messages,
  sessionId,
  userId,
  busy = false,
  onSend,
  onSuggestionsReady,
}: {
  messages: ChatMessage[];
  sessionId?: string;
  userId?: string;
  busy?: boolean;
  onSend?: (text: string, editMessageId?: string) => Promise<void>;
  onSuggestionsReady?: () => void;
}) {
  useLocale();
  const { chatDisplay } = usePreferences();
  const questions = messages.filter(message => message.sender === "user").map(message => message.text);

  return (
    <>
      {messages.map((msg, index) =>
        msg.type === "typing" || (chatDisplay === "complete" && msg.streaming) ? (
          <ChatTypingDots key={msg.id || index} streamStage={msg.streaming ? "agent" : msg.streamStage} />
        ) : (
          <Fragment key={msg.id || index}>
          <MarkdownMessageBubble
            text={msg.text}
            outputLanguage={msg.outputLanguage}
            sender={msg.sender}
            retrievedChunks={msg.retrievedChunks}
            busy={busy}
            onEdit={onSend && sessionId && msg.sender === "user" && /^[0-9a-f-]{36}$/i.test(msg.id) ? text => onSend(text, msg.id) : undefined}
          />
          {onSend && sessionId && !busy && index === messages.length - 1 && msg.sender === "bot" && !msg.streaming && !msg.failed && msg.text.trim() && /^[0-9a-f-]{36}$/i.test(msg.serverId || msg.id) &&
            <>
            <ChatFollowUpSuggestions sessionId={sessionId} messageId={msg.serverId || msg.id} questions={questions} onSelect={question => { void onSend(question).catch(() => {}); }} onReady={onSuggestionsReady} />
            {userId && <ChatQuizPracticeInvitation userId={userId} sessionId={sessionId} questions={questions} onReady={onSuggestionsReady} />}
            </>}
          </Fragment>
        ),
      )}
    </>
  );
});

const StudentChatContent: React.FC<StudentChatContentProps> = ({ user }) => {
  const locale = useLocale();
  const queryClient = useQueryClient();
  const sending = useRef(false);

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
        : rawTitle || t("chat.novaConversa_333", {}, locale);
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
  const reduceMotion = useReducedMotion();
  const followBottomRef = useRef(true);
  const [announcement, setAnnouncement] = useState("");
  const wasWaitingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldJumpToHistoryBottomRef = useRef(false);

  const scrollToBottom = useCallback((smooth = true) => {
    const container = containerRef.current;
    if (container) {
      followBottomRef.current = true;
      if (smooth && !reduceMotion) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      } else {
        container.scrollTop = container.scrollHeight;
      }
      setShowScrollButton(false);
    }
  }, [reduceMotion]);

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
            outputLanguage: normalizeLanguage(m.metadata?.outputLanguage),
            sender: (m.role === "assistant" ? "bot" : "user") as "user" | "bot",
              serverId: m.id || m._id,
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
  ]);

  const checkScrollPosition = useCallback(() => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      followBottomRef.current = isNearBottom;
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

    if (!followBottomRef.current) {
      setShowScrollButton(true);
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
    async (text: string, editMessageId?: string) => {
      if (sending.current) return;
      sending.current = true;
      scrollToBottom();
      setIsWaitingResponse(true);
      try {
        await sendMessage(text, editMessageId);
        if (editMessageId) void queryClient.invalidateQueries({ queryKey: ["chatHistory", userId] });
      } catch (error) {
        logger.error("Chat", "Erro ao enviar mensagem.", error);
        throw error;
      } finally {
        sending.current = false;
        setIsWaitingResponse(false);
      }
    },
    [scrollToBottom, sendMessage, queryClient, userId],
  );

  const handleSuggestionsReady = useCallback(() => {
    if (followBottomRef.current) scrollToBottom();
  }, [scrollToBottom]);

  useEffect(() => {
    if (wasWaitingRef.current && !isWaitingResponse) setAnnouncement(t("chat.respostaRecebida", {}, locale));
    if (isWaitingResponse) setAnnouncement("");
    wasWaitingRef.current = isWaitingResponse;
  }, [isWaitingResponse, locale]);

  const isNewConversation =
    !sessionIdFromUrl && mode === "chat" && messages.length === 0;

  if (loadingHistory) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-poppins text-sm text-gray-400">
            {t("chat.carregandoConversa", {}, locale)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative min-h-0">
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
      {isNewConversation ? (
        <div className="absolute inset-0 flex items-center justify-center px-4 pb-16">
          <div className="w-full max-w-3xl">
            <div className="mb-7 flex flex-col items-center text-center">
              <RobotAvatar className="mb-4 h-32 w-32 sm:h-40 sm:w-40" />
              <h1 className="font-[Poppins] text-2xl sm:text-3xl font-semibold text-white">
                {t("chat.oQueVamosProgramarHoje", {}, locale)}</h1>
              <p className="mt-3 font-[Poppins] text-sm sm:text-base text-neutral-400">
                {t("chat.tireDuvidasSobreLogicaEntendaErrosNo", {}, locale)}</p>
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
                <ChatMessageList messages={messages} sessionId={sessionId} userId={userId} busy={isWaitingResponse} onSend={handleSendWrapper} onSuggestionsReady={handleSuggestionsReady} />
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
          type="button"
          aria-label={t("chat.irParaUltimaMensagem", {}, locale)}
          title={t("chat.irParaUltimaMensagem", {}, locale)}
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-36 left-0 right-0 mx-auto w-fit z-20 p-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-full shadow-lg border border-neutral-600 transition-colors cursor-pointer"
        >
          <ArrowDown size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default StudentChatContent;
