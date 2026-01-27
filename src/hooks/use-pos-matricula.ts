import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

export interface ClienteMatriculado {
  id: string;
  name: string;
  data_matricula: string;
  vendedor_nome: string | null;
}

export function usePosMatricula() {
  const { activeUnit } = useActiveUnit();

  return useQuery({
    queryKey: ["pos-matricula", activeUnit],
    queryFn: async (): Promise<ClienteMatriculado[]> => {
      // Busca atividades de matrícula em 2026
      let query = supabase
        .from("client_activities")
        .select(`
          id,
          created_at,
          client_id,
          clients!client_activities_client_id_fkey (
            id,
            name
          ),
          profiles:created_by (
            full_name
          )
        `)
        .eq("tipo_atividade", "Matricula")
        .gte("created_at", "2026-01-01T00:00:00")
        .lt("created_at", "2027-01-01T00:00:00")
        .order("created_at", { ascending: false });

      // Filtra por unidade se selecionada
      if (activeUnit?.id) {
        query = query.eq("unit_id", activeUnit.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Mapeia e remove duplicatas por client_id (pega a matrícula mais recente)
      const clientesMap = new Map<string, ClienteMatriculado>();

      data?.forEach((activity: any) => {
        const clientId = activity.clients?.id;
        if (clientId && !clientesMap.has(clientId)) {
          clientesMap.set(clientId, {
            id: clientId,
            name: activity.clients.name || "Sem nome",
            data_matricula: activity.created_at,
            vendedor_nome: activity.profiles?.full_name || null,
          });
        }
      });

      return Array.from(clientesMap.values());
    },
    enabled: true,
  });
}
