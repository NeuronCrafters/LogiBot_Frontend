import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true,
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