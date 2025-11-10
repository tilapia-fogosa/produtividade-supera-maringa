import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDesafios2025 = (pessoaId: string | undefined) => {
  return useQuery({
    queryKey: ['desafios-2025', pessoaId],
    queryFn: async () => {
      if (!pessoaId) return 0;

      const { data, error, count } = await supabase
        .from('produtividade_abaco')
        .select('*', { count: 'exact', head: false })
        .eq('pessoa_id', pessoaId)
        .eq('fez_desafio', true)
        .gte('data_aula', '2025-01-01')
        .lte('data_aula', '2025-12-31');

      if (error) throw error;
      
      return count || 0;
    },
    enabled: !!pessoaId,
  });
};
