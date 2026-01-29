import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentProfessor } from './use-current-professor';
import { getDay } from 'date-fns';

// Mapeia o dia da semana do JS para o formato do banco
const diaSemanaMap: Record<number, string> = {
  0: 'domingo',
  1: 'segunda',
  2: 'terca',
  3: 'quarta',
  4: 'quinta',
  5: 'sexta',
  6: 'sabado',
};

export interface ReposicaoProfessor {
  reposicao_id: string;
  data_reposicao: string;
  aluno_nome: string;
  turma_reposicao_nome: string;
}

export interface CamisetaPendente {
  aluno_id: string;
  aluno_nome: string;
  turma_nome: string;
  dias_supera: number;
  dia_semana: string;
}

export interface ApostilaAHPronta {
  id: number;
  pessoa_id: string;
  pessoa_nome: string;
  apostila: string;
  turma_nome: string;
  dia_semana: string;
}

export interface ApostilaAHParaCorrigir {
  id: number;
  pessoa_id: string;
  pessoa_nome: string;
  apostila: string;
  turma_nome: string;
  dia_semana: string;
}

export interface ColetaAHPendente {
  pessoa_id: string;
  pessoa_nome: string;
  turma_nome: string;
  dias_sem_correcao: number;
  dia_semana: string;
}

export interface BotomPendenteProfessor {
  pendencia_id: string;
  aluno_id: string;
  aluno_nome: string;
  apostila_nova: string;
  turma_nome: string;
  dia_semana: string;
}

