
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';

export interface ReposicaoHoje {
  id: string;
  pessoa_id: string;
  pessoa_nome: string;
  pessoa_tipo: 'aluno' | 'funcionario';
  turma_original_nome: string;
  turma_original_id: string;
  data_reposicao: string;
  // Dados da pessoa para exibição
  ultima_pagina?: number | null;
  ultimo_nivel?: string | null;
  niveldesafio?: string | null;
  foto_url?: string | null;
  faltas_consecutivas?: number;
}

export function useReposicoesHoje(turmaId: string | undefined) {
  const [reposicoes, setReposicoes] = useState<ReposicaoHoje[]>([]);
  const [loading, setLoading] = useState(false);

  const buscarReposicoes = useCallback(async () => {
    if (!turmaId) return;

    setLoading(true);
    try {
      const hoje = format(new Date(), 'yyyy-MM-dd');

      // Buscar reposições do dia para essa turma
      const { data: reposicoesData, error: reposicoesError } = await supabase
        .from('reposicoes')
        .select('id, pessoa_id, pessoa_tipo, data_reposicao')
        .eq('turma_id', turmaId)
        .eq('data_reposicao', hoje);

      if (reposicoesError) {
        console.error('[Reposições Hoje] Erro ao buscar reposições:', reposicoesError);
        return;
      }

      if (!reposicoesData || reposicoesData.length === 0) {
        setReposicoes([]);
        return;
      }

      // Separar por tipo
      const alunoIds = reposicoesData
        .filter(r => r.pessoa_tipo === 'aluno' || !r.pessoa_tipo)
        .map(r => r.pessoa_id);
      
      const funcionarioIds = reposicoesData
        .filter(r => r.pessoa_tipo === 'funcionario')
        .map(r => r.pessoa_id);

      const resultados: ReposicaoHoje[] = [];

      // Buscar dados dos alunos
      if (alunoIds.length > 0) {
        const { data: alunos, error: alunosError } = await supabase
          .from('alunos')
          .select('id, nome, turma_id, ultima_pagina, ultimo_nivel, niveldesafio, foto_url, faltas_consecutivas')
          .in('id', alunoIds);

        if (alunosError) {
          console.error('[Reposições Hoje] Erro ao buscar alunos:', alunosError);
        } else if (alunos && alunos.length > 0) {
          // Buscar nomes das turmas originais
          const turmaIds = [...new Set(alunos.map(a => a.turma_id).filter(Boolean))];
          
          let turmasMap: Record<string, string> = {};
          if (turmaIds.length > 0) {
            const { data: turmas } = await supabase
              .from('turmas')
              .select('id, nome')
              .in('id', turmaIds);
            
            if (turmas) {
              turmasMap = turmas.reduce((acc, t) => {
                acc[t.id] = t.nome;
                return acc;
              }, {} as Record<string, string>);
            }
          }

          for (const aluno of alunos) {
            const reposicao = reposicoesData.find(r => r.pessoa_id === aluno.id);
            if (reposicao) {
              resultados.push({
                id: reposicao.id,
                pessoa_id: aluno.id,
                pessoa_nome: aluno.nome,
                pessoa_tipo: 'aluno',
                turma_original_id: aluno.turma_id || '',
                turma_original_nome: aluno.turma_id ? turmasMap[aluno.turma_id] || 'Turma não encontrada' : 'Sem turma',
                data_reposicao: reposicao.data_reposicao,
                ultima_pagina: aluno.ultima_pagina,
                ultimo_nivel: aluno.ultimo_nivel,
                niveldesafio: aluno.niveldesafio,
                foto_url: aluno.foto_url,
                faltas_consecutivas: aluno.faltas_consecutivas
              });
            }
          }
        }
      }

      // Buscar dados dos funcionários
      if (funcionarioIds.length > 0) {
        const { data: funcionarios, error: funcionariosError } = await supabase
          .from('funcionarios')
          .select('id, nome, turma_id, ultima_pagina, ultimo_nivel, niveldesafio, foto_url')
          .in('id', funcionarioIds);

        if (funcionariosError) {
          console.error('[Reposições Hoje] Erro ao buscar funcionários:', funcionariosError);
        } else if (funcionarios && funcionarios.length > 0) {
          // Buscar nomes das turmas originais
          const turmaIds = [...new Set(funcionarios.map(f => f.turma_id).filter(Boolean))];
          
          let turmasMap: Record<string, string> = {};
          if (turmaIds.length > 0) {
            const { data: turmas } = await supabase
              .from('turmas')
              .select('id, nome')
              .in('id', turmaIds);
            
            if (turmas) {
              turmasMap = turmas.reduce((acc, t) => {
                acc[t.id] = t.nome;
                return acc;
              }, {} as Record<string, string>);
            }
          }

          for (const func of funcionarios) {
            const reposicao = reposicoesData.find(r => r.pessoa_id === func.id);
            if (reposicao) {
              resultados.push({
                id: reposicao.id,
                pessoa_id: func.id,
                pessoa_nome: func.nome,
                pessoa_tipo: 'funcionario',
                turma_original_id: func.turma_id || '',
                turma_original_nome: func.turma_id ? turmasMap[func.turma_id] || 'Turma não encontrada' : 'Sem turma',
                data_reposicao: reposicao.data_reposicao,
                ultima_pagina: func.ultima_pagina,
                ultimo_nivel: func.ultimo_nivel,
                niveldesafio: func.niveldesafio,
                foto_url: func.foto_url,
                faltas_consecutivas: 0
              });
            }
          }
        }
      }

      setReposicoes(resultados);
    } catch (error) {
      console.error('[Reposições Hoje] Erro:', error);
    } finally {
      setLoading(false);
    }
  }, [turmaId]);

  useEffect(() => {
    buscarReposicoes();
  }, [buscarReposicoes]);

  return {
    reposicoes,
    loading,
    refetch: buscarReposicoes
  };
}
