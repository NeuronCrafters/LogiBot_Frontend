import { useServerSession, SessionWarning, type ServerSession } from "./useServerSession";
import { apiError } from "@/shared/lib/apiError";
import { useLocale, applyAccountLanguage, clearAccountLanguage } from "@/i18n";
﻿import { useCallback, useEffect, useRef, useState } from "react";
import { logger } from "@/shared/lib/logger";
import { useNavigate } from "react-router-dom";
import { api } from "@/shared/api/httpClient";
import { AuthContext, AuthContextData, User } from "./AuthContext";
import { useCategoryClickTracker } from "@/features/chat/hooks/useCategoryClickTracker";
import { useQueryClient } from "@tanstack/react-query";
import { usePrefetchChatHistory } from "@/features/chat/hooks/useChatHistory";


export function AuthProvider({ children }: { children: React.ReactNode }) {
  useLocale();

  const generation = useRef(0);
  const [session, setSession] = useState<ServerSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { flushClicks } = useCategoryClickTracker(user?._id || null);
  const prefetchChatHistory = usePrefetchChatHistory();

  const isAuthenticated = !!user;

  async function login(email: string, password: string) {
    generation.current++;
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
      const message = apiError(error, "common.erroAoAutenticar");
      throw new Error(message);
    }
  }

  const getUser = useCallback(async () => {
    const requestGeneration = generation.current;
    try {
      const response = await api.get("/auth/me", { withCredentials: true });
      if (requestGeneration !== generation.current) return;
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
      applyAccountLanguage(data.preferredLanguage ?? null);
      setSession(data.session?.id ? data.session : null);
      if (data.session?.id && localStorage.getItem("logibot.session.started") !== data.session.id)
        localStorage.setItem("logibot.session.started", data.session.id);
      sessionStorage.removeItem("logibot.session.expired");
      setUser(safeUser);

      if (safeUser._id) {
        prefetchChatHistory(safeUser._id);
      }
    } catch (error: any) {
      if (requestGeneration !== generation.current) return;
      if (error?.response?.status !== 401) {
        logger.error("Auth", "Erro ao obter usuário.", error);
      }
      localStorage.removeItem("has_session");
      clearAccountLanguage();
      setSession(null);
      setUser(null);
    }
  }, [prefetchChatHistory]);

  const finishSession = useCallback((expired = false, broadcast = true) => {
    generation.current++;
    localStorage.removeItem("has_session");
    if (expired) sessionStorage.setItem("logibot.session.expired", "1");
    else sessionStorage.removeItem("logibot.session.expired");
    if (broadcast) localStorage.setItem("logibot.session.ended", String(Date.now()));
    void queryClient.cancelQueries();
    queryClient.clear();
    clearAccountLanguage(true);
    setSession(null);
    setUser(null);
    navigate(expired ? "/signin?expired=1" : "/signin", { replace: true });
  }, [queryClient, navigate]);

  const expireSession = useCallback(() => finishSession(true), [finishSession]);
  const logout = useCallback(async () => {
    try {
      await flushClicks();
      await api.post("/auth/logout", {}, { withCredentials: true });
    } catch (error) { logger.error("Auth", "Erro ao fazer logout.", error); }
    finally { finishSession(); }
  }, [flushClicks, finishSession]);

  const lifecycle = useServerSession(session, setSession, expireSession);
  useEffect(() => {
    const unauthorized = () => { if (localStorage.getItem("has_session")) expireSession(); };
    const endedElsewhere = (event: StorageEvent) => {
      if (event.key === "logibot.session.ended" && user) finishSession(true, false);
      if (event.key === "logibot.session.started" && user) window.location.reload();
    };
    window.addEventListener("logibot:unauthorized", unauthorized);
    window.addEventListener("storage", endedElsewhere);
    return () => {
      window.removeEventListener("logibot:unauthorized", unauthorized);
      window.removeEventListener("storage", endedElsewhere);
    };
  }, [expireSession, finishSession, user]);

  useEffect(() => {
    if (localStorage.getItem("has_session")) {
      getUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [getUser]);

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
      <SessionWarning kind={lifecycle.warning} pending={lifecycle.pending} error={lifecycle.connectionError} onContinue={lifecycle.continueSession} onSignOut={logout} />
    </AuthContext.Provider>
  );
}
