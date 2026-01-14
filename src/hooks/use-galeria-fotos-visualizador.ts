import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GaleriaFotoVisualizador {
  id: string;
  nome: string;
  url: string;
  thumbnail_url: string | null;
  created_at: string;
}

// Hook específico para o visualizador - não requer autenticação
export function useGaleriaFotosVisualizador(unitId?: string) {
  return useQuery({
    queryKey: ['galeria-fotos-visualizador', unitId],
    queryFn: async () => {
      if (!unitId) return [];
      
      const { data: fotos, error } = await supabase
        .from('galeria_fotos')
        .select('id, nome, url, thumbnail_url, created_at')
        .eq('unit_id', unitId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (fotos || []) as GaleriaFotoVisualizador[];
    },
    enabled: !!unitId,
    refetchInterval: 60000, // Atualiza a cada 1 minuto
  });
}
