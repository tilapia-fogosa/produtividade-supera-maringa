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
  total_funcionarios_ativos: number;
  total_reposicoes: number;
  total_aulas_experimentais: number;
  total_faltas_futuras: number;
  created_at: string;
};

export const useCalendarioTurmas = (dataInicio: Date, dataFim: Date) => {
  return useQuery({
    queryKey: ["calendario-turmas", dataInicio.toISOString().split('T')[0], dataFim.toISOString().split('T')[0]],
    queryFn: async () => {
      console.log('🗓️ useCalendarioTurmas - Período:', {
        inicio: dataInicio.toISOString().split('T')[0],
        fim: dataFim.toISOString().split('T')[0]
      });
      
      const { data, error } = await supabase.rpc("get_calendario_turmas_semana_com_reposicoes", {
        p_data_inicio: dataInicio.toISOString().split('T')[0],
        p_data_fim: dataFim.toISOString().split('T')[0]
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