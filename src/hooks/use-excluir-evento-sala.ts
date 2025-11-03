import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useExcluirEventoSala = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventoId: string) => {
      console.log('🗑️ Excluindo evento de sala:', eventoId);
      
      // Excluir o evento de sala (cascade vai excluir eventos de professor relacionados via FK)
      const { error } = await supabase
        .from("eventos_sala")
        .delete()
        .eq("id", eventoId);

      if (error) {
        console.error('❌ Erro ao excluir evento:', error);
        throw error;
      }

      console.log('✅ Evento excluído com sucesso');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bloqueios-sala"] });
      queryClient.invalidateQueries({ queryKey: ["bloqueios-professor"] });
      queryClient.invalidateQueries({ queryKey: ["calendario-turmas"] });
      queryClient.invalidateQueries({ queryKey: ["calendario-eventos-unificados"] });
    },
  });
};
