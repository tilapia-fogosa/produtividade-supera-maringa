
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
        
        // Buscar professores
        const { data: professores, error: profError } = await supabase
          .from('professores')
          .select('*')
          .eq('active', true);
          
        if (profError) throw profError;
        
        // Buscar estagiários
        const { data: estagiarios, error: estError } = await supabase
          .from('estagiarios')
          .select('*')
          .eq('active', true);
          
        if (estError) throw estError;
        
        // Mapear professores para o formato de Corretor
        const professoresFormatados: Corretor[] = (professores || []).map(prof => ({
          id: prof.id,
          nome: prof.nome,
          tipo: 'professor' as const
        }));
        
        // Mapear estagiários para o formato de Corretor
        const estagiariosFormatados: Corretor[] = (estagiarios || []).map(est => ({
          id: est.id,
          nome: est.nome,
          tipo: 'estagiario' as const
        }));
        
        // Combinar as listas e ordenar por nome
        const todosCorretores = [...professoresFormatados, ...estagiariosFormatados]
          .sort((a, b) => a.nome.localeCompare(b.nome));
          
        setCorretores(todosCorretores);
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
