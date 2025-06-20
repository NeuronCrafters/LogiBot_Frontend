import axios from "axios";

const API_KEY = import.meta.env.VITE_API_KEY;
const baseURL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        "x-api-key": API_KEY,
    },
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn("Usuário não autenticado");
        } else if (error.response?.status >= 500) {
            console.error("Erro interno do servidor:", error.response.data);
        }
        return Promise.reject(error);
    }
);

export { api };
