import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProjetoSaoRafael } from './use-projeto-sao-rafael';

export interface AlunoProjetoSaoRafael {
  id: string;
  nome: string;
  turma_id: string;
  turma_nome: string;
  ultima_correcao_ah: string | null;
}

export const useAlunosProjetoSaoRafael = () => {
  const { turmas, loading: loadingTurmas } = useProjetoSaoRafael();
  const [alunos, setAlunos] = useState<AlunoProjetoSaoRafael[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    const fetchAlunos = async () => {
      if (loadingTurmas || turmas.length === 0) {
        setLoading(loadingTurmas);
        return;
      }

      try {
        setLoading(true);
        const turmasIds = turmas.map(t => t.id);
        
        console.log('Buscando alunos das turmas do Projeto São Rafael:', turmasIds);

        // Usar a função SQL get_todas_pessoas que já combina alunos e funcionários ativos
        const { data: pessoasData, error } = await supabase
          .rpc('get_todas_pessoas');

        if (error) {
          console.error('Erro ao buscar pessoas:', error);
          return;
        }

        // Filtrar apenas alunos das turmas do Projeto São Rafael
        const alunosFormatados = pessoasData
          ?.filter(pessoa => pessoa.turma_id && turmasIds.includes(pessoa.turma_id))
          .map(pessoa => ({
            id: pessoa.id,
            nome: pessoa.nome,
            turma_id: pessoa.turma_id || '',
            turma_nome: pessoa.turma_nome || 'Sem turma',
            ultima_correcao_ah: pessoa.ultima_correcao_ah
          })) || [];

        console.log('Alunos encontrados:', alunosFormatados.length);
        setAlunos(alunosFormatados);
      } catch (error) {
        console.error('Erro ao buscar alunos do Projeto São Rafael:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlunos();
  }, [turmas, loadingTurmas]);

  // Filtrar alunos por nome
  const alunosFiltrados = filtro
    ? alunos.filter(aluno => 
        aluno.nome.toLowerCase().includes(filtro.toLowerCase())
      )
    : alunos;

  return {
    alunos: alunosFiltrados,
    loading,
    filtro,
    setFiltro,
    totalFiltrados: alunosFiltrados.length
  };
};
