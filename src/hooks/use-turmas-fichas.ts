
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Turma } from './use-professor-turmas';

export interface TurmaDetalhes {
  turma: Turma;
  alunos: {
    id: string;
    nome: string;
  }[];
}

export function useTurmasFichas() {
  const [turmasDetalhes, setTurmasDetalhes] = useState<TurmaDetalhes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const buscarTodasTurmas = async () => {
      try {
        setLoading(true);
        
        // Buscar todas as turmas
        const { data: turmasData, error: turmasError } = await supabase
          .from('turmas')
          .select('*')
          .order('nome');

        if (turmasError) {
          console.error('Erro ao buscar turmas:', turmasError);
          setError(turmasError.message);
          setLoading(false);
          return;
        }

        // Para cada turma, buscar os alunos
        const detalhesPromises = turmasData.map(async (turma) => {
          const { data: alunosData, error: alunosError } = await supabase
            .from('alunos')
            .select('id, nome')
            .eq('turma_id', turma.id)
            .eq('active', true)
            .order('nome');

          if (alunosError) {
            console.error(`Erro ao buscar alunos da turma ${turma.nome}:`, alunosError);
            return null;
          }

          return {
            turma,
            alunos: alunosData || []
          };
        });

        const resultados = await Promise.all(detalhesPromises);
        setTurmasDetalhes(resultados.filter((item): item is TurmaDetalhes => item !== null));
      } catch (error) {
        console.error('Erro ao buscar turmas e alunos:', error);
        setError(error instanceof Error ? error.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    buscarTodasTurmas();
  }, []);

  return {
    turmasDetalhes,
    loading,
    error
  };
}
