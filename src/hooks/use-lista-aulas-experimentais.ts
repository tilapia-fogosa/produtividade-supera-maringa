import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type AulaExperimentalLista = {
  aula_experimental_id: string;
  data_aula_experimental: string;
  cliente_nome: string;
  responsavel_nome: string;
  responsavel_tipo: string;
  descricao_cliente?: string;
  turma_nome: string;
  unit_id: string;
  turma_id: string;
  responsavel_id: string;
};

export const useListaAulasExperimentais = () => {
  const queryClient = useQueryClient();

  const { data: aulasExperimentais, isLoading, error } = useQuery({
    queryKey: ["lista-aulas-experimentais"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_lista_aulas_experimentais");
      
      if (error) throw error;
      
      return data as AulaExperimentalLista[];
    }
  });

  const deletarAulaExperimental = useMutation({
    mutationFn: async (aulaExperimentalId: string) => {
      const { data, error } = await supabase.rpc("delete_aula_experimental", {
        p_aula_experimental_id: aulaExperimentalId
      });

      if (error) throw error;
      
      if (!data) {
        throw new Error("Falha ao excluir aula experimental");
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lista-aulas-experimentais"] });
      queryClient.invalidateQueries({ queryKey: ["calendario-turmas"] });
      queryClient.invalidateQueries({ queryKey: ["turma-modal"] });
      toast({
        title: "Sucesso",
        description: "Aula experimental excluída com sucesso!",
      });
    },
    onError: (error: any) => {
      console.error('Erro ao excluir aula experimental:', error);
      const errorMessage = error.message || "Erro ao excluir aula experimental. Tente novamente.";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  return {
    aulasExperimentais: aulasExperimentais || [],
    isLoading,
    error,
    deletarAulaExperimental,
  };
};