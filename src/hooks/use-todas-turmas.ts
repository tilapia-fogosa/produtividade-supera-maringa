
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Turma } from './use-professor-turmas';

export function useTodasTurmas() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTodasTurmas = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Iniciando busca de todas as turmas...');
        
        // Primeiro, buscar todas as turmas
        const { data: turmasData, error: turmasError } = await supabase
          .from('turmas')
          .select('*')
          .order('nome');

        if (turmasError) {
          console.error('Erro ao buscar turmas:', turmasError);
          setError(turmasError.message);
          return;
        }

        console.log('Turmas encontradas (total):', turmasData?.length || 0);
        
        if (!turmasData || turmasData.length === 0) {
          console.log('Nenhuma turma encontrada');
          setTurmas([]);
          return;
        }

        // Para cada turma, verificar se tem alunos ativos
        const turmasComAlunos = [];
        
        for (const turma of turmasData) {
          const { data: alunosAtivos, error: alunosError } = await supabase
            .from('alunos')
            .select('id')
            .eq('turma_id', turma.id)
            .eq('active', true)
            .limit(1);

          if (alunosError) {
            console.error(`Erro ao verificar alunos da turma ${turma.nome}:`, alunosError);
            continue;
          }

          // Se tem pelo menos um aluno ativo, incluir a turma
          if (alunosAtivos && alunosAtivos.length > 0) {
            turmasComAlunos.push({
              ...turma,
              sala: turma.sala || null
            });
          }
        }
        
        console.log('Turmas com alunos ativos:', turmasComAlunos.length);
        setTurmas(turmasComAlunos);
        
      } catch (error) {
        console.error('Erro ao buscar turmas:', error);
        setError(error instanceof Error ? error.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchTodasTurmas();
  }, []);

  return {
    turmas,
    loading,
    error
  };
}
