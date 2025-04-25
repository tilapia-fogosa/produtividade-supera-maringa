
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Turma, Aluno } from './use-professor-turmas';

export function useTurmaDetalhes(turmaId?: string) {
  const [turma, setTurma] = useState<Turma | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!turmaId) {
      setLoading(false);
      return;
    }

    const fetchTurmaEAlunos = async () => {
      try {
        setLoading(true);
        
        // Buscar turma
        const { data: turmaData, error: turmaError } = await supabase
          .from('turmas')
          .select('*, professor:professores(nome)')
          .eq('id', turmaId)
          .single();

        if (turmaError) throw turmaError;
        
        // Definindo a sala como string vazia se não existir no banco de dados
        const turmaCompleta: Turma = {
          ...turmaData,
          sala: turmaData.sala || ''
        };
        
        // Buscar alunos da turma
        const { data: alunosData, error: alunosError } = await supabase
          .from('alunos')
          .select('*')
          .eq('turma_id', turmaId)
          .eq('active', true)
          .order('nome');

        if (alunosError) throw alunosError;

        setTurma(turmaCompleta);
        setAlunos(alunosData || []);
      } catch (err) {
        console.error('Erro ao carregar turma:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados da turma');
      } finally {
        setLoading(false);
      }
    };

    fetchTurmaEAlunos();
  }, [turmaId]);

  return {
    turma,
    alunos,
    loading,
    error
  };
}
