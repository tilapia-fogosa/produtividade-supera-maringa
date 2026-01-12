
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Turma } from '@/hooks/use-professor-turmas';

export function useSalaTurmasPorDia(diaParam?: string | null) {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const dia = diaParam || location.state?.dia;

  useEffect(() => {
    const fetchTurmas = async () => {
      try {
        setLoading(true);
        console.log('[Sala] Buscando turmas para o dia:', dia);
        
        if (!dia) {
          console.error('[Sala] Dia não especificado');
          setTurmas([]);
          setLoading(false);
          return;
        }
        
        const { data: turmasData, error } = await supabase
          .from('turmas')
          .select('*')
          .eq('dia_semana', dia)
          .order('nome', { ascending: true });

        if (error) {
          console.error('[Sala] Erro ao buscar turmas:', error);
          return;
        }

        console.log('[Sala] Turmas encontradas:', turmasData);
        
        const turmasComSala = turmasData?.map(turma => ({
          ...turma,
          sala: turma.sala || ''
        })) || [];
        
        setTurmas(turmasComSala);
      } catch (error) {
        console.error('[Sala] Erro ao buscar turmas:', error);
      } finally {
        setLoading(false);
      }
    };

    if (dia) {
      fetchTurmas();
    } else {
      setTurmas([]);
      setLoading(false);
    }
  }, [dia]);

  return {
    turmas,
    loading,
    dia
  };
}
