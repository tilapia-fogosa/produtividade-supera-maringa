
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from 'react-router-dom';
import { Turma } from './use-professor-turmas';

export interface AlunoDevolutiva {
  id: string;
  nome: string;
  texto_devolutiva: string | null;
  tipo: 'aluno';
}

export interface FuncionarioDevolutiva {
  id: string;
  nome: string;
  texto_devolutiva: string | null;
  tipo: 'funcionario';
}

export type PessoaDevolutiva = AlunoDevolutiva | FuncionarioDevolutiva;

export function useDevolutivas(diaParam?: string | null) {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const dia = diaParam || location.state?.dia;
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
        
        // Modificado para fazer somente a busca de turmas inicialmente
        const { data: turmasData, error } = await supabase
          .from('turmas')
          .select('*')
          .eq('dia_semana', dia);

        if (error) {
          console.error('Erro ao buscar turmas:', error);
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
