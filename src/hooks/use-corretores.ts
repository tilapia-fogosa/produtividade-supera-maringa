
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Corretor } from '@/types/corretores';

export const useCorretores = (unitId?: string) => {
  const [corretores, setCorretores] = useState<Corretor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCorretores = async () => {
      try {
        setIsLoading(true);
        console.log('Buscando corretores usando view unificada...');
        
        // Usar a view unificada corretores_view que já filtra por active = true
        let query = supabase
          .from('corretores_view')
          .select('*');
          
        // Se unitId estiver definido, filtrar por unidade
        if (unitId) {
          query = query.eq('unit_id', unitId);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Mapear os dados para o formato esperado
        const corretoresFormatados: Corretor[] = data?.map(corretor => ({
          id: corretor.id,
          nome: corretor.nome,
          tipo: 'corretor' as const  // Always 'corretor' per interface definition
        })) || [];
        
        console.log('Corretores carregados da view:', {
          total: corretoresFormatados.length,
          porTipo: corretoresFormatados.reduce((acc, c) => {
            acc[c.tipo] = (acc[c.tipo] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        });
        
        // Ordenar por nome
        const corretoresOrdenados = corretoresFormatados
          .sort((a, b) => a.nome.localeCompare(b.nome));
        
        setCorretores(corretoresOrdenados);
      } catch (err: any) {
        console.error('Erro ao buscar corretores:', err);
        setError(err.message || 'Erro ao carregar corretores');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCorretores();
  }, [unitId]);

  return {
    corretores,
    isLoading,
    error
  };
};
