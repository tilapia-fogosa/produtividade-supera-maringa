import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface IgnorarColetaParams {
  pessoaId: string;
  dias: number;
  motivo: string;
  responsavel: string;
}

export const useIgnorarColetaAH = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pessoaId, dias, motivo, responsavel }: IgnorarColetaParams) => {
      // Calcular data final (hoje + dias)
      const dataInicio = new Date();
      const dataFim = new Date();
      dataFim.setDate(dataFim.getDate() + dias);

      // Inserir novo registro na tabela ah_ignorar_coleta
      const { error } = await supabase
        .from("ah_ignorar_coleta")
        .insert({
          pessoa_id: pessoaId,
          pessoa_tipo: 'aluno', // Por enquanto só alunos
          data_inicio: dataInicio.toISOString(),
          data_fim: dataFim.toISOString(),
          dias,
          motivo,
          responsavel,
          active: true
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proximas-coletas-ah"] });
      toast({
        title: "Sucesso",
        description: "Pessoa ignorada temporariamente da lista de coletas"
      });
    },
    onError: (error: Error) => {
      console.error("Erro ao ignorar coleta:", error);
      toast({
        title: "Erro",
        description: "Não foi possível ignorar a pessoa. Tente novamente.",
        variant: "destructive"
      });
    }
  });
};
