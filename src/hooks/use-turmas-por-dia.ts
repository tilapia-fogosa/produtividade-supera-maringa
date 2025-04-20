
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

// Defina o tipo Turma sem a propriedade alunos
export interface Turma {
  id: string;
  nome: string;
  dia_semana: "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado" | "domingo";
  horario: string;
  professor_id: string;
}

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
          .select('*')
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
