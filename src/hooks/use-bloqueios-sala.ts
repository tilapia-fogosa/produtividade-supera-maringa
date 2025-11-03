import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BloqueioSala = {
  id: string;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  sala_id: string;
  sala_nome: string;
  tipo_evento: string;
  titulo: string;
  descricao: string | null;
  unit_id: string;
};

export const useBloqueiosSala = (dataInicio: Date, dataFim: Date, unitId?: string) => {
  return useQuery({
    queryKey: ["bloqueios-sala", dataInicio.toISOString().split('T')[0], dataFim.toISOString().split('T')[0], unitId],
    queryFn: async () => {
      console.log('🔒 useBloqueiosSala - Período:', {
        inicio: dataInicio.toISOString().split('T')[0],
        fim: dataFim.toISOString().split('T')[0],
        unitId
      });
      
      let query = supabase
        .from("vw_eventos_sala_expandidos")
        .select("*")
        .gte("data", dataInicio.toISOString().split('T')[0])
        .lte("data", dataFim.toISOString().split('T')[0]);
      
      if (unitId) {
        query = query.eq("unit_id", unitId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Erro ao buscar bloqueios de sala:', error);
        throw error;
      }
      
      console.log('✅ Dados retornados vw_eventos_sala_expandidos:', data?.length || 0, 'bloqueios');
      
      // Agrupar por dia da semana
      const bloqueiosPorDia = (data as BloqueioSala[]).reduce((acc, bloqueio) => {
        // Converter data para dia da semana
        const dataBloqueio = new Date(bloqueio.data + 'T00:00:00');
        const diaSemanaNum = dataBloqueio.getDay(); // 0 = domingo, 1 = segunda, etc
        
        // Mapear para nosso formato (segunda, terça, etc)
        const diasMap: Record<number, string> = {
          1: 'segunda',
          2: 'terça',
          3: 'quarta',
          4: 'quinta',
          5: 'sexta',
          6: 'sábado'
        };
        
        const diaSemana = diasMap[diaSemanaNum];
        
        if (diaSemana) {
          if (!acc[diaSemana]) {
            acc[diaSemana] = [];
          }
          acc[diaSemana].push(bloqueio);
        }
        
        return acc;
      }, {} as Record<string, BloqueioSala[]>);
      
      return bloqueiosPorDia;
    }
  });
};
