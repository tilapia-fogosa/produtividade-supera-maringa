import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useDeleteRecolhimento = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recolhimentoId: string) => {
      const { error } = await supabase
        .from("ah_recolhidas")
        .delete()
        .eq("id", parseInt(recolhimentoId));

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apostilas-recolhidas"] });
      toast({
        title: "Recolhimento removido",
        description: "O recolhimento foi removido com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Erro ao remover recolhimento:", error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o recolhimento.",
        variant: "destructive",
      });
    },
  });
};
