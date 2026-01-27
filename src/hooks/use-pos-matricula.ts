import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

export interface ClienteMatriculado {
  id: string;
  name: string;
  data_matricula: string;
  created_by: string | null;
  vendedor_nome: string | null;
}

export function usePosMatricula() {
  const { activeUnit } = useActiveUnit();

  return useQuery({
    queryKey: ["pos-matricula", activeUnit],
    queryFn: async (): Promise<ClienteMatriculado[]> => {
      // Busca atividades de matrícula após 01/01/2026
      let query = supabase
        .from("client_activities")
        .select(`
          id,
          created_at,
          created_by,
          clients!client_activities_client_id_fkey (
            id,
            name
          )
        `)
        .eq("tipo_atividade", "Matricula")
        .gte("created_at", "2026-01-01T00:00:00")
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
            created_by: activity.created_by,
            vendedor_nome: null,
          });
        }
      });

      // Buscar nomes dos vendedores
      const createdByIds = [...new Set(
        Array.from(clientesMap.values())
          .map(c => c.created_by)
          .filter(Boolean)
      )] as string[];

      let profilesMap = new Map<string, string>();

      if (createdByIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", createdByIds);

        profiles?.forEach((p: any) => {
          profilesMap.set(p.id, p.full_name);
        });
      }

      // Retornar com nome do vendedor
      return Array.from(clientesMap.values()).map(cliente => ({
        ...cliente,
        vendedor_nome: cliente.created_by ? profilesMap.get(cliente.created_by) || null : null,
      }));
    },
    enabled: true,
  });
}
