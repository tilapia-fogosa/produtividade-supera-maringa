import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

export interface TurmaBasica {
    id: string;
    nome: string;
}

export function useTurmas() {
    const { activeUnit } = useActiveUnit();

    return useQuery({
        queryKey: ["turmas-basicas", activeUnit?.id],
        queryFn: async () => {
            const query = supabase
                .from("turmas")
                .select("id, nome")
                .order("nome");

            const { data, error } = activeUnit?.id
                ? await query.eq("unit_id", activeUnit.id)
                : await query;

            if (error) throw error;
            return data as TurmaBasica[];
        },
    });
}
