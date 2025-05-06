
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Turma } from './use-professor-turmas';

export interface TurmaDetalhes {
  turma: Turma & { 
    created_at: string;
    professorNome: string;
    professores?: {
      nome: string;
    }
  };
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
        
        // Buscar todas as turmas com informações do professor
        const { data: turmasData, error: turmasError } = await supabase
          .from('turmas')
          .select('*, professores!turmas_professor_id_fkey(nome)')
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
            turma: {
              ...turma,
              professorNome: turma.professores?.nome || 'Professor não especificado',
              created_at: turma.created_at || new Date().toISOString()
            },
            alunos: alunosData || []
          };
        });

        const resultados = await Promise.all(detalhesPromises);
        const turmasValidas = resultados.filter((item): item is TurmaDetalhes => item !== null);
        setTurmasDetalhes(turmasValidas);
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
