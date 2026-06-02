import { useQuery, useQueryClient } from '@tanstack/react-query';
import { logger } from "@/shared/lib/logger";
import { historyService, ChatSession, ChatHistoryDetail } from '@/features/chat/api/chatHistoryApi';

interface UseChatHistoryOptions {
  userId: string;
  enabled?: boolean;
}

function useChatHistory({ userId, enabled = true }: UseChatHistoryOptions) {
  const queryClient = useQueryClient();

  const {
    data: sessions = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ChatSession[]>({
    queryKey: ['chatHistory', userId],
    queryFn: async () => {
      const result = await historyService.getChatSessions(userId);
      return result;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: enabled && !!userId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });

  const getChatMessages = async (sessionId: string): Promise<ChatHistoryDetail> => {
    try {
      const result = await queryClient.fetchQuery<ChatHistoryDetail>({
        queryKey: ['chatMessages', userId, sessionId],
        queryFn: async () => {
          const data = await historyService.getChatMessages(userId, sessionId);
          return data;
        },
        staleTime: 5 * 60 * 1000,
      });

      return result;
    } catch (error) {
      logger.error("ChatHistory", "Erro ao buscar mensagens.", error);
      throw error;
    }
  };

  const invalidateHistory = () => {
    queryClient.invalidateQueries({ queryKey: ['chatHistory', userId] });
  };

  const addSessionToCache = (newSession: ChatSession) => {
    queryClient.setQueryData<ChatSession[]>(
      ['chatHistory', userId],
      (old = []) => [newSession, ...old]
    );
  };

  const clearCache = () => {
    queryClient.removeQueries({ queryKey: ['chatHistory', userId] });
    queryClient.removeQueries({ queryKey: ['chatMessages', userId] });
  };

  return {
    sessions,
    isLoading,
    isError,
    error,
    refetch,
    getChatMessages,
    invalidateHistory,
    addSessionToCache,
    clearCache,
  };
}

export function usePrefetchChatHistory() {
  const queryClient = useQueryClient();

  return (userId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['chatHistory', userId],
      queryFn: () => historyService.getChatSessions(userId),
      staleTime: 5 * 60 * 1000,
    });
  };
}

export { useChatHistory };
