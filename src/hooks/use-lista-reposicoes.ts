import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type ListaReposicaoData = {
  reposicao_id: string;
  data_reposicao: string;
  data_falta?: string;
  aluno_nome: string;
  turma_original_nome: string;
  turma_reposicao_nome: string;
  turma_reposicao_professor?: string;
  observacoes?: string;
  unit_id: string;
  aluno_id: string;
  turma_original_id: string;
  turma_reposicao_id: string;
  pessoa_tipo: 'aluno' | 'funcionario';
};

export const useListaReposicoes = (incluirAnteriores: boolean = false) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: reposicoes = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["lista-reposicoes", incluirAnteriores],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_lista_completa_reposicoes", {
        p_incluir_anteriores: incluirAnteriores
      });
      
      if (error) throw error;
      
      return data as ListaReposicaoData[];
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  const deleteMutation = useMutation({
    mutationFn: async (reposicaoId: string) => {
      const { data, error } = await supabase.rpc("delete_reposicao", {
        p_reposicao_id: reposicaoId
      });
      
      if (error) throw error;
      
      if (!data) {
        throw new Error("Falha ao excluir reposição");
      }
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Reposição excluída com sucesso!"
      });
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["lista-reposicoes"] });
      queryClient.invalidateQueries({ queryKey: ["calendario-turmas"] });
      queryClient.invalidateQueries({ queryKey: ["turma-modal-data"] });
    },
    onError: (error) => {
      console.error("Erro ao excluir reposição:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir reposição. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  return {
    reposicoes,
    isLoading,
    error,
    deletarReposicao: deleteMutation.mutate,
    isDeletingReposicao: deleteMutation.isPending,
    refetch
  };
};