import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type HorarioDisponivel = {
  horario_inicio: string;
  horario_fim: string;
  total_salas_livres: number;
  salas_livres_ids: string[];
};

export const useHorariosDisponiveisSalas = (data: Date | null, unitId?: string | null) => {
  return useQuery({
    queryKey: ["horarios-disponiveis-salas", data?.toISOString().split('T')[0], unitId || 'all'],
    queryFn: async () => {
      if (!data) return [];
      
      console.log('Buscando horários para:', {
        data: data.toISOString().split('T')[0],
        unitId: unitId || 'todas as unidades'
      });
      
      const params: any = {
        p_data: data.toISOString().split('T')[0],
      };
      
      // Só adiciona unitId se estiver definido
      if (unitId) {
        params.p_unit_id = unitId;
      }
      
      const { data: result, error } = await supabase.rpc(
        "get_horarios_disponiveis_salas",
        params
      );

      console.log('Resultado horários:', { result, error });

      if (error) throw error;
      return result as HorarioDisponivel[];
    },
    enabled: !!data,
  });
};
