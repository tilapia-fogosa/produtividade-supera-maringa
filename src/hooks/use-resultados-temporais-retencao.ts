import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ResultadoTemporalRetencao {
  periodo_tipo: string;
  periodo_nome: string;
  media_dias_retencao: number;
  total_casos: number;
  periodo_anterior_media_dias: number;
  periodo_anterior_total_casos: number;
  variacao_percentual_anterior: number;
  mesmo_periodo_ano_anterior_media_dias: number;
  mesmo_periodo_ano_anterior_total_casos: number;
  variacao_percentual_ano_anterior: number;
}

export const useResultadosTemporaisRetencao = () => {
  return useQuery({
    queryKey: ["resultados-temporais-retencao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_resultados_retencao_temporal");

      if (error) {
        console.error("Erro ao buscar resultados temporais de retenção:", error);
        throw error;
      }

      return data as ResultadoTemporalRetencao[];
    },
  });
};