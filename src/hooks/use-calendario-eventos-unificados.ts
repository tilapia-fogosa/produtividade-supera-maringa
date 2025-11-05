import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CalendarioEvento = {
  evento_id: string;
  tipo_evento: 'turma' | 'evento_sala';
  unit_id: string;
  dia_semana: string;
  horario_inicio: string;
  horario_fim: string;
  sala_id: string;
  sala_nome: string;
  sala_cor: string;
  titulo: string;
  descricao: string;
  professor_id?: string;
  professor_nome?: string;
  professor_slack?: string;
  categoria?: string;
  data_especifica?: string;
  total_alunos_ativos: number;
  total_funcionarios_ativos: number;
  total_reposicoes: number;
  total_aulas_experimentais: number;
  total_faltas_futuras: number;
  created_at: string;
};

export const useCalendarioEventosUnificados = (
  dataInicio: Date, 
  dataFim: Date, 
  unitId?: string
) => {
  return useQuery({
    queryKey: ["calendario-eventos-unificados", 
               dataInicio.toISOString().split('T')[0], 
               dataFim.toISOString().split('T')[0], 
               unitId],
    queryFn: async () => {
      console.log('🗓️ useCalendarioEventosUnificados - Período:', {
        inicio: dataInicio.toISOString().split('T')[0],
        fim: dataFim.toISOString().split('T')[0],
        unitId
      });
      
      const { data, error } = await supabase.rpc(
        "get_calendario_eventos_unificados",
        {
          p_data_inicio: dataInicio.toISOString().split('T')[0],
          p_data_fim: dataFim.toISOString().split('T')[0],
          p_unit_id: unitId || null
        }
      );
      
      if (error) {
        console.error('❌ Erro ao buscar eventos unificados:', error);
        throw error;
      }
      
      console.log('✅ Dados retornados get_calendario_eventos_unificados:', data?.length || 0, 'eventos');
      
      // Agrupar por dia da semana
      const eventosPorDia = (data as CalendarioEvento[]).reduce((acc, evento) => {
        if (!acc[evento.dia_semana]) {
          acc[evento.dia_semana] = [];
        }
        acc[evento.dia_semana].push(evento);
        return acc;
      }, {} as Record<string, CalendarioEvento[]>);
      
      return eventosPorDia;
    }
  });
};
