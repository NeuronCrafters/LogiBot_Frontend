import { api } from "@/services/api/api";

interface RasaActionResponse {
  responses: { text: string }[];
}

export const rasaService = {
  async sendMessage(message: string) {
    const response = await api.post(
      "/sael/talk",
      { message },
      { withCredentials: true }
    );
    return response.data;
  },

  async listarNiveis() {
    console.log("Fazendo requisição para listar níveis...");
    try {
      const response = await api.get("/sael/action/listar_niveis", {
        withCredentials: true,
      });
      console.log("Resposta da API:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erro na requisição listarNiveis:", error);
      throw error;
    }
  },

  async definirNivel(nivel: string) {
    const response = await api.post(
      "/sael/action/definir_nivel",
      { nivel },
      { withCredentials: true }
    );
    return response.data;
  },

  async listarOpcoes() {
    const response = await api.get("/sael/action/listar_opcoes", {
      withCredentials: true,
    });
    return response.data;
  },

  async listarSubopcoes(categoria: string) {
    const response = await api.post(
      "/sael/action/listar_subopcoes",
      { categoria },
      { withCredentials: true }
    );
    return response.data;
  },

  async gerarPerguntas(pergunta: string) {
    const response = await api.post(
      "/sael/action/gerar_perguntas",
      { pergunta },
      { withCredentials: true }
    );
    return response.data;
  },

  async getGabarito() {
    const response = await api.get("/sael/action/gabarito", {
      withCredentials: true,
    });
    return response.data;
  },

  async verificarRespostas(respostas: string[]) {
    const response = await api.post(
      "/sael/action/send",
      { respostas },
      { withCredentials: true }
    );
    return response.data;
  },

  async perguntar(message: string, senderId: string): Promise<RasaActionResponse> {
    const response = await api.post(
      "/sael/action/perguntar",
      { message, senderId },
      { withCredentials: true }
    );
    return response.data;
  },

  async conversar() {
    const response = await api.post(
      "/sael/action/conversar",
      {},
      { withCredentials: true }
    );
    return response.data;
  },
};
