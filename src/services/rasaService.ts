import { api } from "./api";

const BACKEND_URL = "http://localhost:3000/sael/talk";

export const sendMessageToRasa = async (message: string) => {
  try {
    const response = await api.post(
      BACKEND_URL,
      { message },
      {
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Erro ao enviar mensagem para o backend:", error);
    return [];
  }
};
