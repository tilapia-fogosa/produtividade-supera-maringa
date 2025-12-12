import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { calcularDatasValidas } from "./use-reposicoes";

interface AulaExperimentalData {
  cliente_nome: string;
  turma_id: string;
  data_aula_experimental: string;
  responsavel_id: string;
  responsavel_tipo: 'professor' | 'funcionario';
  responsavel_nome: string;
  descricao_cliente?: string;
  unit_id: string;
  created_by?: string;
  funcionario_registro_id?: string;
}

export const useAulasExperimentais = () => {
  const queryClient = useQueryClient();

  const criarAulaExperimental = useMutation({
    mutationFn: async (data: AulaExperimentalData) => {
      const { data: result, error } = await supabase.functions.invoke('register-aula-experimental', {
        body: data
      });

      if (error) throw error;
      if (!result?.success) {
        throw new Error(result?.error || 'Erro ao registrar aula experimental');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aulas-experimentais'] });
      queryClient.invalidateQueries({ queryKey: ['turma-modal'] });
      queryClient.invalidateQueries({ queryKey: ['calendario-turmas'] });
      toast({
        title: "Sucesso",
        description: "Aula experimental registrada com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Erro ao criar aula experimental:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar aula experimental. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    criarAulaExperimental,
    calcularDatasValidas, // Reutiliza a função do hook de reposições
  };
};