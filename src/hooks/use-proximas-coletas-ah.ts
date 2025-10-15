import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProximaColetaAH {
  id: string;
  nome: string;
  turma_nome: string | null;
  ultima_correcao_ah: string | null;
  dias_desde_ultima_correcao: number | null;
  origem: 'aluno' | 'funcionario';
}

export const useProximasColetasAH = () => {
  return useQuery({
    queryKey: ['proximas-coletas-ah'],
    queryFn: async () => {
      // Buscar alunos e funcionários ativos com suas turmas
      const { data: alunos, error: errorAlunos } = await supabase
        .from('alunos')
        .select(`
          id,
          nome,
          ultima_correcao_ah,
          turma_id,
          turmas (
            nome
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
            nome
          )
        `)
        .eq('active', true)
        .order('ultima_correcao_ah', { ascending: true, nullsFirst: false });

      if (errorFuncionarios) throw errorFuncionarios;

      // Combinar e formatar os dados
      const todasPessoas: ProximaColetaAH[] = [
        ...(alunos || []).map((aluno: any) => ({
          id: aluno.id,
          nome: aluno.nome,
          turma_nome: aluno.turmas?.nome || null,
          ultima_correcao_ah: aluno.ultima_correcao_ah,
          dias_desde_ultima_correcao: aluno.ultima_correcao_ah 
            ? Math.floor((Date.now() - new Date(aluno.ultima_correcao_ah).getTime()) / (1000 * 60 * 60 * 24))
            : null,
          origem: 'aluno' as const
        })),
        ...(funcionarios || []).map((func: any) => ({
          id: func.id,
          nome: func.nome,
          turma_nome: func.turmas?.nome || null,
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

      // Retornar apenas os 30 primeiros
      return ordenadas.slice(0, 30);
    },
  });
};
