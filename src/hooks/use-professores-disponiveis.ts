import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

export type ProfessorDisponivel = {
  professor_id: string;
  professor_nome: string;
  prioridade: number;
};

export const useProfessoresDisponiveis = (
  data: Date | null,
  horarioInicio: string | null,
  duracaoMinutos: number = 60,
  unitId?: string | null
) => {
  const { activeUnit } = useActiveUnit();
  const effectiveUnitId = unitId !== undefined ? unitId : activeUnit?.id;

  return useQuery({
    queryKey: ["professores-disponiveis", data?.toISOString().split('T')[0], horarioInicio, duracaoMinutos, effectiveUnitId],
    queryFn: async () => {
      if (!data || !horarioInicio) return [];

      // Calcular horário fim baseado na duração
      const [hora, minuto] = horarioInicio.split(':').map(Number);
      const totalMinutos = hora * 60 + minuto + duracaoMinutos;
      const horarioFim = `${String(Math.floor(totalMinutos / 60)).padStart(2, '0')}:${String(totalMinutos % 60).padStart(2, '0')}`;

      console.log('Buscando professores disponíveis para:', {
        data: data.toISOString().split('T')[0],
        horarioInicio,
        horarioFim,
        unitId: effectiveUnitId || 'Nenhuma unidade'
      });

      const { data: result, error } = await supabase.rpc(
        "get_professores_disponiveis_por_horario",
        {
          p_data: data.toISOString().split('T')[0],
          p_horario_inicio: horarioInicio,
          p_horario_fim: horarioFim,
          p_unit_id: effectiveUnitId || undefined,
        }
      );

      console.log('Professores disponíveis:', { result, error });

      if (error) throw error;
      return result as ProfessorDisponivel[];
    },
    enabled: !!data && !!horarioInicio,
  });
};
