
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
        
        const { data: turmasData, error } = await supabase
          .from('turmas')
          .select('*')
          .order('nome, horario');

        if (error) {
          console.error('Erro ao buscar turmas:', error);
          setError(error.message);
          return;
        }

        console.log('Turmas encontradas:', turmasData);
        
        // Garantir que cada turma tenha o campo sala
        const turmasCompletas = turmasData?.map(turma => ({
          ...turma,
          sala: turma.sala || ''
        })) || [];
        
        setTurmas(turmasCompletas);
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
