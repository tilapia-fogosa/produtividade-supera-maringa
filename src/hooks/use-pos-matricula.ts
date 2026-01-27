import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

export interface ClienteMatriculado {
  id: string;
  name: string;
  phone_number: string | null;
  email: string | null;
  status: string | null;
  data_matricula: string;
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
            name,
            phone_number,
            email,
            status
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
            phone_number: activity.clients.phone_number,
            email: activity.clients.email,
            status: activity.clients.status,
            data_matricula: activity.created_at,
          });
        }
      });

      return Array.from(clientesMap.values());
    },
    enabled: true,
  });
}
