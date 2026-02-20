import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EntregaAHData {
  apostilaRecolhidaId: string;
  dataEntrega: string;
  funcionarioRegistroId: string;
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

      if (!data.funcionarioRegistroId) {
        throw new Error("Funcionário não vinculado");
      }

      // Atualizar a apostila recolhida com dados de entrega
      const { error } = await supabase
        .from("ah_recolhidas")
        .update({
          data_entrega_real: data.dataEntrega,
          responsavel_entrega_id: data.funcionarioRegistroId,
          funcionario_registro_id: data.funcionarioRegistroId,
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

  const ignorarEntregaAH = useMutation({
    mutationFn: async ({ apostilaRecolhidaId, dias }: { apostilaRecolhidaId: string | number; dias: number }) => {
      const ignorado_ate = new Date();
      ignorado_ate.setDate(ignorado_ate.getDate() + dias);

      const { error } = await supabase
        .from("ah_recolhidas")
        .update({
          ignorado_ate: ignorado_ate.toISOString(),
        } as any)
        .eq("id", typeof apostilaRecolhidaId === 'string' ? parseInt(apostilaRecolhidaId) : apostilaRecolhidaId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      toast.success("Entrega ocultada temporariamente!");
      queryClient.invalidateQueries({ queryKey: ["apostilas-recolhidas"] });
    },
    onError: (error: Error) => {
      console.error("Erro ao ignorar entrega AH:", error);
      toast.error(`Erro ao ocultar entrega: ${error.message}`);
    },
  });

  return {
    registrarEntregaAH,
    ignorarEntregaAH: ignorarEntregaAH.mutateAsync,
    isLoading: registrarEntregaAH.isPending,
  };
};