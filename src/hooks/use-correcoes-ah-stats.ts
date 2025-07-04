
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CorrecaoAHStats {
  professor_correcao: string;
  mes_atual: number;
  mes_anterior: number;
  ultimos_3_meses: number;
  ultimos_6_meses: number;
  ultimos_12_meses: number;
}

export const useCorrecoesAHStats = () => {
  return useQuery({
    queryKey: ['correcoes-ah-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_correcoes_ah_stats');

      if (error) {
        console.error('Erro ao buscar estatísticas de correções AH:', error);
        throw error;
      }

      return data as CorrecaoAHStats[];
    },
  });
};
