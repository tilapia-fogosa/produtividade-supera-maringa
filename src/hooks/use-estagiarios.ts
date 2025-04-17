
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Estagiario {
  id: string;
  nome: string;
  active: boolean;
  unit_id: string;
  created_at: string;
}

export const useEstagiarios = (unitId?: string) => {
  const [estagiarios, setEstagiarios] = useState<Estagiario[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEstagiarios = async () => {
      try {
        setIsLoading(true);
        
        let query = supabase
          .from('estagiarios')
          .select('*')
          .eq('active', true);
          
        // Se unitId estiver definido, filtrar por unidade
        if (unitId) {
          query = query.eq('unit_id', unitId);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        setEstagiarios(data as Estagiario[]);
      } catch (err: any) {
        console.error('Erro ao buscar estagiários:', err);
        setError(err.message || 'Erro ao carregar estagiários');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEstagiarios();
  }, [unitId]);

  return {
    estagiarios,
    isLoading,
    error
  };
};
