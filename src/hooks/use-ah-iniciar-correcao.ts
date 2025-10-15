import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface IniciarCorrecaoData {
  apostilaRecolhidaId: string;
  responsavelId: string;
  responsavelNome: string;
  responsavelTipo: 'Professor' | 'Estagiário';
  dataInicio: string;
}

export const useAhIniciarCorrecao = () => {
  const queryClient = useQueryClient();

  const iniciarCorrecao = useMutation({
    mutationFn: async (data: IniciarCorrecaoData) => {
      console.log("Iniciando correção:", data);

      const { error } = await supabase
        .from("ah_recolhidas")
        .update({
          correcao_iniciada: true,
          responsavel_correcao_id: data.responsavelId,
          responsavel_correcao_nome: data.responsavelNome,
          responsavel_correcao_tipo: data.responsavelTipo,
          data_inicio_correcao: data.dataInicio,
        })
        .eq("id", parseInt(data.apostilaRecolhidaId));

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apostilas-recolhidas"] });
    },
    onError: (error: Error) => {
      console.error("Erro ao iniciar correção:", error);
    },
  });

  return {
    iniciarCorrecao,
    isLoading: iniciarCorrecao.isPending,
  };
};
