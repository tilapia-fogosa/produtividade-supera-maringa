import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AlunoReposicao {
  id: string;
  nome: string;
  active: boolean;
  turma_id: string;
}

export const useAlunosReposicao = (turmaIdExcluir: string | null) => {
  return useQuery({
    queryKey: ["alunos-reposicao", turmaIdExcluir],
    queryFn: async () => {
      if (!turmaIdExcluir) return [];
      
      const { data, error } = await supabase
        .from('alunos')
        .select('id, nome, active, turma_id')
        .eq('active', true)
        .order('nome');

      if (error) {
        console.error("Erro ao buscar alunos para reposição:", error);
        throw error;
      }

      // Filtrar para excluir alunos da turma selecionada
      const alunosReposicao = data.filter(aluno => aluno.turma_id !== turmaIdExcluir);
      
      return alunosReposicao as AlunoReposicao[];
    },
    enabled: !!turmaIdExcluir,
  });
};