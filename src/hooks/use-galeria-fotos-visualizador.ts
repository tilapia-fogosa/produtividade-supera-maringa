import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GaleriaFotoVisualizador {
  id: string;
  nome: string;
  url: string;
  thumbnail_url: string | null;
  turma_id: string | null;
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
        .select('id, nome, url, thumbnail_url, turma_id, created_at')
        .eq('unit_id', unitId)
        .eq('visivel', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (fotos || []) as GaleriaFotoVisualizador[];
    },
    enabled: !!unitId,
    refetchInterval: 60000, // Atualiza a cada 1 minuto
  });
}

// Hook para buscar turmas ativas no horário atual
export function useTurmasAtivasAgora(unitId?: string) {
  return useQuery({
    queryKey: ['turmas-ativas-agora', unitId],
    queryFn: async () => {
      if (!unitId) return [];

      // Pegar hora atual em Brasília (UTC-3)
      const agora = new Date();
      const brasiliaOffset = -3 * 60; // -3 horas em minutos
      const localOffset = agora.getTimezoneOffset(); // offset local em minutos
      const diferencaMinutos = brasiliaOffset + localOffset;
      
      const agoraBrasilia = new Date(agora.getTime() + diferencaMinutos * 60 * 1000);
      
      const horaAtual = agoraBrasilia.getHours().toString().padStart(2, '0');
      const minutoAtual = agoraBrasilia.getMinutes().toString().padStart(2, '0');
      const horaAtualStr = `${horaAtual}:${minutoAtual}`;
      
      // Mapear dia da semana para o enum do banco
      const diasSemanaMap: Record<number, 'domingo' | 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado'> = {
        0: 'domingo',
        1: 'segunda',
        2: 'terca',
        3: 'quarta',
        4: 'quinta',
        5: 'sexta',
        6: 'sabado'
      };
      const diaSemanaAtual = diasSemanaMap[agoraBrasilia.getDay()];

      const { data: turmas, error } = await supabase
        .from('turmas')
        .select('id, nome, horario_inicio, horario_fim')
        .eq('unit_id', unitId)
        .eq('active', true)
        .eq('dia_semana', diaSemanaAtual)
        .lte('horario_inicio', horaAtualStr)
        .gte('horario_fim', horaAtualStr);

      if (error) throw error;

      return (turmas || []).map(t => t.id);
    },
    enabled: !!unitId,
    refetchInterval: 60000, // Atualiza a cada 1 minuto
  });
}
