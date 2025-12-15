import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Responsavel {
  id: string;
  nome: string;
  email: string | null;
}

export function useResponsaveis(): { responsaveis: Responsavel[]; isLoading: boolean } {
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResponsaveis = async () => {
      try {
        setIsLoading(true);
        console.log('Buscando responsáveis (usuários)...');
        
        // Buscar usuários da tabela profiles
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .not('full_name', 'is', null)
          .order('full_name');

        if (error) {
          console.error('Erro ao buscar responsáveis:', error);
          throw error;
        }

        const responsaveisFormatados: Responsavel[] = (data || []).map(r => ({
          id: r.id,
          nome: r.full_name || r.email || 'Usuário sem nome',
          email: r.email
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