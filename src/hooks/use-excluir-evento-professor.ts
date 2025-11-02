import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useExcluirEventoProfessor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (eventoId: string) => {
      const { error } = await supabase
        .from('eventos_professor')
        .delete()
        .eq('id', eventoId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda-professores"] });
    }
  });
};
