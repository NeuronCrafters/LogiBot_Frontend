import axios from "axios";

const API_KEY = import.meta.env.VITE_API_KEY;
const baseURL = import.meta.env.VITE_API_BASE_URL;

export const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: { "x-api-key": API_KEY },
});

export const publicApi = axios.create({
    baseURL,
    withCredentials: false,
    headers: { "x-api-key": API_KEY },
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn("usuário não autenticado");
        } else if (error.response?.status >= 500) {
            console.log("erro interno do servidor:", error.response.data);
        }
        return Promise.reject(error);
    }
);

publicApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn("erro público de autenticação");
        } else if (error.response?.status >= 500) {
            console.log("erro interno público:", error.response.data);
        }
        return Promise.reject(error);
    }
);

export default api;
