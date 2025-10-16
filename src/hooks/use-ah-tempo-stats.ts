import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AHTempoStats {
  tempo_medio_coleta_correcao: number | null;
  tempo_medio_coleta_entrega: number | null;
  tempo_medio_correcao_entrega: number | null;
  tempo_medio_inicio_fim_correcao: number | null;
  total_apostilas_corrigidas: number;
  total_apostilas_entregues: number;
}

export const useAHTempoStats = () => {
  return useQuery({
    queryKey: ['ah-tempo-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_ah_tempo_stats');

      if (error) {
        console.error('Erro ao buscar estatísticas de tempo AH:', error);
        throw error;
      }

      // A função retorna um array com um único objeto
      return data && data.length > 0 ? data[0] as AHTempoStats : null;
    },
  });
};
