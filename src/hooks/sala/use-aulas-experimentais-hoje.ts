import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';

export interface AulaExperimentalHoje {
  id: string;
  cliente_nome: string;
  descricao_cliente?: string | null;
}

export function useAulasExperimentaisHoje(turmaId: string | undefined, data?: Date) {
  const [aulasExperimentais, setAulasExperimentais] = useState<AulaExperimentalHoje[]>([]);
  const [loading, setLoading] = useState(false);

  const buscar = useCallback(async () => {
    if (!turmaId) return;

    setLoading(true);
    try {
      const dataConsulta = data ? format(data, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

      const { data: aulas, error } = await supabase
        .from('aulas_experimentais')
        .select('id, cliente_nome, descricao_cliente')
        .eq('turma_id', turmaId)
        .eq('data_aula_experimental', dataConsulta)
        .eq('active', true);

      if (error) {
        console.error('[Aulas Experimentais Hoje] Erro:', error);
        return;
      }

      setAulasExperimentais(aulas || []);
    } catch (error) {
      console.error('[Aulas Experimentais Hoje] Erro:', error);
    } finally {
      setLoading(false);
    }
  }, [turmaId, data]);

  useEffect(() => {
    buscar();
  }, [buscar]);

  return { aulasExperimentais, loading, refetch: buscar };
}
