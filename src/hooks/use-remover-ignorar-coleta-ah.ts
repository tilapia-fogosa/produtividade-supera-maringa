import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useRemoverIgnorarColetaAH = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registroId: string) => {
      // Desativar o registro de ignorar coleta
      const { error } = await supabase
        .from("ah_ignorar_coleta")
        .update({ active: false })
        .eq("id", registroId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proximas-coletas-ah"] });
      queryClient.invalidateQueries({ queryKey: ["alunos-ignorados-ah"] });
      toast({
        title: "Sucesso",
        description: "Aluno voltará a aparecer na lista de próximas coletas"
      });
    },
    onError: (error: Error) => {
      console.error("Erro ao remover ignorar coleta:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover. Tente novamente.",
        variant: "destructive"
      });
    }
  });
};
