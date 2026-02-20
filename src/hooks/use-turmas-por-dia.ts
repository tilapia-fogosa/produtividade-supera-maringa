
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Turma } from './use-professor-turmas';
import { useActiveUnit } from '@/contexts/ActiveUnitContext';

export function useTurmasPorDia(diaParam?: string | null) {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const { activeUnit } = useActiveUnit();
  const dia = diaParam || location.state?.dia;
  const serviceType = location.state?.serviceType;

  useEffect(() => {
    const fetchTurmas = async () => {
      try {
        setLoading(true);
        console.log('Buscando turmas para o dia:', dia);
        
        if (!dia || !activeUnit?.id) {
          console.error('Dia ou unidade não especificado');
          setTurmas([]);
          setLoading(false);
          return;
        }
        
        const { data: turmasData, error } = await supabase
          .from('turmas')
          .select('*')
          .eq('dia_semana', dia)
          .eq('unit_id', activeUnit.id)
          .order('nome', { ascending: true });

        if (error) {
          console.error('Erro ao buscar turmas:', error);
          return;
        }

        // Buscar turma_ids que possuem alunos ativos
        const turmaIds = (turmasData || []).map(t => t.id);
        const { data: alunosAtivos } = await supabase
          .from('alunos')
          .select('turma_id')
          .in('turma_id', turmaIds)
          .eq('active', true);

        const turmasComAlunosAtivos = new Set((alunosAtivos || []).map(a => a.turma_id));

        const turmasFiltradas = (turmasData || [])
          .filter(turma => turmasComAlunosAtivos.has(turma.id))
          .map(turma => ({
            ...turma,
            sala: turma.sala || ''
          }));

        console.log('Turmas com alunos ativos:', turmasFiltradas.length);
        setTurmas(turmasFiltradas);
      } catch (error) {
        console.error('Erro ao buscar turmas:', error);
      } finally {
        setLoading(false);
      }
    };

    if (dia && activeUnit?.id) {
      fetchTurmas();
    } else {
      setTurmas([]);
      setLoading(false);
    }
  }, [dia, activeUnit?.id]);

  return {
    turmas,
    loading,
    serviceType
  };
}
