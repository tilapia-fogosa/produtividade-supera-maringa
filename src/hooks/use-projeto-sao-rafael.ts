
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Turma } from './use-professor-turmas';

export function useProjetoSaoRafael() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTurmasProjetoSaoRafael = async () => {
      try {
        setLoading(true);
        console.log('Buscando turmas do Projeto São Rafael (is_projeto = true)');
        
        const { data: turmasData, error } = await supabase
          .from('turmas')
          .select('*')
          .eq('is_projeto', true)
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
