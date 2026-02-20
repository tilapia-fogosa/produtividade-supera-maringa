
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Turma } from './use-professor-turmas';

const PROFESSOR_GUSTAVO_ID = '4cda6590-6e4d-4359-a88f-f5e0ce59c5f4';

export function useProjetoSaoRafael() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTurmasProjetoSaoRafael = async () => {
      try {
        setLoading(true);
        console.log('Buscando turmas do Projeto São Rafael para o professor Gustavo');
        
        const { data: turmasData, error } = await supabase
          .from('turmas')
          .select('*')
          .eq('professor_id', PROFESSOR_GUSTAVO_ID)
          .eq('dia_semana', 'quinta')
          .order('nome', { ascending: true });

        if (error) {
          console.error('Erro ao buscar turmas do Projeto São Rafael:', error);
          return;
        }

        console.log('Turmas do Projeto São Rafael encontradas:', turmasData);
        
        const turmasCompletas = turmasData?.map(turma => ({
          ...turma,
          sala: turma.sala || ''
        })) || [];
        
        setTurmas(turmasCompletas);
      } catch (error) {
        console.error('Erro ao buscar turmas do Projeto São Rafael:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTurmasProjetoSaoRafael();
  }, []);

  return {
    turmas,
    loading
  };
}
