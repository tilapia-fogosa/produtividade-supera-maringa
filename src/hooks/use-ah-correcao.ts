import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CorrecaoAHData {
  apostilaRecolhidaId: string;
  pessoaId: string;
  apostilaNome: string;
  exercicios: number;
  erros: number;
  professorCorrecao: string;
  dataFimCorrecao: string;
  comentario?: string;
}

export const useAhCorrecao = () => {
  const queryClient = useQueryClient();

  const registrarCorrecaoAH = useMutation({
    mutationFn: async (data: CorrecaoAHData) => {
      console.log("Registrando correção AH:", data);

      // Validações
      if (!data.exercicios || data.exercicios <= 0) {
        throw new Error("Número de exercícios deve ser maior que zero");
      }

      if (data.erros < 0) {
        throw new Error("Número de erros não pode ser negativo");
      }

      if (!data.professorCorrecao) {
        throw new Error("Selecione quem realizou a correção");
      }

      if (!data.dataFimCorrecao) {
        throw new Error("Data do fim da correção é obrigatória");
      }

      // Chamar edge function
      const { data: result, error } = await supabase.functions.invoke("register-ah", {
        body: {
          aluno_id: data.pessoaId,
          apostila: data.apostilaNome,
          exercicios: data.exercicios,
          erros: data.erros,
          professor_correcao: data.professorCorrecao,
          data_fim_correcao: data.dataFimCorrecao,
          comentario: data.comentario || null,
          ah_recolhida_id: data.apostilaRecolhidaId,
        },
      });

      if (error) {
        console.error("Erro ao registrar correção AH:", error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      toast.success("Correção de AH registrada com sucesso!");
      // Invalidar queries para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ["apostilas-recolhidas"] });
      queryClient.invalidateQueries({ queryKey: ["pessoas-com-recolhimento-aberto"] });
    },
    onError: (error: Error) => {
      console.error("Erro ao registrar correção AH:", error);
      toast.error(`Erro ao registrar correção: ${error.message}`);
    },
  });

  return {
    registrarCorrecaoAH,
    isLoading: registrarCorrecaoAH.isPending,
  };
};
