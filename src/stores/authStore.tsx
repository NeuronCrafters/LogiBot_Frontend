import { create } from "zustand";
import axios from "axios";

type UserRole = "student" | "teacher" | "professor" | "course-coordinator" | "admin";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole[];
  school: string;
}

interface AuthState {
  user: User | null;
  token: string;
  isAuthenticated: boolean;
  setUser: (userData: User & { token: string }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const token = localStorage.getItem("token");
  const userStorage = localStorage.getItem("user");

  return {
    user: userStorage ? JSON.parse(userStorage) : null,
    token: token || "",
    isAuthenticated: !!token,

    setUser: (userData) => {
      localStorage.setItem("token", userData.token);
      localStorage.setItem("user", JSON.stringify(userData));

      set({
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role as UserRole[],
          school: userData.school,
        },
        token: userData.token,
        isAuthenticated: true,
      });
    },

    logout: async () => {
      try {
        const storedToken = localStorage.getItem("token");

        if (storedToken) {
          await axios.post(
            "http://localhost:3000/auth/logout",
            {},
            { headers: { Authorization: `Bearer ${storedToken}` } }
          );
        }
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
      }

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      set({
        user: null,
        token: "",
        isAuthenticated: false,
      });
    },
  };
});
