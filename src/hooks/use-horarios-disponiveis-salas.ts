import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type HorarioDisponivel = {
  horario_inicio: string;
  horario_fim: string;
  total_salas_livres: number;
  salas_livres_ids: string[];
};

export const useHorariosDisponiveisSalas = (data: Date | null, unitId: string) => {
  return useQuery({
    queryKey: ["horarios-disponiveis-salas", data?.toISOString().split('T')[0], unitId],
    queryFn: async () => {
      if (!data) return [];
      
      const { data: result, error } = await supabase.rpc(
        "get_horarios_disponiveis_salas",
        {
          p_data: data.toISOString().split('T')[0],
          p_unit_id: unitId,
        }
      );

      if (error) throw error;
      return result as HorarioDisponivel[];
    },
    enabled: !!data && !!unitId,
  });
};
