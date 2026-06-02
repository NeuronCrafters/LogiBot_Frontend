import { api } from "@/services/api/api";
import { logger } from "@/utils/logger";

interface RasaActionResponse {
  responses: { text: string }[];
  sessionId?: string;
}

export const rasaService = {
  async sendMessage(message: string) {
    const response = await api.post(
      "/chat/messages",
      { message },
      { withCredentials: true }
    );
    return response.data;
  },

  async listarNiveis() {
    try {
      const response = await api.get("/quiz/levels", {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      logger.error("Rasa", "Erro na requisição listarNiveis.", error);
      throw error;
    }
  },

  async definirNivel(nivel: string) {
    const response = await api.post(
      "/quiz/level",
      { level: nivel },
      { withCredentials: true }
    );
    return response.data;
  },

  async listarOpcoes() {
    const response = await api.get("/quiz/categories", {
      withCredentials: true,
    });
    return response.data;
  },

  async listarSubopcoes(categoria: string) {
    const response = await api.post(
      "/quiz/subcategories",
      { category: categoria },
      { withCredentials: true }
    );
    return response.data;
  },

  async gerarPerguntas(pergunta: string) {
    const response = await api.post(
      "/quiz/questions",
      { subtopic: pergunta },
      { withCredentials: true }
    );
    return response.data;
  },

  async getGabarito() {
    const response = await api.get("/quiz/answer-key", {
      withCredentials: true,
    });
    return response.data;
  },

  async verificarRespostas(respostas: string[]) {
    const response = await api.post(
      "/quiz/answers",
      { answers: respostas },
      { withCredentials: true }
    );
    return response.data;
  },

  async perguntar(message: string, senderId: string, sessionId?: string): Promise<RasaActionResponse> {
    const response = await api.post(
      "/chat/messages",
      { message, senderId, sessionId },
      { withCredentials: true }
    );
    return response.data;
  },

  async conversar() {
    const response = await api.post(
      "/chat/messages",
      { message: "conversar" },
      { withCredentials: true }
    );
    return response.data;
  },
};
