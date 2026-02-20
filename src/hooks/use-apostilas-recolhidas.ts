import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

export interface ApostilaRecolhida {
  id: string;
  pessoa_nome: string;
  turma_nome: string;
  apostila: string;
  data_recolhida: string;
  data_entrega: string;
  pessoa_id: string;
  total_correcoes: number;
  exercicios_corrigidos?: number;
  erros?: number;
  data_entrega_real?: string;
  responsavel_entrega_nome?: string;
  foi_entregue: boolean;
  correcao_iniciada: boolean;
  responsavel_correcao_nome?: string;
  responsavel_correcao_tipo?: string;
  data_inicio_correcao?: string;
  professor_id?: string;
  professor_nome?: string;
  ignorado_ate?: string;
}

export const useApostilasRecolhidas = () => {
  const { activeUnit } = useActiveUnit();

  return useQuery({
    queryKey: ["apostilas-recolhidas", activeUnit?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_apostilas_recolhidas_por_unidade', { p_unit_id: activeUnit!.id });

      if (error) throw error;

      const mappedData = (data || []).map((row: any) => ({
        id: row.id,
        pessoa_nome: row.pessoa_nome,
        turma_nome: row.turma_nome,
        apostila: row.apostila,
        data_recolhida: row.data_recolhida,
        data_entrega: row.data_entrega,
        pessoa_id: row.pessoa_id,
        total_correcoes: Number(row.total_correcoes) || 0,
        exercicios_corrigidos: Number(row.exercicios_corrigidos) || 0,
        erros: Number(row.erros) || 0,
        data_entrega_real: row.data_entrega_real,
        responsavel_entrega_nome: row.responsavel_entrega_nome,
        foi_entregue: row.foi_entregue,
        correcao_iniciada: row.correcao_iniciada,
        responsavel_correcao_nome: row.responsavel_correcao_nome,
        responsavel_correcao_tipo: row.responsavel_correcao_tipo,
        data_inicio_correcao: row.data_inicio_correcao,
        professor_id: row.professor_id,
        professor_nome: row.professor_nome,
        ignorado_ate: row.ignorado_ate,
      })) as ApostilaRecolhida[];

      const now = new Date();
      return mappedData.filter(item => {
        if (!item.ignorado_ate) return true;
        const dataIgnorado = new Date(item.ignorado_ate);
        return dataIgnorado <= now;
      });
    },
    enabled: !!activeUnit?.id,
  });
};
