import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

export interface Professor {
  id: string;
  nome: string;
  prioridade?: number;
}

export const useProfessores = (unitId?: string | null) => {
  const { activeUnit } = useActiveUnit();
  const effectiveUnitId = unitId !== undefined ? unitId : activeUnit?.id;

  const { data: professores = [], isLoading } = useQuery({
    queryKey: ["professores", effectiveUnitId],
    queryFn: async () => {
      let query = supabase
        .from("professores")
        .select("id, nome, prioridade")
        .eq("status", true)
        .order("prioridade", { ascending: true, nullsFirst: false })
        .order("nome");

      if (effectiveUnitId) {
        query = query.eq("unit_id", effectiveUnitId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Professor[];
    },
  });

  return { professores, isLoading };
};