export function useProfessorAtividades() {
  const { professorId, isProfessor } = useCurrentProfessor();

  const { data, isLoading } = useQuery({
    queryKey: ['professor-atividades', professorId],
    queryFn: async () => {
      if (!professorId) return null;

      // 0. Buscar pessoas ignoradas para AH
      const { data: pessoasIgnoradas } = await supabase
        .from('ah_ignorar_coleta')
        .select('pessoa_id')
        .eq('active', true)
        .gte('data_fim', new Date().toISOString());

      const idsIgnorados = new Set(pessoasIgnoradas?.map(p => p.pessoa_id) || []);

      // 1. Buscar turmas do professor
      const { data: turmas, error: turmasError } = await supabase
        .from('turmas')
        .select('id, nome, dia_semana')
        .eq('professor_id', professorId)
        .eq('active', true);

      if (turmasError) throw turmasError;

      const turmaIds = turmas?.map(t => t.id) || [];
      if (turmaIds.length === 0) {
        return {
          reposicoes: [],
          camisetasPendentes: [],
          apostilasAHProntas: [],
          apostilasAHParaCorrigir: [],
          coletasAHPendentes: [],
          botomPendentes: [],
        };
      }

      // 2. Buscar alunos dessas turmas (para camisetas e AH)
      const { data: alunos, error: alunosError } = await supabase
        .from('alunos')
        .select('id, nome, turma_id, dias_supera, ultima_correcao_ah')
        .in('turma_id', turmaIds)
        .eq('active', true);

      if (alunosError) throw alunosError;

      const alunoIds = alunos?.map(a => a.id) || [];

      // 3. Buscar reposições para as turmas do professor
      const { data: reposicoes, error: reposicoesError } = await supabase
        .rpc('get_lista_completa_reposicoes');

      if (reposicoesError) throw reposicoesError;

      const reposicoesFiltradas = (reposicoes || [])
        .filter((r: any) => turmaIds.includes(r.turma_reposicao_id))
        .map((r: any) => ({
          reposicao_id: r.reposicao_id,
          data_reposicao: r.data_reposicao,
          aluno_nome: r.aluno_nome,
          turma_reposicao_nome: r.turma_reposicao_nome,
        })) as ReposicaoProfessor[];

      // 4. Buscar camisetas pendentes (alunos com 90+ dias sem camiseta entregue)
      const alunosComDias90 = alunos?.filter(a => (a.dias_supera || 0) >= 90) || [];
      const alunosComDias90Ids = alunosComDias90.map(a => a.id);

      let camisetasPendentes: CamisetaPendente[] = [];
      if (alunosComDias90Ids.length > 0) {
        const { data: camisetas, error: camisetasError } = await supabase
          .from('camisetas')
          .select('aluno_id, camiseta_entregue')
          .in('aluno_id', alunosComDias90Ids);

        if (camisetasError) throw camisetasError;

        const camisetasMap = new Map((camisetas || []).map(c => [c.aluno_id, c.camiseta_entregue]));

        camisetasPendentes = alunosComDias90
          .filter(aluno => !camisetasMap.get(aluno.id)) // Não entregue ou não existe registro
          .map(aluno => {
            const turma = turmas?.find(t => t.id === aluno.turma_id);
            return {
              aluno_id: aluno.id,
              aluno_nome: aluno.nome,
              turma_nome: turma?.nome || 'Turma não encontrada',
              dias_supera: aluno.dias_supera || 0,
              dia_semana: turma?.dia_semana || '',
            };
          });
      }

      // 5. Buscar apostilas AH prontas para entregar (corrigidas e não entregues) e para corrigir
      let apostilasAHProntas: ApostilaAHPronta[] = [];
      let apostilasAHParaCorrigir: ApostilaAHParaCorrigir[] = [];
      if (alunoIds.length > 0) {
        const { data: ahRecolhidas, error: ahError } = await supabase
          .from('ah_recolhidas')
          .select('id, pessoa_id, apostila, data_entrega_real, correcao_iniciada')
          .in('pessoa_id', alunoIds)
          .is('data_entrega_real', null); // Não foi entregue ainda

        if (ahError) throw ahError;

        // Para cada apostila recolhida, verificar se tem correções e se a pessoa não está ignorada
        for (const ah of ahRecolhidas || []) {
          // Filtrar pessoas ignoradas
          if (idsIgnorados.has(ah.pessoa_id)) continue;

          const { data: correcoes, error: correcoesError } = await supabase
            .from('produtividade_ah')
            .select('id')
            .eq('ah_recolhida_id', ah.id)
            .limit(1);

          if (correcoesError) throw correcoesError;

          const aluno = alunos?.find(a => a.id === ah.pessoa_id);
          const turma = turmas?.find(t => t.id === aluno?.turma_id);

          if (correcoes && correcoes.length > 0) {
            // Apostila tem correções -> pronta para entregar
            apostilasAHProntas.push({
              id: ah.id,
              pessoa_id: ah.pessoa_id,
              pessoa_nome: aluno?.nome || 'Nome não encontrado',
              apostila: ah.apostila,
              turma_nome: turma?.nome || 'Turma não encontrada',
              dia_semana: turma?.dia_semana || '',
            });
          } else if (!ah.correcao_iniciada) {
            // Apostila recolhida mas sem correção iniciada -> precisa corrigir
            apostilasAHParaCorrigir.push({
              id: ah.id,
              pessoa_id: ah.pessoa_id,
              pessoa_nome: aluno?.nome || 'Nome não encontrado',
              apostila: ah.apostila,
              turma_nome: turma?.nome || 'Turma não encontrada',
              dia_semana: turma?.dia_semana || '',
            });
          }
        }
      }

      // 6. Buscar coletas AH pendentes (alunos com mais de 90 dias sem correção) - filtrando ignorados
      const coletasAHPendentes: ColetaAHPendente[] = (alunos || [])
        .filter(aluno => {
          // Filtrar pessoas ignoradas
          if (idsIgnorados.has(aluno.id)) return false;
          if (!aluno.ultima_correcao_ah) return false;
          const diasSemCorrecao = Math.floor(
            (Date.now() - new Date(aluno.ultima_correcao_ah).getTime()) / (1000 * 60 * 60 * 24)
          );
          return diasSemCorrecao >= 90;
        })
        .map(aluno => {
          const turma = turmas?.find(t => t.id === aluno.turma_id);
          const diasSemCorrecao = Math.floor(
            (Date.now() - new Date(aluno.ultima_correcao_ah!).getTime()) / (1000 * 60 * 60 * 24)
          );
          return {
            pessoa_id: aluno.id,
            pessoa_nome: aluno.nome,
            turma_nome: turma?.nome || 'Turma não encontrada',
            dias_sem_correcao: diasSemCorrecao,
            dia_semana: turma?.dia_semana || '',
          };
        })
        .sort((a, b) => b.dias_sem_correcao - a.dias_sem_correcao);

      // 7. Buscar pendências de botom do professor
      const { data: botomData, error: botomError } = await supabase
        .from('pendencias_botom')
        .select('id, aluno_id, apostila_nova')
        .eq('professor_responsavel_id', professorId)
        .eq('status', 'pendente');

      if (botomError) throw botomError;

      const botomPendentes: BotomPendenteProfessor[] = (botomData || []).map(b => {
        const aluno = alunos?.find(a => a.id === b.aluno_id);
        const turma = turmas?.find(t => t.id === aluno?.turma_id);
        return {
          pendencia_id: b.id,
          aluno_id: b.aluno_id,
          aluno_nome: aluno?.nome || 'Aluno não encontrado',
          apostila_nova: b.apostila_nova,
          turma_nome: turma?.nome || 'Turma não encontrada',
          dia_semana: turma?.dia_semana || '',
        };
      });

      return {
        reposicoes: reposicoesFiltradas,
        camisetasPendentes,
        apostilasAHProntas,
        apostilasAHParaCorrigir,
        coletasAHPendentes,
        botomPendentes,
      };
    },
    enabled: isProfessor && !!professorId,
  });

  // Função para verificar se um dia_semana corresponde ao dia atual
  const isDiaHoje = (diaSemana: string) => {
    const hoje = new Date();
    const diaHoje = diaSemanaMap[getDay(hoje)];
    return diaSemana === diaHoje;
  };

  // Função para verificar se é um dia da semana (não hoje)
  const isDiaSemana = (diaSemana: string) => {
    const hoje = new Date();
    const diaHoje = diaSemanaMap[getDay(hoje)];
    return diaSemana !== diaHoje;
  };

  return {
    isProfessor,
    isLoading,
    reposicoes: data?.reposicoes || [],
    camisetasPendentes: data?.camisetasPendentes || [],
    apostilasAHProntas: data?.apostilasAHProntas || [],
    apostilasAHParaCorrigir: data?.apostilasAHParaCorrigir || [],
    coletasAHPendentes: data?.coletasAHPendentes || [],
    botomPendentes: data?.botomPendentes || [],
    isDiaHoje,
    isDiaSemana,
  };
}
