import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RemoverAcaoParams {
  apostilaRecolhidaId: string;
  foiEntregue: boolean;
  totalCorrecoes: number;
}

export const useRemoverApostilaAcao = () => {
  const queryClient = useQueryClient();

  const removerAcao = useMutation({
    mutationFn: async ({ apostilaRecolhidaId, foiEntregue, totalCorrecoes }: RemoverAcaoParams) => {
      console.log("Removendo ação:", { apostilaRecolhidaId, foiEntregue, totalCorrecoes });

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

      // Caso 3: Se não tem nem entrega nem correção, remove o recolhimento
      const { error } = await supabase
        .from("ah_recolhidas")
        .delete()
        .eq("id", parseInt(apostilaRecolhidaId));

      if (error) throw error;
      return { tipo: "recolhimento" };
    },
    onSuccess: (result) => {
      const mensagens = {
        entrega: "Entrega removida com sucesso!",
        correcao: "Correção removida com sucesso!",
        recolhimento: "Recolhimento removido com sucesso!",
      };
      
      toast.success(mensagens[result.tipo]);
      queryClient.invalidateQueries({ queryKey: ["apostilas-recolhidas"] });
    },
    onError: (error: Error) => {
      console.error("Erro ao remover ação:", error);
      toast.error(`Erro ao remover: ${error.message}`);
    },
  });

  return {
    removerAcao,
    isLoading: removerAcao.isPending,
  };
};
