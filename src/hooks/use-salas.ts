import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Sala = {
  id: string;
  nome: string;
  capacidade: number;
  recursos: string[];
  cor_calendario: string;
  unit_id: string;
  active: boolean;
};

export const useSalas = (unitId?: string) => {
  return useQuery({
    queryKey: ["salas", unitId],
    queryFn: async () => {
      let query = supabase
        .from("salas")
        .select("*")
        .eq("active", true)
        .order("nome");

      if (unitId) {
        query = query.eq("unit_id", unitId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Sala[];
    },
  });
};
