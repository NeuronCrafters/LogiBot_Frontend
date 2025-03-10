import api from "./api";

const RASA_URL = "http://localhost:5005/webhooks/rest/webhook";
const RASA_ACTION_URL = "http://localhost:5055/webhook";

/**
 * Envia uma mensagem para o chatbot Rasa
 */
export const sendMessageToRasa = async (message: string, sender = "user") => {
  try {
    const response = await api.post(RASA_URL, { sender, message });
    return response.data;
  } catch (error) {
    console.error("Erro ao enviar mensagem para Rasa:", error);
    return [];
  }
};

/**
 * Envia ações para o Action Server do Rasa
 */
export const sendToActionServer = async (next_action: string, slots = {}) => {
  try {
    const payload = {
      next_action,
      tracker: { sender_id: "user", slots },
    };
    const response = await api.post(RASA_ACTION_URL, payload);
    return response.data;
  } catch (error) {
    console.error("Erro ao enviar ação para o servidor Rasa:", error);
    return null;
  }
};
