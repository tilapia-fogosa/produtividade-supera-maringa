import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Professor {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  slack_username: string | null;
  status: boolean;
  unit_id: string;
  prioridade: number | null;
}

/**
 * Hook que retorna os dados do professor vinculado ao usuário logado.
 * O vínculo é feito através do campo professor_id na tabela profiles.
 */
export function useCurrentProfessor() {
  const { profile, loading: authLoading } = useAuth();

  const { data: professor, isLoading: professorLoading } = useQuery({
    queryKey: ['current-professor', profile?.professor_id],
    queryFn: async () => {
      if (!profile?.professor_id) return null;
      
      const { data, error } = await supabase
        .from('professores')
        .select('*')
        .eq('id', profile.professor_id)
        .single();
      
      if (error) {
        console.error('Erro ao buscar professor:', error);
        return null;
      }
      
      return data as Professor;
    },
    enabled: !!profile?.professor_id,
  });

  return {
    professorId: profile?.professor_id || null,
    professor,
    isProfessor: !!profile?.professor_id,
    isLoading: authLoading || professorLoading,
  };
}
