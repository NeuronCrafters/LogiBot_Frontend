import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to={sessionStorage.getItem("logibot.session.expired") ? "/signin?expired=1" : "/signin"} replace />;
};

export default ProtectedRoute;
