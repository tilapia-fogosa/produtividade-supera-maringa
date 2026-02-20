import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook que retorna os dados do usuário logado.
 * Usa diretamente o AuthContext sem dependência de vínculo com funcionário.
 */
export function useCurrentUser() {
  const { user, profile, loading } = useAuth();

  return {
    userId: user?.id || null,
    userName: profile?.full_name || user?.email || null,
    userEmail: profile?.email || user?.email || null,
    isLoading: loading,
    isAuthenticated: !!user,
  };
}
