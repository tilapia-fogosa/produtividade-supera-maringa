import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CalendarioTurma = {
  turma_id: string;
  unit_id: string;
  nome_completo: string;
  dia_semana: string;
  sala: string;
  professor_id: string;
  professor_nome: string;
  professor_slack: string;
  horario_inicio: string;
  categoria: string;
  total_alunos_ativos: number;
  total_reposicoes: number;
  total_aulas_experimentais: number;
  created_at: string;
};

export const useCalendarioTurmas = (dataConsulta: Date) => {
  return useQuery({
    queryKey: ["calendario-turmas", dataConsulta.toISOString().split('T')[0]],
    queryFn: async () => {
      // Calcular início e fim da semana (segunda a sábado)
      const startOfWeek = new Date(dataConsulta);
      const dayOfWeek = startOfWeek.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startOfWeek.setDate(startOfWeek.getDate() - daysToMonday);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 5); // Segunda a sábado (6 dias)
      
      console.log('🗓️ useCalendarioTurmas - Data consulta:', dataConsulta.toISOString().split('T')[0]);
      console.log('🗓️ useCalendarioTurmas - Período:', {
        inicio: startOfWeek.toISOString().split('T')[0],
        fim: endOfWeek.toISOString().split('T')[0]
      });
      
      const { data, error } = await supabase.rpc("get_calendario_turmas_semana_com_reposicoes", {
        p_data_inicio: startOfWeek.toISOString().split('T')[0],
        p_data_fim: endOfWeek.toISOString().split('T')[0]
      });
      
      if (error) {
        console.error('❌ Erro ao buscar turmas do calendário:', error);
        throw error;
      }
      
      console.log('✅ Dados retornados get_calendario_turmas_semana_com_reposicoes:', data?.length || 0, 'turmas');
      
      // Agrupar por dia da semana
      const turmasPorDia = (data as CalendarioTurma[]).reduce((acc, turma) => {
        if (!acc[turma.dia_semana]) {
          acc[turma.dia_semana] = [];
        }
        acc[turma.dia_semana].push(turma);
        return acc;
      }, {} as Record<string, CalendarioTurma[]>);
      
      return turmasPorDia;
    }
  });
};