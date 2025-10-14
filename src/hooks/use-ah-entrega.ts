import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EntregaAHData {
  apostilaRecolhidaId: string;
  dataEntrega: string;
  responsavelNome: string;
}

export const useAhEntrega = () => {
  const queryClient = useQueryClient();

  const registrarEntregaAH = useMutation({
    mutationFn: async (data: EntregaAHData) => {
      console.log("Registrando entrega AH:", data);

      // Validações
      if (!data.dataEntrega) {
        throw new Error("Data de entrega é obrigatória");
      }

      if (!data.responsavelNome || data.responsavelNome.trim() === "") {
        throw new Error("Nome do responsável é obrigatório");
      }

      // Buscar o usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Atualizar a apostila recolhida com dados de entrega
      const { error } = await supabase
        .from("ah_recolhidas")
        .update({
          data_entrega_real: data.dataEntrega,
          responsavel_entrega_id: user.id,
          responsavel_entrega_nome: data.responsavelNome,
        })
        .eq("id", parseInt(data.apostilaRecolhidaId));

      if (error) {
        console.error("Erro ao registrar entrega AH:", error);
        throw error;
      }

      return { success: true };
    },
    onSuccess: () => {
      toast.success("Entrega de apostila registrada com sucesso!");
      // Invalidar queries para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ["apostilas-recolhidas"] });
    },
    onError: (error: Error) => {
      console.error("Erro ao registrar entrega AH:", error);
      toast.error(`Erro ao registrar entrega: ${error.message}`);
    },
  });

  return {
    registrarEntregaAH,
    isLoading: registrarEntregaAH.isPending,
  };
};
