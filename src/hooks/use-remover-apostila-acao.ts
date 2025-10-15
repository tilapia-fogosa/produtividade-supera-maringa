import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RemoverAcaoParams {
  apostilaRecolhidaId: string;
  foiEntregue: boolean;
  totalCorrecoes: number;
  correcaoIniciada: boolean;
}

export const useRemoverApostilaAcao = () => {
  const queryClient = useQueryClient();

  const removerAcao = useMutation({
    mutationFn: async ({ apostilaRecolhidaId, foiEntregue, totalCorrecoes, correcaoIniciada }: RemoverAcaoParams) => {
      console.log("Removendo ação:", { apostilaRecolhidaId, foiEntregue, totalCorrecoes, correcaoIniciada });

      // Caso 1: Se tem entrega, remove a entrega
      if (foiEntregue) {
        const { error } = await supabase
          .from("ah_recolhidas")
          .update({
            data_entrega_real: null,
            responsavel_entrega_nome: null,
            responsavel_entrega_id: null,
          })
          .eq("id", parseInt(apostilaRecolhidaId));

        if (error) throw error;
        return { tipo: "entrega" };
      }

      // Caso 2: Se não tem entrega mas tem correção, remove as correções
      if (totalCorrecoes > 0) {
        const { error } = await supabase
          .from("produtividade_ah")
          .delete()
          .eq("ah_recolhida_id", parseInt(apostilaRecolhidaId));

        if (error) throw error;
        return { tipo: "correcao" };
      }

      // Caso 3: Se não tem entrega nem correção mas foi iniciada, remove o início de correção
      if (correcaoIniciada) {
        const { error } = await supabase
          .from("ah_recolhidas")
          .update({
            correcao_iniciada: false,
            responsavel_correcao_id: null,
            responsavel_correcao_nome: null,
            responsavel_correcao_tipo: null,
            data_inicio_correcao: null,
          })
          .eq("id", parseInt(apostilaRecolhidaId));

        if (error) throw error;
        return { tipo: "inicio_correcao" };
      }

      // Caso 4: Se não tem nada, remove o recolhimento
      const { error } = await supabase
        .from("ah_recolhidas")
        .delete()
        .eq("id", parseInt(apostilaRecolhidaId));

      if (error) throw error;
      return { tipo: "recolhimento" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apostilas-recolhidas"] });
    },
    onError: (error: Error) => {
      console.error("Erro ao remover ação:", error);
    },
  });

  return {
    removerAcao,
    isLoading: removerAcao.isPending,
  };
};
