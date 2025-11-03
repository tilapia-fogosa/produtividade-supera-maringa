import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAtualizarPrioridadeProfessores = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (professoresComPrioridade: { id: string; prioridade: number }[]) => {
      const updatePromises = professoresComPrioridade.map(({ id, prioridade }) =>
        supabase
          .from('professores')
          .update({ prioridade })
          .eq('id', id)
      );
      
      const results = await Promise.all(updatePromises);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) {
        throw new Error(`Erro ao atualizar prioridades: ${errors.map(e => e.error?.message).join(', ')}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professores"] });
    }
  });
};