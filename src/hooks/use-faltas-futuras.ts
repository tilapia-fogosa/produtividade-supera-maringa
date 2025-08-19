import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FaltaFuturaData {
  aluno_id: string;
  turma_id: string;
  unit_id: string;
  data_falta: string;
  responsavel_aviso_id: string;
  responsavel_aviso_tipo: "professor" | "funcionario";
  responsavel_aviso_nome: string;
  observacoes?: string;
  created_by?: string;
}

export const useFaltasFuturas = () => {
  const { toast } = useToast();

  const criarFaltaFutura = useMutation({
    mutationFn: async (data: FaltaFuturaData) => {
      const { error } = await supabase
        .from('faltas_antecipadas')
        .insert([data]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Falta futura registrada com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Erro ao criar falta futura:', error);
      toast({
        variant: "destructive",
        title: "Erro!",
        description: "Erro ao registrar falta futura. Tente novamente.",
      });
    },
  });

  return {
    criarFaltaFutura,
  };
};