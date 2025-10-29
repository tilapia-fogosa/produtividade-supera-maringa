import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AgendaProfessor = {
  professor_id: string;
  professor_nome: string;
  dia_semana: string;
  horario_inicio: string;
  horario_fim: string;
  tipo: 'aula' | 'evento';
  titulo: string;
  turma_nome: string | null;
  sala: string | null;
  evento_id: string | null;
  turma_id: string | null;
  data: string | null;
};

export const useAgendaProfessores = (dataInicio: Date, dataFim: Date, unitId?: string | null) => {
  return useQuery({
    queryKey: ["agenda-professores", dataInicio.toISOString().split('T')[0], dataFim.toISOString().split('T')[0], unitId],
    queryFn: async () => {
      const params: any = {
        p_data_inicio: dataInicio.toISOString().split('T')[0],
        p_data_fim: dataFim.toISOString().split('T')[0]
      };
      
      if (unitId) {
        params.p_unit_id = unitId;
      }
      
      const { data, error } = await supabase.rpc("get_agenda_professores_semana", params);
      
      if (error) throw error;
      
      // Agrupar por professor
      const agendaPorProfessor = (data as AgendaProfessor[]).reduce((acc, item) => {
        if (!acc[item.professor_id]) {
          acc[item.professor_id] = {
            professor_id: item.professor_id,
            professor_nome: item.professor_nome,
            eventos: []
          };
        }
        acc[item.professor_id].eventos.push(item);
        return acc;
      }, {} as Record<string, { professor_id: string; professor_nome: string; eventos: AgendaProfessor[] }>);
      
      return agendaPorProfessor;
    }
  });
};
