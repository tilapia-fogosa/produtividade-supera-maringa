import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PessoaReposicao {
  id: string;
  nome: string;
  active: boolean;
  turma_id: string;
  tipo: 'aluno' | 'funcionario';
}

export const usePessoasReposicao = (turmaIdExcluir: string | null) => {
  return useQuery({
    queryKey: ["pessoas-reposicao", turmaIdExcluir],
    queryFn: async () => {
      if (!turmaIdExcluir) return [];
      
      // Buscar alunos
      const { data: alunos, error: alunosError } = await supabase
        .from('alunos')
        .select('id, nome, active, turma_id')
        .eq('active', true)
        .order('nome');

      if (alunosError) {
        console.error("Erro ao buscar alunos para reposição:", alunosError);
        throw alunosError;
      }

      // Buscar funcionários
      const { data: funcionarios, error: funcionariosError } = await supabase
        .from('funcionarios')
        .select('id, nome, active, turma_id')
        .eq('active', true)
        .order('nome');

      if (funcionariosError) {
        console.error("Erro ao buscar funcionários para reposição:", funcionariosError);
        throw funcionariosError;
      }

      // Filtrar para excluir da turma selecionada e adicionar tipo
      const alunosReposicao = (alunos || [])
        .filter(aluno => aluno.turma_id !== turmaIdExcluir)
        .map(aluno => ({ ...aluno, tipo: 'aluno' as const }));
      
      const funcionariosReposicao = (funcionarios || [])
        .filter(funcionario => funcionario.turma_id !== turmaIdExcluir)
        .map(funcionario => ({ ...funcionario, tipo: 'funcionario' as const }));
      
      // Combinar e ordenar por nome
      const todasPessoas = [...alunosReposicao, ...funcionariosReposicao]
        .sort((a, b) => a.nome.localeCompare(b.nome));
      
      return todasPessoas as PessoaReposicao[];
    },
    enabled: !!turmaIdExcluir,
  });
};

// Manter compatibilidade com o nome antigo
export const useAlunosReposicao = usePessoasReposicao;