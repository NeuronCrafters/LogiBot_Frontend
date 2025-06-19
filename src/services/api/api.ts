import axios from "axios";

const API_KEY = "AMOMINHAESPOSAtZt8wuV*2@d7^bi195lO7^!8@L6$$!D$h4tSU8etv&7c&";

const api = axios.create({
    baseURL: "http://localhost:3000",
    // baseURL: "https://saellogibot.com/api",
    withCredentials: true,
    headers: {
        "x-api-key": API_KEY
    }
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