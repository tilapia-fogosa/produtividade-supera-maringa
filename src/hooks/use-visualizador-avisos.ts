import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AvisoVisualizador {
  id: string;
  nome: string;
  imagem_url: string;
  data_inicio: string;
  data_fim: string;
}

// Hook para buscar avisos ativos e dentro do período válido
export function useVisualizadorAvisos(unitId?: string) {
  return useQuery({
    queryKey: ['visualizador-avisos', unitId],
    queryFn: async () => {
      if (!unitId) return [];
      
      const hoje = new Date().toISOString().split('T')[0];
      
      const { data: avisos, error } = await supabase
        .from('avisos')
        .select('id, nome, imagem_url, data_inicio, data_fim')
        .eq('unit_id', unitId)
        .eq('ativo', true)
        .lte('data_inicio', hoje)
        .gte('data_fim', hoje)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (avisos || []) as AvisoVisualizador[];
    },
    enabled: !!unitId,
    refetchInterval: 60000, // Atualiza a cada 1 minuto
  });
}
