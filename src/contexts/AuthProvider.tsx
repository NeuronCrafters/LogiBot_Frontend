import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api/api";
import { AuthContext, AuthContextData, User } from "./AuthContext";
import { useCategoryClickTracker } from "@/hooks/use-CategoryClickTracker";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { flushClicks } = useCategoryClickTracker(user?._id || null);

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


  async function logout() {
    try {
      await flushClicks();
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

  const contextValue: AuthContextData = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    getUser,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
