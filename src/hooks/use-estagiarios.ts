
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
        
        // Buscar funcionários com cargo "Estagiário" ao invés da tabela estagiarios
        let query = supabase
          .from('funcionarios')
          .select('*')
          .eq('active', true)
          .eq('cargo', 'Estagiário');
          
        // Se unitId estiver definido, filtrar por unidade
        if (unitId) {
          query = query.eq('unit_id', unitId);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Mapear os dados para o formato esperado
        const estagiariosFormatados = data?.map(func => ({
          id: func.id,
          nome: func.nome,
          active: func.active,
          unit_id: func.unit_id,
          created_at: func.created_at
        })) || [];
        
        setEstagiarios(estagiariosFormatados);
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
