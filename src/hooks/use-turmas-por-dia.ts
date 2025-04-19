
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Turma } from './use-professor-turmas';

export function useTurmasPorDia() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const dia = location.state?.dia;
  const serviceType = location.state?.serviceType;

  useEffect(() => {
    const fetchTurmas = async () => {
      try {
        setLoading(true);
        console.log('Buscando turmas para o dia:', dia);
        
        const { data: turmasData, error } = await supabase
          .from('turmas')
          .select(`
            id,
            nome,
            dia_semana,
            horario,
            professor_id,
            alunos (*)
          `)
          .eq('dia_semana', dia);

        if (error) {
          console.error('Erro ao buscar turmas:', error);
          return;
        }

        console.log('Turmas encontradas:', turmasData);
        setTurmas(turmasData || []);
      } catch (error) {
        console.error('Erro ao buscar turmas:', error);
      } finally {
        setLoading(false);
      }
    };

    if (dia) {
      fetchTurmas();
    }
  }, [dia]);

  return {
    turmas,
    loading,
    serviceType
  };
}
