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
  created_at: string;
};

export const useCalendarioTurmas = () => {
  return useQuery({
    queryKey: ["calendario-turmas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendario_turmas_view")
        .select("*");
      
      if (error) throw error;
      
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