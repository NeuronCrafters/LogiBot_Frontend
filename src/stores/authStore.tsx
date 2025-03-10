import { create } from "zustand";

interface AuthState {
  id: string;
  name: string;
  email: string;
  role: string[];
  school: string;
  token: string;
  isAuthenticated: boolean;
  setUser: (userData: Partial<AuthState>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  id: "",
  name: "",
  email: "",
  role: [],
  school: "",
  token: "",
  isAuthenticated: false,

  setUser: (userData) => set((state) => ({
    ...state,
    ...userData,
    isAuthenticated: !!userData.token,
  })),

  logout: () => set({
    id: "",
    name: "",
    email: "",
    role: [],
    school: "",
    token: "",
    isAuthenticated: false,
  }),
}));
