import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/services/api";
import { useNavigate } from "react-router-dom";

interface User {
    _id: string;
    name: string;
    email: string;
    role: string[] | string;
    school?: string;
    course?: string;
    class?: string;
}

interface AuthContextData {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    getUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const isAuthenticated = !!user;

    async function login(email: string, password: string) {
        try {
            await api.post("/session", { email, password }, { withCredentials: true });
            await getUser();
            navigate("/chat");
        } catch (error) {
            throw new Error(`Login inválido. ${error}`);
        }
    }

    async function getUser() {
        try {
            const response = await api.get("/me", { withCredentials: true });
            setUser(response.data);
        } catch (error) {
            console.error("Erro ao obter usuário:", error);
            setUser(null);
        }
    }

    async function logout() {
        try {
            await api.post("/logout", {}, { withCredentials: true });
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        } finally {
            setUser(null);
            navigate("/signin");
        }
    }

    useEffect(() => {
        getUser().finally(() => setLoading(false));
    }, []);

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, getUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextData {
    return useContext(AuthContext);
}
