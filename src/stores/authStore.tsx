import { create } from "zustand";

type UserRole = "student" | "teacher" | "course-coordinator" | "admin";

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

    logout: () => {
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
