import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function Start() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/signin" replace />;

  const roles = Array.isArray(user.role) ? user.role : [user.role];
  const isStudent = !roles.includes("admin") && !roles.includes("course-coordinator") && !roles.includes("professor") && !roles.includes("teacher");

  return <Navigate to={isStudent ? "/chat" : "/dashboard"} replace />;
}
