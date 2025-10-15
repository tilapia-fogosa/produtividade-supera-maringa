import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProximaColetaAH {
  id: string;
  nome: string;
  turma_id: string | null;
  turma_nome: string | null;
  professor_id: string | null;
  professor_nome: string | null;
  ultima_correcao_ah: string | null;
  dias_desde_ultima_correcao: number | null;
  origem: 'aluno' | 'funcionario';
}

export const useProximasColetasAH = () => {
  return useQuery({
    queryKey: ['proximas-coletas-ah'],
    queryFn: async () => {
      const dataAtual = new Date().toISOString();
      
      // Buscar alunos ativos com suas turmas
      const { data: alunos, error: errorAlunos } = await supabase
        .from('alunos')
        .select(`
          id,
          nome,
          ultima_correcao_ah,
          turma_id,
          turmas (
            nome,
            professor_id,
            projeto,
            professores (
              nome
            )
          )
        `)
        .eq('active', true)
        .order('ultima_correcao_ah', { ascending: true, nullsFirst: false });

      if (errorAlunos) throw errorAlunos;

      const { data: funcionarios, error: errorFuncionarios } = await supabase
        .from('funcionarios')
        .select(`
          id,
          nome,
          ultima_correcao_ah,
          turma_id,
          turmas (
            nome,
            professor_id,
            projeto,
            professores (
              nome
            )
          )
        `)
        .eq('active', true)
        .order('ultima_correcao_ah', { ascending: true, nullsFirst: false });

      if (errorFuncionarios) throw errorFuncionarios;

      // Buscar registros ativos de ignorar coleta que ainda não expiraram
      const { data: ignorarColetas, error: errorIgnorar } = await supabase
        .from('ah_ignorar_coleta')
        .select('pessoa_id, data_fim')
        .eq('active', true)
        .gte('data_fim', dataAtual);

      if (errorIgnorar) throw errorIgnorar;

      // Criar um Set com os IDs das pessoas que devem ser ignoradas
      const pessoasIgnoradas = new Set(
        (ignorarColetas || []).map(registro => registro.pessoa_id)
      );

      // Combinar e formatar os dados, filtrando turmas com projeto = true
      // e pessoas que estão sendo ignoradas
      const todasPessoas: ProximaColetaAH[] = [
        ...(alunos || [])
          .filter(aluno => 
            !aluno.turmas?.projeto && // Exclui turmas com projeto = true
            !pessoasIgnoradas.has(aluno.id) // Exclui alunos ignorados
          )
          .map((aluno: any) => ({
            id: aluno.id,
            nome: aluno.nome,
            turma_id: aluno.turma_id,
            turma_nome: aluno.turmas?.nome || null,
            professor_id: aluno.turmas?.professor_id || null,
            professor_nome: aluno.turmas?.professores?.nome || null,
            ultima_correcao_ah: aluno.ultima_correcao_ah,
            dias_desde_ultima_correcao: aluno.ultima_correcao_ah 
              ? Math.floor((Date.now() - new Date(aluno.ultima_correcao_ah).getTime()) / (1000 * 60 * 60 * 24))
              : null,
            origem: 'aluno' as const
          })),
        ...(funcionarios || [])
          .filter(func => 
            !func.turmas?.projeto && // Exclui turmas com projeto = true
            !pessoasIgnoradas.has(func.id) // Exclui funcionários ignorados
          )
          .map((func: any) => ({
            id: func.id,
            nome: func.nome,
            turma_id: func.turma_id,
            turma_nome: func.turmas?.nome || null,
            professor_id: func.turmas?.professor_id || null,
            professor_nome: func.turmas?.professores?.nome || null,
            ultima_correcao_ah: func.ultima_correcao_ah,
            dias_desde_ultima_correcao: func.ultima_correcao_ah 
              ? Math.floor((Date.now() - new Date(func.ultima_correcao_ah).getTime()) / (1000 * 60 * 60 * 24))
              : null,
            origem: 'funcionario' as const
          }))
      ];

      // Ordenar por dias desde última correção (do maior para o menor)
      // Pessoas sem correção (null) aparecem por último
      const ordenadas = todasPessoas.sort((a, b) => {
        if (a.dias_desde_ultima_correcao === null && b.dias_desde_ultima_correcao === null) return 0;
        if (a.dias_desde_ultima_correcao === null) return 1;
        if (b.dias_desde_ultima_correcao === null) return -1;
        return b.dias_desde_ultima_correcao - a.dias_desde_ultima_correcao;
      });

      // Retornar todos os resultados
      return ordenadas;
    },
  });
};
