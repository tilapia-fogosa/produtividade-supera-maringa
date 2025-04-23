
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Turma } from './use-turmas-por-dia';

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
        setTurmas(turmasData || []);
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
