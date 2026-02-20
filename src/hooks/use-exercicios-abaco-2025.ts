import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useExerciciosAbaco2025 = (pessoaId: string | undefined) => {
  return useQuery({
    queryKey: ['exercicios-abaco-2025', pessoaId],
    queryFn: async () => {
      if (!pessoaId) return 0;

      const { data, error } = await supabase
        .from('produtividade_abaco')
        .select('exercicios')
        .eq('pessoa_id', pessoaId)
        .gte('data_aula', '2025-01-01')
        .lte('data_aula', '2025-12-31');

      if (error) throw error;
      
      // Somar todos os exercícios
      const total = data?.reduce((acc, item) => acc + (item.exercicios || 0), 0) || 0;
      return total;
    },
    enabled: !!pessoaId,
  });
};
