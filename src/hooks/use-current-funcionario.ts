import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CurrentFuncionario {
  id: string;
  nome: string;
  email: string | null;
  cargo: string | null;
  turma_id: string | null;
  active: boolean;
}

/**
 * Hook que retorna os dados do funcionário vinculado ao usuário logado.
 * Busca o funcionario_id do profile do usuário e retorna os dados completos do funcionário.
 */
export function useCurrentFuncionario() {
  const { user, profile, loading: authLoading } = useAuth();

  const { data: funcionario, isLoading, error, refetch } = useQuery({
    queryKey: ['current-funcionario', user?.id],
    queryFn: async (): Promise<CurrentFuncionario | null> => {
      if (!user?.id) return null;

      // Primeiro buscar o funcionario_id do profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('funcionario_id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Erro ao buscar profile:', profileError);
        return null;
      }

      if (!profileData?.funcionario_id) {
        return null;
      }

      // Buscar dados do funcionário
      const { data: funcionarioData, error: funcionarioError } = await supabase
        .from('funcionarios')
        .select('id, nome, email, cargo, turma_id, active')
        .eq('id', profileData.funcionario_id)
        .single();

      if (funcionarioError) {
        console.error('Erro ao buscar funcionário:', funcionarioError);
        return null;
      }

      return funcionarioData;
    },
    enabled: !!user?.id && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  return {
    funcionario,
    funcionarioId: funcionario?.id || null,
    funcionarioNome: funcionario?.nome || null,
    isLoading: authLoading || isLoading,
    isFuncionario: !!funcionario,
    error,
    refetch,
  };
}
