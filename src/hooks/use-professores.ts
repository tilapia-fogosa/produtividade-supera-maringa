import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Professor {
  id: string;
  nome: string;
  prioridade?: number;
}

export const useProfessores = () => {
  const { data: professores = [], isLoading } = useQuery({
    queryKey: ["professores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professores")
        .select("id, nome, prioridade")
        .eq("status", true)
        .order("prioridade", { ascending: true, nullsFirst: false })
        .order("nome");

      if (error) throw error;
      return data as Professor[];
    },
  });

  return { professores, isLoading };
};
