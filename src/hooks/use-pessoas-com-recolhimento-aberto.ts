import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePessoasComRecolhimentoAberto = () => {
  return useQuery({
    queryKey: ["pessoas-com-recolhimento-aberto"],
    queryFn: async () => {
      // Buscar todos os recolhimentos
      const { data: recolhidas, error: errorRecolhidas } = await supabase
        .from("ah_recolhidas")
        .select("id, pessoa_id");

      if (errorRecolhidas) throw errorRecolhidas;

      console.log("Recolhimentos encontrados:", recolhidas);

      // Buscar todas as correções
      const { data: correcoes, error: errorCorrecoes } = await supabase
        .from("produtividade_ah")
        .select("apostila_recolhida_id");

      if (errorCorrecoes) throw errorCorrecoes;

      console.log("Correções encontradas:", correcoes);

      // Criar Set com IDs dos recolhimentos que têm correções
      const recolhimentosComCorrecao = new Set(
        (correcoes || []).map((c: any) => c.apostila_recolhida_id).filter(Boolean)
      );

      console.log("IDs de recolhimentos COM correção:", Array.from(recolhimentosComCorrecao));

      // Filtrar pessoas cujos recolhimentos não têm correções
      const pessoasComRecolhimentoAberto = new Set<string>();

      (recolhidas || []).forEach((recolhida: any) => {
        // Se este recolhimento não tem correções
        if (!recolhimentosComCorrecao.has(recolhida.id)) {
          console.log(`Recolhimento ${recolhida.id} da pessoa ${recolhida.pessoa_id} NÃO tem correção`);
          pessoasComRecolhimentoAberto.add(recolhida.pessoa_id);
        }
      });

      console.log("Pessoas com recolhimento aberto (IDs):", Array.from(pessoasComRecolhimentoAberto));

      return Array.from(pessoasComRecolhimentoAberto);
    },
  });
};
