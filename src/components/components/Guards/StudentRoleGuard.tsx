import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-Auth';
import { AccessDeniedPage } from '@/components/components/AccessDenied/AccessDeniedPage';

const StudentProtectedRoute = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [accessState, setAccessState] = useState<'loading' | 'allowed' | 'denied'>('loading');

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        setAccessState('denied');
        return;
      }

      // Verifica se o usuário tem a role de student
      const userRoles = Array.isArray(user?.role) ? user?.role : [user?.role];
      const isStudent = userRoles.includes('student');

      setAccessState(isStudent ? 'allowed' : 'denied');
    }
  }, [loading, isAuthenticated, user]);

  // Enquanto carrega, não mostra nada
  if (loading || accessState === 'loading') {
    return null;
  }

  // Se não estiver autenticado, redireciona para a página de login
  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Se estiver autenticado mas não for estudante, mostra a página de acesso negado
  if (accessState === 'denied') {
    return <AccessDeniedPage />;
  }

  // Se for estudante, renderiza o conteúdo protegido
  return <Outlet />;
};

export default StudentProtectedRoute;