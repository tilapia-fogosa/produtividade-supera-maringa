import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EventoVisualizador {
  id: string;
  titulo: string;
  descricao: string | null;
  data_evento: string;
  local: string | null;
  imagem_url: string | null;
}

// Hook para buscar eventos futuros públicos para o visualizador
export function useVisualizadorEventos(unitId?: string) {
  return useQuery({
    queryKey: ['visualizador-eventos', unitId],
    queryFn: async () => {
      if (!unitId) return [];
      
      const agora = new Date().toISOString();
      
      const { data: eventos, error } = await supabase
        .from('eventos')
        .select('id, titulo, descricao, data_evento, local, imagem_url')
        .eq('unit_id', unitId)
        .eq('active', true)
        .eq('publico', true)
        .gte('data_evento', agora)
        .order('data_evento', { ascending: true });

      if (error) throw error;

      return (eventos || []) as EventoVisualizador[];
    },
    enabled: !!unitId,
    refetchInterval: 60000, // Atualiza a cada 1 minuto
  });
}
