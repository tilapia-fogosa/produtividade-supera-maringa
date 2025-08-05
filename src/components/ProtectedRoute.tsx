import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { hasPageAccess, loading: permissionsLoading } = useUserPermissions();
  const location = useLocation();

  // Mostrar loading enquanto verifica autenticação e permissões
  if (authLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Se não está logado, redireciona para login
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Se não tem permissão para a página, redireciona para acesso negado
  if (!hasPageAccess(location.pathname)) {
    return <Navigate to="/access-denied" replace />;
  }

  // Se passou em todas as verificações, renderiza o conteúdo
  return <>{children}</>;
};