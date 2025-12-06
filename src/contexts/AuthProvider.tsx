import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api/api";
import { AuthContext, AuthContextData, User } from "./AuthContext";
import { useCategoryClickTracker } from "@/hooks/use-CategoryClickTracker";
import { useQueryClient } from "@tanstack/react-query";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { flushClicks } = useCategoryClickTracker(user?._id || null);

  const isAuthenticated = !!user;

  async function login(email: string, password: string, recaptchaToken: string) {
    if (!recaptchaToken) throw new Error("Token do reCAPTCHA ausente.");

    try {
      await api.post(
        "/session",
        { email, password, recaptchaToken },
        { withCredentials: true }
      );

      await getUser();
      navigate("/chat");
    } catch (error: any) {
      const message = error?.response?.data?.message || "Erro ao autenticar.";
      throw new Error(`Login inválido. ${message}`);
    } finally {
      queryClient.clear();
    }
  }

  async function getUser() {
    try {
      const response = await api.get("/me", { withCredentials: true });
      const data = response.data;

      const safeUser: User = {
        ...data,
        courses: Array.isArray(data.courses) ? data.courses : [],
        classes: Array.isArray(data.classes) ? data.classes : [],
        schoolId: Array.isArray(data.schoolId) ? data.schoolId : [data.schoolId],
        schoolName: Array.isArray(data.schoolName) ? data.schoolName : [data.schoolName],
        courseId: Array.isArray(data.courseId) ? data.courseId : [data.courseId],
        courseName: Array.isArray(data.courseName) ? data.courseName : [data.courseName],
        classId: Array.isArray(data.classId) ? data.classId : [data.classId],
        className: Array.isArray(data.className) ? data.className : [data.className],
      };

      setUser(safeUser);
    } catch (error) {
      console.error("Erro ao obter usuário:", error);
      setUser(null);
    }
  }

  const logout = useCallback(async () => {
    try {
      await flushClicks();
      await api.post("/logout", {}, { withCredentials: true });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    } finally {
      queryClient.clear();
      setUser(null);
      navigate("/signin");
    }
  }, [flushClicks, queryClient, navigate]);

  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000;

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    inactivityTimer.current = setTimeout(() => {
      if (isAuthenticated) {
        console.log("Usuário inativo por 2 horas. Desconectando...");
        logout();
      }
    }, INACTIVITY_TIMEOUT);
  }, [isAuthenticated, logout]);


  useEffect(() => {
    if (isAuthenticated) {
      const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

      const reset = () => resetInactivityTimer();

      resetInactivityTimer();

      events.forEach(event => window.addEventListener(event, reset));

      return () => {
        if (inactivityTimer.current) {
          clearTimeout(inactivityTimer.current);
        }
        events.forEach(event => window.removeEventListener(event, reset));
      };
    }
  }, [isAuthenticated, resetInactivityTimer]);

  useEffect(() => {
    getUser().finally(() => setLoading(false));
  }, []);

  const contextValue: AuthContextData = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    getUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
