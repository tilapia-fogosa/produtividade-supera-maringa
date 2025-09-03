import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ResultadoMensalRetencao {
  aluno_id: string;
  aluno_nome: string;
  turma_nome: string;
  professor_nome: string;
  aluno_ativo: boolean;
  primeiro_alerta: string | null;
  primeira_retencao: string | null;
  dias_desde_primeiro_alerta: number | null;
  dias_desde_primeira_retencao: number | null;
  total_alertas: number;
  total_retencoes: number;
}

export const useResultadosMensaisRetencao = () => {
  return useQuery({
    queryKey: ["resultados-mensais-retencao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_resultados_mensais_retencao");

      if (error) {
        console.error("Erro ao buscar resultados mensais de retenção:", error);
        throw error;
      }

      return data as ResultadoMensalRetencao[];
    },
  });
};