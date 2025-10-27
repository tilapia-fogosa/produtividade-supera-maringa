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
        console.log('Buscando responsáveis via view...');
        
        const { data, error } = await supabase
          .from('responsaveis_view')
          .select('*');

        if (error) {
          console.error('Erro ao buscar responsáveis:', error);
          throw error;
        }

        const responsaveisFormatados: Responsavel[] = (data || []).map(r => ({
          id: r.id,
          nome: r.nome,
          tipo: r.tipo as 'professor' | 'funcionario'
        }));

        console.log('Responsáveis carregados:', {
          total: responsaveisFormatados.length
        });

        setResponsaveis(responsaveisFormatados);
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