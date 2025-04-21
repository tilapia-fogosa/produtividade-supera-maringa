
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from 'react-router-dom';
import { Aluno, Turma } from './use-turmas-por-dia';

export function useDevolutivas() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const dia = location.state?.dia;
  const serviceType = location.state?.serviceType;

  useEffect(() => {
    const fetchTurmas = async () => {
      try {
        setLoading(true);
        console.log('Buscando turmas para devolutivas, dia:', dia);
        
        if (!dia) {
          console.error('Dia não especificado');
          setTurmas([]);
          setLoading(false);
          return;
        }
        
        const { data: turmasData, error } = await supabase
          .from('turmas')
          .select(`
            *,
            alunos (
              id,
              nome,
              texto_devolutiva
            )
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
    } else {
      setTurmas([]);
      setLoading(false);
    }
  }, [dia]);

  return {
    turmas,
    loading,
    serviceType
  };
}
