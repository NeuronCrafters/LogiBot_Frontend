import { create } from "zustand";
import axios from "axios";

export interface User {
  name: string;
  email: string;
  avatar?: string;
  role: "student" | "teacher" | "course-coordinator" | "admin";
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("token"),
  isLoggedIn: !!localStorage.getItem("token"),
  login: async (token: string) => {
    try {
      const response = await axios.get("/api/user", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userData = response.data;

      set({
        user: userData,
        token,
        isLoggedIn: true,
      });

      localStorage.setItem("token", token);
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
      set({ user: null, token: null, isLoggedIn: false });
      localStorage.removeItem("token");
    }
  },
  logout: () => {
    set({ user: null, token: null, isLoggedIn: false });
    localStorage.removeItem("token");
  },
}));
