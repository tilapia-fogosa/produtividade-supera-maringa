import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface FaltaAntecipadaData {
  aluno_id: string;
  turma_id: string;
  data_falta: string;
  responsavel_aviso_id: string;
  responsavel_aviso_tipo: 'professor' | 'funcionario';
  responsavel_aviso_nome: string;
  observacoes?: string;
  unit_id: string;
  created_by?: string;
}

export const useFaltasAntecipadas = () => {
  const queryClient = useQueryClient();

  const criarFaltaAntecipada = useMutation({
    mutationFn: async (data: FaltaAntecipadaData) => {
      const { error } = await supabase
        .from('faltas_antecipadas')
        .insert([data]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turma-modal'] });
      queryClient.invalidateQueries({ queryKey: ['calendario-turmas'] });
      toast({
        title: "Sucesso",
        description: "Falta antecipada registrada com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Erro ao criar falta antecipada:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar falta antecipada. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    criarFaltaAntecipada,
  };
};