import api from "./api";
import { useAuthStore } from "@/stores/authStore";

const BACKEND_URL = "http://localhost:3000/sael/talk";

export const sendMessageToRasa = async (message: string) => {
  try {
    const { token } = useAuthStore.getState();

    if (!token) {
      console.error("Token JWT não encontrado.");
      throw new Error("Usuário não autenticado.");
    }

    const response = await api.post(
      BACKEND_URL,
      { message },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Erro ao enviar mensagem para o backend:", error);
    return [];
  }
};
