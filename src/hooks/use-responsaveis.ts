
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Responsavel {
  id: string;
  nome: string;
  tipo: 'professor' | 'funcionario';
}

export function useResponsaveis(): { responsaveis: Responsavel[]; isLoading: boolean } {
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResponsaveis = async () => {
      try {
        setIsLoading(true);
        console.log('Buscando responsáveis usando view unificada...');
        
        // Usar a view unificada responsaveis_view que já filtra por active = true
        // e exclui cargos como 'Filha' e 'familiar'
        const { data, error } = await supabase
          .from('responsaveis_view')
          .select('*');

        if (error) throw error;

        // Mapear os dados para o formato esperado
        const responsaveisFormatados = data?.map(resp => ({
          id: resp.id,
          nome: resp.nome,
          tipo: resp.tipo as 'professor' | 'funcionario'
        })) || [];

        console.log('Responsáveis carregados da view:', {
          total: responsaveisFormatados.length,
          porTipo: responsaveisFormatados.reduce((acc, r) => {
            acc[r.tipo] = (acc[r.tipo] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        });

        // Ordenar por nome
        const responsaveisOrdenados = responsaveisFormatados
          .sort((a, b) => a.nome.localeCompare(b.nome));

        setResponsaveis(responsaveisOrdenados);
      } catch (error) {
        console.error('Erro ao buscar responsáveis:', error);
        setResponsaveis([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResponsaveis();
  }, []);

  return {
    responsaveis,
    isLoading
  };
}
