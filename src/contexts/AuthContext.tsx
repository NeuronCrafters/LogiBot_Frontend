import { createContext } from "react";

export interface User {
    _id: string;
    name: string;
    email: string;
    role: string[] | string;
    school?: string;
    course?: string;
    class?: string;
}

export interface AuthContextData {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    getUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);
