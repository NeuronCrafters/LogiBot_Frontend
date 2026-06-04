import { useCallback, useEffect, useRef, useState } from "react";
import { logger } from "@/shared/lib/logger";
import { useNavigate } from "react-router-dom";
import { api } from "@/shared/api/httpClient";
import { AuthContext, AuthContextData, User } from "./AuthContext";
import { useCategoryClickTracker } from "@/features/chat/hooks/useCategoryClickTracker";
import { useQueryClient } from "@tanstack/react-query";
import { usePrefetchChatHistory } from "@/features/chat/hooks/useChatHistory";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { flushClicks } = useCategoryClickTracker(user?._id || null);
  const prefetchChatHistory = usePrefetchChatHistory();

  const isAuthenticated = !!user;

  async function login(email: string, password: string) {
    try {
      const response = await api.post(
        "/auth/session",
        { email, password },
        { withCredentials: true }
      );

      if (response.data.success) {
        await getUser();

        if (user?._id) {
          prefetchChatHistory(user._id);
        }

        navigate("/home");
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || "erro ao autenticar";
      throw new Error(message);
    }
  }

  async function getUser() {
    try {
      const response = await api.get("/auth/me", { withCredentials: true });
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

      localStorage.setItem("has_session", "1");
      setUser(safeUser);

      if (safeUser._id) {
        prefetchChatHistory(safeUser._id);
      }
    } catch (error: any) {
      if (error?.response?.status !== 401) {
        logger.error("Auth", "Erro ao obter usuário.", error);
      }
      localStorage.removeItem("has_session");
      setUser(null);
    }
  }

  const logout = useCallback(async () => {
    try {
      await flushClicks();
      await api.post("/auth/logout", {}, { withCredentials: true });
    } catch (error) {
      logger.error("Auth", "Erro ao fazer logout.", error);
    } finally {
      localStorage.removeItem("has_session");
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
        logger.info("Auth", "Usuário inativo por 2 horas. Desconectando.");
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
    if (localStorage.getItem("has_session")) {
      getUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const contextValue: AuthContextData = {
    user,
    setUser,
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
