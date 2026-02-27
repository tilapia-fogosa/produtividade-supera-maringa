import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AlunoProjetoSaoRafael {
  id: string;
  nome: string;
  turma_id: string;
  turma_nome: string;
  ultima_correcao_ah: string | null;
}

export const useAlunosProjetoSaoRafael = (options?: { includeInactive?: boolean }) => {
  const [alunos, setAlunos] = useState<AlunoProjetoSaoRafael[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    const fetchAlunos = async () => {
      try {
        setLoading(true);

        let query = supabase
          .from('alunos_projeto_sao_rafael')
          .select('*')
          .order('nome', { ascending: true });

        if (!options?.includeInactive) {
          query = query.eq('active', true);
        }

        const { data: alunosData, error } = await query;

        if (error) {
          console.error('Erro ao buscar alunos do Projeto São Rafael:', error);
          return;
        }

        const alunosFormatados = alunosData?.map(aluno => ({
          id: aluno.id || '',
          nome: aluno.nome || '',
          turma_id: aluno.turma_id || '',
          turma_nome: aluno.turma_nome || 'Sem turma',
          ultima_correcao_ah: aluno.ultima_correcao_ah
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
  }, []);

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
