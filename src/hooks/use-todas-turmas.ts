
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
        
        // Buscar turmas que têm pelo menos um aluno ativo
        const { data: turmasData, error } = await supabase
          .from('turmas')
          .select(`
            *,
            alunos!inner(id, active)
          `)
          .eq('alunos.active', true)
          .order('nome');

        if (error) {
          console.error('Erro ao buscar turmas:', error);
          setError(error.message);
          return;
        }

        console.log('Turmas com alunos encontradas:', turmasData);
        
        // Remover duplicatas e garantir que cada turma tenha o campo sala
        const turmasUnicas = turmasData?.reduce((acc, turma) => {
          const turmaExistente = acc.find(t => t.id === turma.id);
          if (!turmaExistente) {
            acc.push({
              ...turma,
              sala: turma.sala || null
            });
          }
          return acc;
        }, [] as Turma[]) || [];
        
        setTurmas(turmasUnicas);
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
